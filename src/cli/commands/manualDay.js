import DaySimulator from '../../workflow/DaySimulator.js';
import logger from '../../utils/logger.js';

export default async function manualDayCommand() {
    logger.header('AI Development Team - Manual Day Simulation');

    try {
        const simulator = new DaySimulator();
        await simulator.runDay();
    } catch (error) {
        logger.error(`Day simulation failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}
