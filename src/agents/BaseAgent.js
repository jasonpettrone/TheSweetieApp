import { GoogleGenerativeAI } from '@google/generative-ai';
import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import config, {
    GEMINI_MODEL,
    MAX_REQUESTS_PER_DAY,
    AGENT_STATE_DIR,
    WORKING_DIR,
    PROJECT_ROOT,
    GITHUB_REMOTE,
    DEFAULT_BRANCH,
    getApiKey
} from '../config/index.js';
import { safeWriteFile, safeReadFile, safeDeleteFile, readJsonFile, writeJsonFile, getTodayDate, fileExists } from '../utils/fileUtils.js';
import logger from '../utils/logger.js';
import {
    getInvariantsPrompt,
    validateGitOperation,
    validateFileOperation,
    validateFileSize,
    validateCommitMessage,
    INVARIANTS
} from '../safety/invariants.js';
import auditLogger from '../audit/logger.js';

/**
 * Base Agent class - foundation for all AI agents
 * ALL agents are cross-functional generalists who can perform ANY role
 * Primary role is a guideline for organization, not a restriction
 * 
 * SAFETY: All operations validated against invariants
 * AUDITING: All requests and tool calls logged to database
 */
export class BaseAgent {
    constructor(agentConfig) {
        this.id = agentConfig.id;
        this.name = agentConfig.name;
        this.primaryRole = agentConfig.primaryRole;
        this.currentRole = agentConfig.primaryRole;
        this.apiKeyEnv = agentConfig.apiKeyEnv;

        this.requestsToday = 0;
        this.lastResetDate = null;
        this.genAI = null;
        this.model = null;
        this.git = simpleGit(PROJECT_ROOT);

        // Current request tracking for audit
        this.currentRequestId = null;
    }

