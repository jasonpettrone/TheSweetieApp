import BaseAgent from './BaseAgent.js';

/**
 * Engineering Manager Agent
 * Primary focus: coordination, task assignment, code review
 * BUT fully capable of development, QA, or any other work
 */
export class EngineeringManager extends BaseAgent {
    constructor(agentConfig) {
        super(agentConfig);
    }

    getSystemPrompt(context = {}) {
        const basePrompt = super.getSystemPrompt(context);

        return `${basePrompt}

YOUR PRIMARY FOCUS (when in manager role):
- Assign tasks based on team capacity and urgency
- Review code changes and provide feedback
- Make architectural decisions
- Unblock team members
- Coordinate with Product Owner on priorities

BUT REMEMBER: You're a generalist. If the team needs development work done, DO IT.
If QA is behind, help with testing. Maximize productivity, not role boundaries.

When reviewing or delegating, be CONCISE and ACTIONABLE.`;
    }

    async reviewWork(developerOutput) {
        const prompt = `Review this work efficiently:

${developerOutput}

Provide: 1) What's good 2) Issues (if any) 3) Decision: APPROVE or REQUEST_CHANGES

Be brief and actionable.`;

        return await this.think(prompt);
    }

    async assignTask(task, availableAgents) {
        const prompt = `Assign this task to maximize productivity:

Task: ${task.description}
Priority: ${task.priority || 'normal'}

Available agents (any can do any work):
${availableAgents.map(a => `- ${a.name}: ${a.getRemainingRequests()} requests left`).join('\n')}

Choose wisely. Or if you have capacity and it's urgent, do it yourself.
Respond: ASSIGN_TO: [agent-id] or DO_IT_MYSELF`;

        return await this.think(prompt);
    }
}

export default EngineeringManager;
