import path from 'path';
import fs from 'fs/promises';
import config, { AGENTS, WORKING_DIR, DAILY_PROGRESS_DIR, AGENT_USAGE_DIR } from '../config/index.js';
import { writeJsonFile, getTodayDate } from '../utils/fileUtils.js';
import logger from '../utils/logger.js';
import auditLogger from '../audit/logger.js';

import { EngineeringManager } from '../agents/EngineeringManager.js';
import { ProductOwner } from '../agents/ProductOwner.js';
import { ScrumMaster } from '../agents/ScrumMaster.js';
import { Developer } from '../agents/Developer.js';
import { QAEngineer } from '../agents/QAEngineer.js';
import { FlexAgent } from '../agents/FlexAgent.js';

import TaskParser from '../tasks/TaskParser.js';
import TaskBoard from '../tasks/TaskBoard.js';
import KnowledgeBase from './KnowledgeBase.js';

/**
 * Day Simulator - orchestrates a simulated work day
 */
export class DaySimulator {
    constructor() {
        this.agents = {};
        this.taskParser = new TaskParser();
        this.taskBoard = new TaskBoard();
        this.knowledgeBase = new KnowledgeBase();
        this.dayProgress = {
            date: getTodayDate(),
            phases: [],
            tasksCompleted: 0,
            totalRequests: 0,
        };
    }

    /**
     * Initialize all agents
     */
    async initialize() {
        logger.header('Initializing AI Development Team');

        // Create working directory if it doesn't exist
        await fs.mkdir(WORKING_DIR, { recursive: true });

        // Initialize each agent based on their role
        for (const agentConfig of AGENTS) {
            let agent;

            switch (agentConfig.primaryRole) {
                case 'manager':
                    agent = new EngineeringManager(agentConfig);
                    break;
                case 'product':
                    agent = new ProductOwner(agentConfig);
                    break;
                case 'scrum':
                    agent = new ScrumMaster(agentConfig);
                    break;
                case 'developer':
                    agent = new Developer(agentConfig);
                    break;
                case 'qa':
                    agent = new QAEngineer(agentConfig);
                    break;
                case 'flex':
                    agent = new FlexAgent(agentConfig);
                    break;
                default:
                    logger.warn(`Unknown role: ${agentConfig.role}`);
                    continue;
            }

            const initialized = await agent.initialize();
            if (initialized) {
                this.agents[agentConfig.id] = agent;
            }
        }

        // Load task board and knowledge base
        await this.taskBoard.load();
        await this.knowledgeBase.load();

        logger.success(`${Object.keys(this.agents).length} agents initialized`);
    }

    /**
     * Run a complete simulated day
     */
    async runDay() {
        logger.header(`🌅 Starting Day Simulation: ${getTodayDate()}`);

        // Start audit session for this day
        const sessionId = auditLogger.startSession();
        logger.info(`Audit session: ${sessionId}`);

        try {
            await this.initialize();

            // Phase 1: Morning Standup
            await this.morningPhase();

            // Phase 2: Sprint Work
            await this.workPhase();

            // Phase 3: End of Day
            await this.endOfDayPhase();

            // Save progress and state
            await this.saveProgress();

            // End audit session with stats
            auditLogger.endSession({
                agentsUsed: Object.keys(this.agents).join(','),
                tasksCompleted: this.dayProgress.tasksCompleted,
                totalRequests: this.dayProgress.totalRequests,
            });

            logger.header('🌙 Day Complete');
            logger.info(`Tasks completed: ${this.dayProgress.tasksCompleted}`);
            logger.info(`Total requests used: ${this.dayProgress.totalRequests}`);
            logger.info(`Audit session: ${sessionId}`);
        } catch (error) {
            auditLogger.endSession({
                agentsUsed: Object.keys(this.agents).join(','),
                tasksCompleted: this.dayProgress.tasksCompleted,
                totalRequests: this.dayProgress.totalRequests,
            });
            throw error;
        }
    }

    /**
     * Morning phase - standup and planning
     */
    async morningPhase() {
        logger.header('☀️ Morning Phase - Standup & Planning');
        const phaseStart = Date.now();

        // Parse CEO tasks
        const ceoTasks = await this.taskParser.parse();
        this.taskBoard.addToBacklog(ceoTasks);

        // Product Owner creates user stories
        const productOwner = this.agents['product-owner'];
        if (productOwner && productOwner.canWork() && ceoTasks.length > 0) {
            logger.info('Product Owner creating user stories...');
            const stories = await productOwner.parseTasksToStories(
                ceoTasks.map(t => t.description).join('\n- ')
            );
            if (stories) {
                try {
                    const parsed = JSON.parse(stories);
                    if (parsed.stories) {
                        this.taskBoard.addStories(parsed.stories);
                    }
                } catch (e) {
                    // Stories returned as text, that's ok
                }
            }
        }

        // Scrum Master facilitates standup
        const scrumMaster = this.agents['scrum-master'];
        if (scrumMaster && scrumMaster.canWork()) {
            const teamStatus = this.getTeamStatus();
            await scrumMaster.facilitateStandup(teamStatus);
        }

        // Save task board state
        await this.taskBoard.save();

        this.dayProgress.phases.push({
            name: 'morning',
            duration: Date.now() - phaseStart,
            tasksAdded: ceoTasks.length,
        });
    }

