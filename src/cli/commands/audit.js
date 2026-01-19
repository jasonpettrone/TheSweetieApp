import chalk from 'chalk';
import * as auditDb from '../../audit/database.js';
import auditLogger from '../../audit/logger.js';

export default async function auditCommand(options = {}) {
    console.log(chalk.cyan.bold('\n📊 AI Agent Audit Log\n'));

    const { sessionId, violations } = options;

    if (sessionId) {
        // Show specific session details
        await showSessionDetails(sessionId);
    } else if (violations) {
        // Show recent violations
        await showViolations();
    } else {
        // Show summary
        await showSummary();
    }
}

async function showSummary() {
    const summary = auditLogger.getAuditSummary();

    console.log(chalk.white.bold('📈 Statistics'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  Sessions:      ${chalk.cyan(summary.stats.totalSessions)}`);
    console.log(`  AI Requests:   ${chalk.cyan(summary.stats.totalRequests)}`);
    console.log(`  Tool Calls:    ${chalk.cyan(summary.stats.totalToolCalls)}`);
    console.log(`  Violations:    ${chalk.yellow(summary.stats.totalViolations)}`);
    console.log(`  Blocked:       ${chalk.red(summary.stats.blockedViolations)}`);

    console.log(chalk.white.bold('\n📅 Recent Sessions'));
    console.log(chalk.gray('─'.repeat(50)));

    if (summary.recentSessions.length === 0) {
        console.log(chalk.gray('  No sessions yet'));
    } else {
        for (const session of summary.recentSessions) {
            const status = session.status === 'completed'
                ? chalk.green('✓')
                : chalk.yellow('⟳');
            console.log(
                `  ${status} ${chalk.cyan(session.id.slice(0, 15))}  ` +
                `${chalk.gray(session.started_at)}  ` +
                `${chalk.white(session.total_requests || 0)} requests`
            );
        }
    }

    if (summary.recentViolations.length > 0) {
        console.log(chalk.red.bold('\n⚠️  Recent Violations'));
        console.log(chalk.gray('─'.repeat(50)));

        for (const v of summary.recentViolations.slice(0, 5)) {
            const blocked = v.blocked ? chalk.red('BLOCKED') : chalk.yellow('WARNING');
            console.log(
                `  ${blocked} ${chalk.gray(v.timestamp)}  ` +
                `${chalk.white(v.invariant_type)}: ${v.reason}`
            );
        }
    }

    console.log(chalk.gray('\n─'.repeat(50)));
    console.log(chalk.gray('Usage:'));
    console.log(chalk.gray('  npm run audit                    Show summary'));
    console.log(chalk.gray('  npm run audit:session <id>       Show session details'));
    console.log(chalk.gray('  npm run audit:violations         Show all violations'));
    console.log();
}

async function showSessionDetails(sessionId) {
    const details = auditLogger.getSessionDetails(sessionId);

    if (!details.session) {
        console.log(chalk.red(`Session not found: ${sessionId}`));
        return;
    }

    const session = details.session;
    console.log(chalk.white.bold(`Session: ${session.id}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  Started:  ${session.started_at}`);
    console.log(`  Ended:    ${session.ended_at || 'Still running'}`);
    console.log(`  Status:   ${session.status}`);
    console.log(`  Requests: ${session.total_requests || details.requests.length}`);

    console.log(chalk.white.bold('\n📝 Requests'));
    console.log(chalk.gray('─'.repeat(50)));

    for (const req of details.requests) {
        const success = req.success ? chalk.green('✓') : chalk.red('✗');
        console.log(
            `\n  ${success} ${chalk.cyan(req.agent_name || req.agent_id)}  ` +
            chalk.gray(`${req.duration_ms || 0}ms`)
        );

        // Truncate prompt/response for display
        const promptPreview = (req.prompt || '').slice(0, 100).replace(/\n/g, ' ');
        console.log(chalk.gray(`     Prompt: ${promptPreview}...`));

        // Show tool calls
        if (req.toolCalls && req.toolCalls.length > 0) {
            console.log(chalk.white(`     Tools: ${req.toolCalls.length}`));
            for (const tool of req.toolCalls) {
                const toolSuccess = tool.success ? chalk.green('✓') : chalk.red('✗');
                console.log(`       ${toolSuccess} ${chalk.yellow(tool.tool_name)}`);
            }
        }
    }

    if (details.violations.length > 0) {
        console.log(chalk.red.bold('\n⚠️  Session Violations'));
        console.log(chalk.gray('─'.repeat(50)));

        for (const v of details.violations) {
            const blocked = v.blocked ? chalk.red('BLOCKED') : chalk.yellow('WARNING');
            console.log(`  ${blocked} ${v.invariant_type}: ${v.reason}`);
        }
    }

    console.log();
}

async function showViolations() {
    const violations = auditDb.getRecentViolations(50);

    console.log(chalk.red.bold('⚠️  All Violations'));
    console.log(chalk.gray('─'.repeat(70)));

    if (violations.length === 0) {
        console.log(chalk.green('  No violations recorded! 🎉'));
    } else {
        for (const v of violations) {
            const blocked = v.blocked ? chalk.red('BLOCKED') : chalk.yellow('WARNING');
            console.log(
                `${chalk.gray(v.timestamp)}  ${blocked}  ` +
                `${chalk.cyan(v.agent_id)}  ${chalk.white(v.invariant_type)}`
            );
            console.log(chalk.gray(`  ${v.reason}`));
            if (v.target) {
                console.log(chalk.gray(`  Target: ${v.target}`));
            }
            console.log();
        }
    }
}
