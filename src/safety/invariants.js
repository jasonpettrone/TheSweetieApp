/**
 * AI Agent Invariant Rules
 * 
 * These rules MUST be followed by all AI agents at all times.
 * They are injected into every prompt and validated before tool execution.
 * 
 * CRITICAL: Violations are logged and blocked.
 */

export const INVARIANTS = {
    // ==========================================
    // GIT SAFETY RULES
    // ==========================================
    git: {
        // Default working branch for AI agents
        workingBranch: 'ai-main',

        // Branches AI can work on (can create feature branches off ai-main)
        allowedBranchPatterns: [
            'ai-main',
            'ai-feature/*',
            'ai-fix/*',
            'ai-refactor/*',
        ],

        // Branches AI can NEVER touch
        protectedBranches: ['main', 'master', 'production', 'release/*'],

        // Blocked git operations
        blockedOperations: [
            'push --force',
            'push -f',
            'reset --hard',
            'clean -fd',
            'checkout main',
            'checkout master',
            'merge main',
            'merge master',
        ],

        // Require before commits
        requireTestsBeforeCommit: true,
    },

    // ==========================================
    // FILE SYSTEM SAFETY RULES
    // ==========================================
    files: {
        // Paths agents can write to
        writablePaths: [
            'website/',
            'data/',
        ],

        // Paths that are strictly read-only
        readOnlyPaths: [
            'src/',           // Framework code
            'tests/',         // Test files (human controlled)
            'docker/',        // Docker config
            'Dockerfile',
            'docker-compose.yml',
            '.env',
            '.git/',
        ],

        // Files that can NEVER be modified
        protectedFiles: [
            'ceo-tasks.md',
            'package.json',      // Root package.json
            'package-lock.json',
        ],

        // File operation limits
        maxFileSize: 100 * 1024,  // 100KB max per file
        maxFilesPerOperation: 10,  // Max files created/modified per action

        // Blocked file patterns
        blockedPatterns: [
            '*.exe',
            '*.dll',
            '*.sh',  // No shell scripts in website
            '.env*',
        ],
    },

    // ==========================================
    // EXECUTION EFFICIENCY RULES
    // ==========================================
    execution: {
        // Max tool calls per AI request (encourage efficiency)
        maxToolCallsPerRequest: 10,

        // Minimum wait between requests (prevent rapid fire)
        minRequestIntervalMs: 1000,

        // Force test run before commits
        requireTestsBeforeCommit: true,

        // Max consecutive failures before stopping
        maxConsecutiveFailures: 3,
    },

    // ==========================================
    // CODE QUALITY RULES  
    // ==========================================
    quality: {
        // Require meaningful commit messages
        minCommitMessageLength: 10,

        // Commit message must start with type
        commitMessagePattern: /^\[(feat|fix|refactor|docs|test|style|chore)\]/,

        // No console.log in production code (except server)
        warnOnConsoleLogs: true,
    },
};

/**
 * Get invariants as text for injection into prompts
 */
export function getInvariantsPrompt() {
    return `
🚨 INVARIANT RULES - YOU MUST FOLLOW THESE AT ALL TIMES 🚨

GIT RULES:
- Work on branch: '${INVARIANTS.git.workingBranch}' or feature branches like 'ai-feature/*'
- NEVER touch these branches: ${INVARIANTS.git.protectedBranches.join(', ')}
- NEVER use: ${INVARIANTS.git.blockedOperations.slice(0, 5).join(', ')}
- Run tests before committing

FILE RULES:
- You can ONLY write to: ${INVARIANTS.files.writablePaths.join(', ')}
- These are READ-ONLY: ${INVARIANTS.files.readOnlyPaths.join(', ')}
- NEVER modify: ${INVARIANTS.files.protectedFiles.join(', ')}
- Max file size: 100KB

EFFICIENCY RULES:
- Be efficient - max ${INVARIANTS.execution.maxToolCallsPerRequest} tool calls per request
- Run 'npm test' in website/ before committing

COMMIT FORMAT:
- Use format: [type] message (e.g., [feat] Add search filter)
- Types: feat, fix, refactor, docs, test, style, chore

Violating these rules will result in your action being BLOCKED.
`;
}

