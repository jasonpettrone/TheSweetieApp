import chalk from 'chalk';

const timestamp = () => new Date().toISOString().slice(11, 19);

export const logger = {
    info: (message, agent = null) => {
        const prefix = agent ? `[${agent}]` : '[SYSTEM]';
        console.log(`${chalk.gray(timestamp())} ${chalk.blue(prefix)} ${message}`);
    },

    success: (message, agent = null) => {
        const prefix = agent ? `[${agent}]` : '[SYSTEM]';
        console.log(`${chalk.gray(timestamp())} ${chalk.green(prefix)} ${chalk.green(message)}`);
    },

    warn: (message, agent = null) => {
        const prefix = agent ? `[${agent}]` : '[SYSTEM]';
        console.log(`${chalk.gray(timestamp())} ${chalk.yellow(prefix)} ${chalk.yellow(message)}`);
    },

    error: (message, agent = null) => {
        const prefix = agent ? `[${agent}]` : '[SYSTEM]';
        console.log(`${chalk.gray(timestamp())} ${chalk.red(prefix)} ${chalk.red(message)}`);
    },

    debug: (message, agent = null) => {
        if (process.env.DEBUG) {
            const prefix = agent ? `[${agent}]` : '[DEBUG]';
            console.log(`${chalk.gray(timestamp())} ${chalk.magenta(prefix)} ${message}`);
        }
    },

    divider: () => {
        console.log(chalk.gray('─'.repeat(60)));
    },

    header: (title) => {
        console.log();
        console.log(chalk.bold.cyan(`━━━ ${title} ━━━`));
        console.log();
    },

    agentAction: (agent, action, detail = '') => {
        console.log(
            `${chalk.gray(timestamp())} ${chalk.cyan(`[${agent}]`)} ${chalk.white(action)}${detail ? chalk.gray(` → ${detail}`) : ''}`
        );
    },
};

export default logger;