    async initialize() {
        try {
            const apiKey = getApiKey({ apiKeyEnv: this.apiKeyEnv, name: this.name });
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: GEMINI_MODEL,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                }
            });

            await this.loadState();
            logger.success(`Initialized`, this.name);
            return true;
        } catch (error) {
            logger.error(`Failed to initialize: ${error.message}`, this.name);
            return false;
        }
    }

    switchRole(newRole) {
        const validRoles = ['developer', 'qa', 'manager', 'product', 'scrum'];
        if (validRoles.includes(newRole)) {
            logger.info(`Switching from ${this.currentRole} to ${newRole}`, this.name);
            this.currentRole = newRole;
            return true;
        }
        return false;
    }

    resetRole() {
        this.currentRole = this.primaryRole;
    }

    canWork() {
        this.checkDayReset();
        return this.requestsToday < MAX_REQUESTS_PER_DAY;
    }

    getRemainingRequests() {
        this.checkDayReset();
        return MAX_REQUESTS_PER_DAY - this.requestsToday;
    }

    checkDayReset() {
        const today = getTodayDate();
        if (this.lastResetDate !== today) {
            this.requestsToday = 0;
            this.lastResetDate = today;
        }
    }

    async loadState() {
        const statePath = path.join(AGENT_STATE_DIR, `${this.id}.json`);
        const state = await readJsonFile(statePath, {});

        if (state.lastResetDate) {
            this.lastResetDate = state.lastResetDate;
            this.requestsToday = state.requestsToday || 0;
            this.checkDayReset();
        }
    }

    async saveState() {
        const statePath = path.join(AGENT_STATE_DIR, `${this.id}.json`);
        await writeJsonFile(statePath, {
            id: this.id,
            name: this.name,
            primaryRole: this.primaryRole,
            currentRole: this.currentRole,
            lastResetDate: this.lastResetDate,
            requestsToday: this.requestsToday,
            lastActive: new Date().toISOString(),
        });
    }

    /**
     * Think - use AI to reason. Includes invariants and audit logging.
     */
    async think(prompt, context = {}) {
        if (!this.canWork()) {
            logger.warn(`Daily limit reached (${MAX_REQUESTS_PER_DAY}/${MAX_REQUESTS_PER_DAY})`, this.name);
            return null;
        }

        const startTime = Date.now();

        try {
            // Build prompt with invariants
            const systemPrompt = this.getSystemPrompt(context);
            const invariantsPrompt = getInvariantsPrompt();
            const fullPrompt = `${systemPrompt}\n\n${invariantsPrompt}\n\n${prompt}`;

            // Log request start
            this.currentRequestId = auditLogger.startRequest(this.id, this.name, prompt);

            logger.agentAction(this.name, 'Thinking', prompt.slice(0, 50) + '...');

            const result = await this.model.generateContent(fullPrompt);
            const response = result.response.text();

            const durationMs = Date.now() - startTime;

            // Log request completion
            auditLogger.endRequest(response, null, durationMs, true);

            this.requestsToday++;
            await this.saveState();

            logger.debug(`Request ${this.requestsToday}/${MAX_REQUESTS_PER_DAY}`, this.name);

            return response;
        } catch (error) {
            const durationMs = Date.now() - startTime;
            auditLogger.endRequest(null, 0, durationMs, false, error.message);
            logger.error(`Think failed: ${error.message}`, this.name);
            return null;
        }
    }

    /**
     * Act - execute tool calls with invariant validation and audit logging
     */
    async act(plan) {
        if (!plan) return { success: false, error: 'No plan provided' };

        const actions = this.parseToolCalls(plan);
        const results = [];

        // Enforce max tool calls per request
        if (actions.length > INVARIANTS.execution.maxToolCallsPerRequest) {
            logger.warn(`Too many tool calls (${actions.length}), limiting to ${INVARIANTS.execution.maxToolCallsPerRequest}`, this.name);
            actions.length = INVARIANTS.execution.maxToolCallsPerRequest;
        }

        for (const action of actions) {
            const startTime = Date.now();
            const toolCallId = auditLogger.logToolCall(this.id, action.tool, action.args);

            try {
                // Validate tool call against invariants
                const validation = this.validateToolCall(action.tool, action.args);
                if (!validation.valid) {
                    // Log violation
                    auditLogger.logViolation(
                        this.id,
                        validation.invariant,
                        action.tool,
                        action.args[0] || '',
                        validation.reason,
                        true
                    );

                    const durationMs = Date.now() - startTime;
                    auditLogger.completeToolCall(toolCallId, null, false, validation.reason, durationMs);

                    results.push({ tool: action.tool, success: false, error: `BLOCKED: ${validation.reason}` });
                    continue;
                }

                logger.agentAction(this.name, `Executing: ${action.tool}`, action.args?.[0] || '');
                const result = await this.executeTool(action.tool, action.args);

                const durationMs = Date.now() - startTime;
                auditLogger.completeToolCall(toolCallId, result, true, null, durationMs);

                results.push({ tool: action.tool, success: true, result });
            } catch (error) {
                const durationMs = Date.now() - startTime;
                auditLogger.completeToolCall(toolCallId, null, false, error.message, durationMs);

                results.push({ tool: action.tool, success: false, error: error.message });
                logger.error(`Tool ${action.tool} failed: ${error.message}`, this.name);
            }
        }

        return { success: true, actions: results };
    }

    /**
     * Validate a tool call against invariants
     */
    validateToolCall(tool, args) {
        // File operations
        if (['writeFile', 'deleteFile', 'mkdir'].includes(tool)) {
            const filePath = args[0] || '';
            const validation = validateFileOperation(
                tool === 'writeFile' ? 'write' : tool === 'deleteFile' ? 'delete' : 'create',
                filePath
            );
            if (!validation.valid) return validation;

            // Also check file size for writes
            if (tool === 'writeFile' && args[1]) {
                const sizeValidation = validateFileSize(args[1]);
                if (!sizeValidation.valid) return sizeValidation;
            }
        }

        // Git checkout/merge validation
        if (['gitCheckout', 'gitMerge'].includes(tool)) {
            const branch = args[0] || '';
            return validateGitOperation(tool.replace('git', '').toLowerCase(), branch);
        }

        // Git commit message validation
        if (tool === 'gitCommit') {
            const message = args[0] || '';
            return validateCommitMessage(`[${this.name}] ${message}`);
        }

        // Git push validation (no force push)
        if (['gitPush', 'gitPushNewBranch'].includes(tool)) {
            const args_str = args.join(' ');
            if (args_str.includes('--force') || args_str.includes('-f')) {
                return { valid: false, reason: 'Force push is not allowed', invariant: 'git.blockedOperations' };
            }
        }

        return { valid: true };
    }

    parseToolCalls(text) {
        const toolPattern = /<tool:(\w+)>([\s\S]*?)<\/tool>/g;
        const actions = [];
        let match;

        while ((match = toolPattern.exec(text)) !== null) {
            const [, tool, argsStr] = match;
            const args = argsStr.split('|').map(a => a.trim());
            actions.push({ tool, args });
        }

        return actions;
    }

    async executeTool(toolName, args) {
        const tools = this.getTools();

        if (!tools[toolName]) {
            throw new Error(`Unknown tool: ${toolName}`);
        }

        return await tools[toolName](...args);
    }

    getTools() {
        return {
            // === FILE OPERATIONS ===
            readFile: async (filePath) => {
                const fullPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
                return await safeReadFile(fullPath);
            },

            writeFile: async (filePath, content) => {
                const fullPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
                await safeWriteFile(fullPath, content, this.id);
                return `File written: ${filePath}`;
            },

            deleteFile: async (filePath) => {
                const fullPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
                await safeDeleteFile(fullPath, this.id);
                return `File deleted: ${filePath}`;
            },

            listDir: async (dirPath = '.') => {
                const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(PROJECT_ROOT, dirPath);
                const files = await fs.readdir(fullPath, { withFileTypes: true });
                return files.map(f => ({
                    name: f.name,
                    type: f.isDirectory() ? 'directory' : 'file'
                }));
            },

            mkdir: async (dirPath) => {
                const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(PROJECT_ROOT, dirPath);
                await fs.mkdir(fullPath, { recursive: true });
                return `Directory created: ${dirPath}`;
            },

            exists: async (filePath) => {
                const fullPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
                return await fileExists(fullPath);
            },

            // === GIT BASIC ===
            gitStatus: async () => {
                return await this.git.status();
            },

            gitAdd: async (files) => {
                await this.git.add(files);
                return `Staged: ${files}`;
            },

            gitCommit: async (message) => {
                await this.git.commit(`[${this.name}] ${message}`);
                return `Committed: ${message}`;
            },

            gitLog: async (count = 5) => {
                const log = await this.git.log({ maxCount: parseInt(count) });
                return log.all;
            },

            // === GIT BRANCHES ===
            gitBranch: async () => {
                const branches = await this.git.branchLocal();
                return { current: branches.current, all: branches.all };
            },

            gitCreateBranch: async (branchName) => {
                await this.git.checkoutLocalBranch(branchName);
                return `Created and switched to branch: ${branchName}`;
            },

            gitCheckout: async (branchName) => {
                await this.git.checkout(branchName);
                return `Switched to branch: ${branchName}`;
            },

            gitMerge: async (branchName) => {
                await this.git.merge([branchName]);
                return `Merged branch: ${branchName}`;
            },

            gitDeleteBranch: async (branchName) => {
                await this.git.deleteLocalBranch(branchName);
                return `Deleted branch: ${branchName}`;
            },

            // === GIT REMOTE ===
            gitPull: async (branch = DEFAULT_BRANCH) => {
                await this.git.pull(GITHUB_REMOTE, branch);
                return `Pulled from ${GITHUB_REMOTE}/${branch}`;
            },

            gitPush: async (branch = null) => {
                const currentBranch = branch || (await this.git.branchLocal()).current;
                await this.git.push(GITHUB_REMOTE, currentBranch);
                return `Pushed to ${GITHUB_REMOTE}/${currentBranch}`;
            },

            gitPushNewBranch: async (branchName) => {
                await this.git.push(['-u', GITHUB_REMOTE, branchName]);
                return `Pushed new branch ${branchName} to remote`;
            },

            gitFetch: async () => {
                await this.git.fetch();
                return 'Fetched from remote';
            },

            gitPrepareForPR: async (featureBranch, description) => {
                const status = await this.git.status();
                if (status.files.length > 0) {
                    await this.git.add('.');
                    await this.git.commit(`[${this.name}] ${description}`);
                }
                await this.git.push(['-u', GITHUB_REMOTE, featureBranch]);
                return `Branch ${featureBranch} pushed. Create PR at: https://github.com/${config.GITHUB_REPO}/compare/${DEFAULT_BRANCH}...${featureBranch}`;
            },

            // === RUN TESTS ===
            runTests: async () => {
                // TODO: Implement test running
                return 'Tests passed';
            },
        };
    }

    getSystemPrompt(context = {}) {
        return `You are ${this.name}, a member of an AI software development team.

PRIMARY ROLE: ${this.primaryRole}
CURRENT ROLE: ${this.currentRole}

🎯 CRITICAL PRINCIPLES:
1. EFFICIENCY IS PARAMOUNT - Every API request must produce maximum value
2. YOU ARE A GENERALIST - You can perform ANY role: developer, QA, product, management
3. QUALITY OVER SIMULATION - Focus on real output, not role-playing
4. STEP OUTSIDE BOUNDARIES - If the team needs help, pivot to any role instantly

YOUR CAPABILITIES (regardless of assigned role):
- Write and edit code (any language, any part of the stack)
- Review and test code
- Create user stories and requirements
- Assign and manage tasks
- Fix bugs and improve existing code
- Create PRs and manage git workflow

AVAILABLE TOOLS - use <tool:name>args|separated|by|pipe</tool>:

FILE OPERATIONS:
- readFile: Read a file. Args: filePath
- writeFile: Write content. Args: filePath|content
- deleteFile: Delete a file. Args: filePath
- listDir: List directory. Args: dirPath (optional)
- mkdir: Create directory. Args: dirPath
- exists: Check if file exists. Args: filePath

GIT BASIC:
- gitStatus: Get status. No args.
- gitAdd: Stage files. Args: files (or '.')
- gitCommit: Commit. Args: message (use format: [type] description)
- gitLog: Recent commits. Args: count (optional)

GIT BRANCHES:
- gitBranch: List branches. No args.
- gitCreateBranch: Create and switch. Args: branchName
- gitCheckout: Switch branch. Args: branchName
- gitMerge: Merge branch. Args: branchName
- gitDeleteBranch: Delete branch. Args: branchName

GIT REMOTE (GitHub):
- gitPull: Pull from remote. Args: branch (optional)
- gitPush: Push to remote. Args: branch (optional)
- gitPushNewBranch: Push new branch. Args: branchName
- gitFetch: Fetch from remote. No args.
- gitPrepareForPR: Prepare and push for PR. Args: branchName|description

Current context:
${JSON.stringify(context, null, 2)}`;
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            primaryRole: this.primaryRole,
            currentRole: this.currentRole,
            requestsUsed: this.requestsToday,
            requestsRemaining: this.getRemainingRequests(),
            canWork: this.canWork(),
        };
    }
}

export default BaseAgent;
