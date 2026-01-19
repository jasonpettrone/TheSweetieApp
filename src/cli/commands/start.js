import Scheduler from '../../workflow/Scheduler.js';
import logger from '../../utils/logger.js';

export default async function startCommand() {
    logger.header('AI Development Team - Scheduler');

    const scheduler = new Scheduler();
    scheduler.start();
}