    /**
     * Work phase - agents work on tasks
     */
    async workPhase() {
        logger.header('💻 Work Phase - Development Sprint');
        const phaseStart = Date.now();
        let tasksWorkedOn = 0;

        // Get context for all agents
        const context = this.knowledgeBase.getContextForAgent('all');

        // Engineering Manager assigns tasks
        const engManager = this.agents['engineering-manager'];
        const developers = this.getDevelopers();

        // Work loop - continue while there's capacity
        let iterations = 0;
        const maxIterations = 10; // Safety limit

        while (this.hasAvailableCapacity() && iterations < maxIterations) {
            iterations++;

            // Get next task
            const task = this.taskBoard.getNextTask();
            if (!task) {
                logger.info('No more tasks in backlog');
                break;
            }

            // Find available developer
            const availableDev = developers.find(d => d.canWork());
            if (!availableDev) {
                logger.info('No developers with remaining capacity');
                break;
            }

            // Assign and work on task
            const assigned = this.taskBoard.assignTask(task.id, availableDev.id);
            if (assigned) {
                logger.agentAction(availableDev.name, 'Working on task', task.description);

                // Developer implements the task
                const result = await availableDev.implementStory({
                    title: task.description,
                    description: task.description,
                    acceptanceCriteria: [],
                });

                if (result && result.success) {
                    this.taskBoard.completeTask(task.id);
                    tasksWorkedOn++;
                    this.knowledgeBase.addActivity(availableDev.id, 'completed-task', { taskId: task.id });
                }
            }
        }

        // QA Engineers test completed features
        const qaEngineers = this.getQAEngineers();
        for (const qa of qaEngineers) {
            if (qa.canWork() && this.taskBoard.done.length > 0) {
                const recentTask = this.taskBoard.done[this.taskBoard.done.length - 1];
                await qa.performTesting(recentTask.description, []);
            }
        }

        // Flex agent helps where needed
        const flexAgent = this.agents['flex-agent'];
        if (flexAgent && flexAgent.canWork()) {
            await flexAgent.adaptRole(this.getTeamStatus());
            const nextTask = this.taskBoard.getNextTask();
            if (nextTask) {
                await flexAgent.contribute(nextTask);
            }
        }

        // Self-improvement with remaining capacity
        await this.selfImprovementPhase();

        // Save task board
        await this.taskBoard.save();

        this.dayProgress.phases.push({
            name: 'work',
            duration: Date.now() - phaseStart,
            tasksWorkedOn,
        });

        this.dayProgress.tasksCompleted += tasksWorkedOn;
    }

    /**
     * Self-improvement phase - agents improve existing code
     */
    async selfImprovementPhase() {
        logger.header('🔧 Self-Improvement Phase');

        const developers = this.getDevelopers();

        for (const dev of developers) {
            if (dev.canWork() && dev.getRemainingRequests() > 5) {
                logger.agentAction(dev.name, 'Self-improvement', dev.specialty);
                await dev.selfImprove();
            }
        }
    }

    /**
     * End of day phase - reporting
     */
    async endOfDayPhase() {
        logger.header('📊 End of Day - Reporting');
        const phaseStart = Date.now();

        // Calculate total requests used
        for (const agent of Object.values(this.agents)) {
            this.dayProgress.totalRequests += agent.requestsToday;
        }

        // Save knowledge base
        await this.knowledgeBase.save();

        this.dayProgress.phases.push({
            name: 'end-of-day',
            duration: Date.now() - phaseStart,
        });
    }

    /**
     * Save daily progress report
     */
    async saveProgress() {
        const today = getTodayDate();

        // Save daily progress
        const progressFile = path.join(DAILY_PROGRESS_DIR, `${today}.json`);
        await writeJsonFile(progressFile, {
            ...this.dayProgress,
            taskBoard: this.taskBoard.getSummary(),
            knowledgeBase: this.knowledgeBase.getSummary(),
        });

        // Save agent usage
        const usageFile = path.join(AGENT_USAGE_DIR, `${today}.json`);
        const usage = {};
        for (const [id, agent] of Object.entries(this.agents)) {
            usage[id] = agent.getStatus();
        }
        await writeJsonFile(usageFile, usage);

        logger.success(`Progress saved to ${progressFile}`);
    }

    /**
     * Get team status summary
     */
    getTeamStatus() {
        const status = {};
        for (const [id, agent] of Object.entries(this.agents)) {
            status[id] = agent.getStatus();
        }
        return {
            agents: status,
            taskBoard: this.taskBoard.getSummary(),
        };
    }

    /**
     * Check if team has available capacity
     */
    hasAvailableCapacity() {
        return Object.values(this.agents).some(a => a.canWork());
    }

    /**
     * Get all developer agents
     */
    getDevelopers() {
        return Object.values(this.agents).filter(a => a.primaryRole === 'developer');
    }

    /**
     * Get all QA engineer agents
     */
    getQAEngineers() {
        return Object.values(this.agents).filter(a => a.primaryRole === 'qa');
    }
}

export default DaySimulator;
