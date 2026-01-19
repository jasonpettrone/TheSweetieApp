import cron from 'node-cron';
import { SCHEDULE_TIME } from '../config/index.js';
import logger from '../utils/logger.js';
import DaySimulator from './DaySimulator.js';

/**
 * Scheduler - runs daily at 9 AM
 */
export class Scheduler {
    constructor() {
        this.job = null;
        this.running = false;
    }

    /**
     * Start the scheduler
     */
    start() {
        logger.header('🕘 Starting Daily Scheduler');
        logger.info(`Scheduled to run at: ${SCHEDULE_TIME} (9:00 AM daily)`);

        this.job = cron.schedule(SCHEDULE_TIME, async () => {
            if (this.running) {
                logger.warn('Previous day simulation still running, skipping...');
                return;
            }

            this.running = true;
            try {
                const simulator = new DaySimulator();
                await simulator.runDay();
            } catch (error) {
                logger.error(`Day simulation failed: ${error.message}`);
                console.error(error);
            } finally {
                this.running = false;
            }
        });

        logger.success('Scheduler started. Waiting for 9:00 AM...');
        logger.info('Press Ctrl+C to stop');

        // Keep process alive
        process.on('SIGINT', () => {
            this.stop();
            process.exit(0);
        });
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.job) {
            this.job.stop();
            logger.info('Scheduler stopped');
        }
    }

    /**
     * Run immediately (for testing)
     */
    async runNow() {
        if (this.running) {
            logger.warn('Day simulation already running');
            return;
        }

        this.running = true;
        try {
            const simulator = new DaySimulator();
            await simulator.runDay();
        } finally {
            this.running = false;
        }
    }
}

export default Scheduler;
