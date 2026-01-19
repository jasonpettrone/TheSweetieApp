#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import startCommand from './commands/start.js';
import manualDayCommand from './commands/manualDay.js';
import statusCommand from './commands/status.js';
import auditCommand from './commands/audit.js';

const program = new Command();

program
    .name('ai-dev-team')
    .description('AI Development Team - Multi-Agent System with Safety Controls')
    .version('1.0.0');

program
    .command('start')
    .description('Start the daily scheduler (runs at 9 AM)')
    .action(startCommand);

program
    .command('manual-day')
    .description('Run a single day simulation manually')
    .action(manualDayCommand);

program
    .command('status')
    .description('Display current agent status and usage')
    .action(statusCommand);

program
    .command('audit')
    .description('View audit logs and activity')
    .option('-s, --session <id>', 'View specific session details')
    .option('-v, --violations', 'Show recent violations')
    .action((options) => auditCommand(options));

// Default help
if (process.argv.length === 2) {
    console.log(chalk.cyan('\n🤖 AI Development Team\n'));
    console.log('Usage: npm run <command>\n');
    console.log('Commands:');
    console.log('  npm start         - Start daily scheduler (9 AM)');
    console.log('  npm run manualDay - Run one day simulation now');
    console.log('  npm run status    - View agent status');
    console.log('  npm run audit     - View audit logs');
    console.log('  npm run docker    - Run in Docker container\n');
    process.exit(0);
}

program.parse();
