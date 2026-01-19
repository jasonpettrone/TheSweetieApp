import path from 'path';
import { KNOWLEDGE_BASE_DIR } from '../config/index.js';
import { readJsonFile, writeJsonFile, getTodayDate } from '../utils/fileUtils.js';
import logger from '../utils/logger.js';

const KNOWLEDGE_FILE = path.join(KNOWLEDGE_BASE_DIR, 'shared-context.json');
const DECISIONS_FILE = path.join(KNOWLEDGE_BASE_DIR, 'decisions.json');
const LEARNINGS_FILE = path.join(KNOWLEDGE_BASE_DIR, 'learnings.json');

/**
 * Knowledge Base - shared context for all agents
 * Provides persistence and context restoration when agents spin up
 */
export class KnowledgeBase {
    constructor() {
        this.projectState = {};
        this.decisions = [];
        this.learnings = [];
        this.recentActivities = [];
    }

    /**
     * Load knowledge base from disk
     */
    async load() {
        this.projectState = await readJsonFile(KNOWLEDGE_FILE, {
            projectName: 'website',
            techStack: [],
            structure: {},
            features: [],
            lastUpdated: null,
        });

        this.decisions = await readJsonFile(DECISIONS_FILE, []);
        this.learnings = await readJsonFile(LEARNINGS_FILE, []);

        logger.debug('Knowledge base loaded');
    }

    /**
     * Save knowledge base to disk
     */
    async save() {
        this.projectState.lastUpdated = new Date().toISOString();
        await writeJsonFile(KNOWLEDGE_FILE, this.projectState);
        await writeJsonFile(DECISIONS_FILE, this.decisions);
        await writeJsonFile(LEARNINGS_FILE, this.learnings);
    }

    /**
     * Update project state
     */
    updateProjectState(updates) {
        Object.assign(this.projectState, updates);
    }

    /**
     * Record a decision
     */
    addDecision(agentId, decision, rationale) {
        this.decisions.push({
            id: `dec-${Date.now()}`,
            agentId,
            decision,
            rationale,
            timestamp: new Date().toISOString(),
        });

        // Keep only recent decisions
        if (this.decisions.length > 100) {
            this.decisions = this.decisions.slice(-100);
        }
    }

    /**
     * Record a learning
     */
    addLearning(agentId, learning, context = null) {
        this.learnings.push({
            id: `learn-${Date.now()}`,
            agentId,
            learning,
            context,
            timestamp: new Date().toISOString(),
        });

        // Keep only recent learnings
        if (this.learnings.length > 100) {
            this.learnings = this.learnings.slice(-100);
        }
    }

    /**
     * Record an activity
     */
    addActivity(agentId, action, details = {}) {
        this.recentActivities.push({
            agentId,
            action,
            details,
            timestamp: new Date().toISOString(),
        });

        // Keep only last 50 activities
        if (this.recentActivities.length > 50) {
            this.recentActivities = this.recentActivities.slice(-50);
        }
    }

    /**
     * Get context summary for an agent
     */
    getContextForAgent(agentId) {
        return {
            projectState: this.projectState,
            recentDecisions: this.decisions.slice(-10),
            recentLearnings: this.learnings.slice(-10),
            recentActivities: this.recentActivities.slice(-20),
        };
    }

    /**
     * Get full knowledge summary
     */
    getSummary() {
        return {
            project: this.projectState.projectName,
            techStack: this.projectState.techStack,
            featuresCount: this.projectState.features?.length || 0,
            decisionsCount: this.decisions.length,
            learningsCount: this.learnings.length,
            lastUpdated: this.projectState.lastUpdated,
        };
    }
}

export default KnowledgeBase;
