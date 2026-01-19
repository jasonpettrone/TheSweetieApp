import path from 'path';
import { DATA_DIR } from '../config/index.js';
import { readJsonFile, writeJsonFile, getTodayDate } from '../utils/fileUtils.js';
import logger from '../utils/logger.js';

const BOARD_FILE = path.join(DATA_DIR, 'task-board.json');

/**
 * Task Board - manages task lifecycle
 */
export class TaskBoard {
    constructor() {
        this.backlog = [];
        this.inProgress = [];
        this.inReview = [];
        this.done = [];
        this.stories = [];
    }

    /**
     * Load board state from disk
     */
    async load() {
        const data = await readJsonFile(BOARD_FILE, {
            backlog: [],
            inProgress: [],
            inReview: [],
            done: [],
            stories: [],
        });

        this.backlog = data.backlog || [];
        this.inProgress = data.inProgress || [];
        this.inReview = data.inReview || [];
        this.done = data.done || [];
        this.stories = data.stories || [];

        logger.debug(`Loaded task board: ${this.backlog.length} backlog, ${this.inProgress.length} in progress`);
    }

    /**
     * Save board state to disk
     */
    async save() {
        await writeJsonFile(BOARD_FILE, {
            backlog: this.backlog,
            inProgress: this.inProgress,
            inReview: this.inReview,
            done: this.done,
            stories: this.stories,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Add CEO tasks to backlog
     */
    addToBacklog(tasks) {
        for (const task of tasks) {
            // Avoid duplicates
            if (!this.backlog.find(t => t.description === task.description)) {
                this.backlog.push(task);
            }
        }
    }

    /**
     * Add user stories
     */
    addStories(stories) {
        for (const story of stories) {
            if (!this.stories.find(s => s.id === story.id)) {
                this.stories.push(story);
            }
        }
    }

    /**
     * Assign a task to a developer
     */
    assignTask(taskId, developerId) {
        const taskIndex = this.backlog.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return null;

        const task = this.backlog.splice(taskIndex, 1)[0];
        task.assignedTo = developerId;
        task.status = 'in-progress';
        task.startedAt = new Date().toISOString();

        this.inProgress.push(task);
        logger.info(`Task ${taskId} assigned to ${developerId}`);

        return task;
    }

    /**
     * Move task to review
     */
    submitForReview(taskId) {
        const taskIndex = this.inProgress.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return null;

        const task = this.inProgress.splice(taskIndex, 1)[0];
        task.status = 'in-review';
        task.submittedAt = new Date().toISOString();

        this.inReview.push(task);
        return task;
    }

    /**
     * Complete a task
     */
    completeTask(taskId) {
        // Check in review first
        let taskIndex = this.inReview.findIndex(t => t.id === taskId);
        let sourceArray = this.inReview;

        if (taskIndex === -1) {
            taskIndex = this.inProgress.findIndex(t => t.id === taskId);
            sourceArray = this.inProgress;
        }

        if (taskIndex === -1) return null;

        const task = sourceArray.splice(taskIndex, 1)[0];
        task.status = 'done';
        task.completedAt = new Date().toISOString();

        this.done.push(task);
        logger.success(`Task ${taskId} completed`);

        return task;
    }

    /**
     * Get next task for a developer
     */
    getNextTask(developerSpecialty = null) {
        // Prioritize high priority tasks
        const sorted = [...this.backlog].sort((a, b) => {
            const order = { high: 0, normal: 1, low: 2 };
            return order[a.priority] - order[b.priority];
        });

        if (sorted.length > 0) {
            return sorted[0];
        }

        return null;
    }

    /**
     * Get board summary
     */
    getSummary() {
        return {
            backlog: this.backlog.length,
            inProgress: this.inProgress.length,
            inReview: this.inReview.length,
            done: this.done.length,
            stories: this.stories.length,
        };
    }
}

export default TaskBoard;
