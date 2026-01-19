import chalk from 'chalk';
import path from 'path';
import { AGENTS, AGENT_STATE_DIR, MAX_REQUESTS_PER_DAY } from '../../config/index.js';
import { readJsonFile, getTodayDate } from '../../utils/fileUtils.js';
import logger from '../../utils/logger.js';

export default async function statusCommand() {
    console.log(chalk.cyan.bold('\n🤖 AI Development Team Status\n'));
    console.log(chalk.gray(`Date: ${getTodayDate()}`));
    console.log(chalk.gray('─'.repeat(60)));

    let totalUsed = 0;
    let totalRemaining = 0;

    for (const agentConfig of AGENTS) {
        const statePath = path.join(AGENT_STATE_DIR, `${agentConfig.id}.json`);
        const state = await readJsonFile(statePath, {});

        // Check if we need to reset for a new day
        const today = getTodayDate();
        let requestsUsed = 0;

        if (state.lastResetDate === today) {
            requestsUsed = state.requestsToday || 0;
        }

        const remaining = MAX_REQUESTS_PER_DAY - requestsUsed;
        totalUsed += requestsUsed;
        totalRemaining += remaining;

        // Format status line
        const usageBar = createUsageBar(requestsUsed, MAX_REQUESTS_PER_DAY);
        const statusColor = remaining > 10 ? chalk.green : remaining > 5 ? chalk.yellow : chalk.red;

        console.log(
            chalk.white.bold(agentConfig.name.padEnd(30)) +
            usageBar + ' ' +
            statusColor(`${requestsUsed}/${MAX_REQUESTS_PER_DAY}`) +
            chalk.gray(` (${remaining} remaining)`)
        );
    }

    console.log(chalk.gray('─'.repeat(60)));
    console.log(
        chalk.white.bold('TOTAL'.padEnd(30)) +
        createUsageBar(totalUsed, MAX_REQUESTS_PER_DAY * AGENTS.length) + ' ' +
        chalk.cyan(`${totalUsed}/${MAX_REQUESTS_PER_DAY * AGENTS.length}`) +
        chalk.gray(` (${totalRemaining} remaining)`)
    );
    console.log();
}

function createUsageBar(used, max, width = 15) {
    const filled = Math.round((used / max) * width);
    const empty = width - filled;

    let color = chalk.green;
    if (used / max > 0.8) color = chalk.red;
    else if (used / max > 0.5) color = chalk.yellow;

    return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