/**
 * Validate a git operation against invariants
 */
export function validateGitOperation(operation, args = '') {
    const fullCommand = `${operation} ${args}`.toLowerCase().trim();

    // Check blocked operations
    for (const blocked of INVARIANTS.git.blockedOperations) {
        if (fullCommand.includes(blocked.toLowerCase())) {
            return {
                valid: false,
                reason: `Blocked git operation: ${blocked}`,
                invariant: 'git.blockedOperations',
            };
        }
    }

    // Check protected branches for checkout/merge
    if (operation === 'checkout' || operation === 'merge') {
        for (const protected_ of INVARIANTS.git.protectedBranches) {
            if (args.includes(protected_.replace('/*', ''))) {
                return {
                    valid: false,
                    reason: `Cannot ${operation} protected branch: ${args}`,
                    invariant: 'git.protectedBranches',
                };
            }
        }
    }

    return { valid: true };
}

/**
 * Validate a file operation against invariants
 */
export function validateFileOperation(operation, filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

    // Check protected files
    for (const protected_ of INVARIANTS.files.protectedFiles) {
        if (normalizedPath.endsWith(protected_.toLowerCase())) {
            return {
                valid: false,
                reason: `Cannot modify protected file: ${protected_}`,
                invariant: 'files.protectedFiles',
            };
        }
    }

    // Check read-only paths for write operations
    if (['write', 'delete', 'create'].includes(operation)) {
        for (const readOnly of INVARIANTS.files.readOnlyPaths) {
            if (normalizedPath.startsWith(readOnly.toLowerCase().replace('/', ''))) {
                return {
                    valid: false,
                    reason: `Cannot ${operation} in read-only path: ${readOnly}`,
                    invariant: 'files.readOnlyPaths',
                };
            }
        }

        // Check if in writable path
        const inWritablePath = INVARIANTS.files.writablePaths.some(wp =>
            normalizedPath.startsWith(wp.toLowerCase().replace('/', ''))
        );

        if (!inWritablePath) {
            return {
                valid: false,
                reason: `Path not in writable directories: ${filePath}`,
                invariant: 'files.writablePaths',
            };
        }
    }

    // Check blocked patterns
    for (const pattern of INVARIANTS.files.blockedPatterns) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(normalizedPath)) {
            return {
                valid: false,
                reason: `File matches blocked pattern: ${pattern}`,
                invariant: 'files.blockedPatterns',
            };
        }
    }

    return { valid: true };
}

/**
 * Validate file content size
 */
export function validateFileSize(content) {
    const size = Buffer.byteLength(content, 'utf-8');
    if (size > INVARIANTS.files.maxFileSize) {
        return {
            valid: false,
            reason: `File too large: ${size} bytes (max: ${INVARIANTS.files.maxFileSize})`,
            invariant: 'files.maxFileSize',
        };
    }
    return { valid: true };
}

/**
 * Validate commit message
 */
export function validateCommitMessage(message) {
    if (message.length < INVARIANTS.quality.minCommitMessageLength) {
        return {
            valid: false,
            reason: `Commit message too short (min: ${INVARIANTS.quality.minCommitMessageLength} chars)`,
            invariant: 'quality.minCommitMessageLength',
        };
    }

    if (!INVARIANTS.quality.commitMessagePattern.test(message)) {
        return {
            valid: false,
            reason: 'Commit message must start with [feat], [fix], [refactor], [docs], [test], [style], or [chore]',
            invariant: 'quality.commitMessagePattern',
        };
    }

    return { valid: true };
}

export default INVARIANTS;
