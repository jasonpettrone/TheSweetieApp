import fs from 'fs/promises';
import { CEO_TASKS_FILE } from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Task Parser - reads and parses CEO tasks from plain English
 */
export class TaskParser {
    constructor() {
        this.tasks = [];
    }

    /**
     * Parse the CEO tasks file
     */
    async parse() {
        try {
            const content = await fs.readFile(CEO_TASKS_FILE, 'utf-8');
            this.tasks = this.parseMarkdown(content);
            logger.info(`Parsed ${this.tasks.length} tasks from CEO`);
            return this.tasks;
        } catch (error) {
            logger.error(`Failed to parse CEO tasks: ${error.message}`);
            return [];
        }
    }

    /**
     * Parse markdown content into tasks
     */
    parseMarkdown(content) {
        const tasks = [];
        const lines = content.split('\n');

        let currentPriority = 'normal';
        let taskId = 1;

        for (const line of lines) {
            const trimmed = line.trim();

            // Detect priority sections
            if (trimmed.toLowerCase().includes('high priority')) {
                currentPriority = 'high';
                continue;
            } else if (trimmed.toLowerCase().includes('normal priority') ||
                trimmed.toLowerCase().includes('medium priority')) {
                currentPriority = 'normal';
                continue;
            } else if (trimmed.toLowerCase().includes('low priority')) {
                currentPriority = 'low';
                continue;
            }

            // Parse task lines (lines starting with -)
            if (trimmed.startsWith('-') && trimmed.length > 2) {
                const description = trimmed.slice(1).trim();

                // Skip empty or placeholder tasks
                if (description && !description.startsWith('<!--')) {
                    tasks.push({
                        id: `task-${taskId++}`,
                        description,
                        priority: currentPriority,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                    });
                }
            }
        }

        // Sort by priority
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return tasks;
    }

    /**
     * Get pending tasks
     */
    getPendingTasks() {
        return this.tasks.filter(t => t.status === 'pending');
    }

    /**
     * Get high priority tasks
     */
    getHighPriorityTasks() {
        return this.tasks.filter(t => t.priority === 'high' && t.status === 'pending');
    }
}

export default TaskParser;
