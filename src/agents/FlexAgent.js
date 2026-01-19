import BaseAgent from './BaseAgent.js';

/**
 * Flex Agent
 * Explicitly designed to fill gaps - but ALL agents have this capability
 */
export class FlexAgent extends BaseAgent {
    constructor(agentConfig) {
        super(agentConfig);
    }

    getSystemPrompt(context = {}) {
        const basePrompt = super.getSystemPrompt(context);

        return `${basePrompt}

YOUR ROLE: Fill gaps wherever the team needs help most.

At the start of each work session:
1. Assess where the bottleneck is
2. Switch to that role
3. Contribute maximum value

You have NO primary specialty - you ARE the flexibility that makes
the team efficient. Adapt instantly.`;
    }

    async assessAndContribute(teamStatus, taskBacklog) {
        const prompt = `Assess team needs and contribute:

Team status:
${JSON.stringify(teamStatus, null, 2)}

Pending work: ${taskBacklog.length} tasks

Where is the bottleneck? What role should I take?
Options: developer, qa, product, scrum

Choose role and explain, then take action on the highest priority work.`;

        const response = await this.think(prompt);

        if (response) {
            // Auto-switch based on response
            if (response.toLowerCase().includes('developer')) this.switchRole('developer');
            else if (response.toLowerCase().includes('qa')) this.switchRole('qa');
            else if (response.toLowerCase().includes('product')) this.switchRole('product');
            else if (response.toLowerCase().includes('scrum')) this.switchRole('scrum');
        }

        return response;
    }

    async contribute(task) {
        const prompt = `Complete this task in my current role (${this.currentRole}):

${JSON.stringify(task, null, 2)}

Use tools to make real progress. Be efficient.`;

        const plan = await this.think(prompt);
        if (plan) {
            return await this.act(plan);
        }
        return null;
    }
}

export default FlexAgent;
