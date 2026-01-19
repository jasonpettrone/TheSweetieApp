import BaseAgent from './BaseAgent.js';

/**
 * Scrum Master Agent
 * Primary focus: facilitation, blocker removal, process
 * BUT fully capable of development, QA, or any other work
 */
export class ScrumMaster extends BaseAgent {
    constructor(agentConfig) {
        super(agentConfig);
    }

    getSystemPrompt(context = {}) {
        const basePrompt = super.getSystemPrompt(context);

        return `${basePrompt}

YOUR PRIMARY FOCUS (when in scrum role):
- Facilitate coordination between agents
- Identify and remove blockers
- Track overall progress
- Ensure smooth workflow

BUT REMEMBER: You're a generalist. When facilitation work is light,
SWITCH TO DEVELOPMENT or QA. Don't idle - maximize productivity!

Keep standups SHORT. Focus on blockers and next steps.`;
    }

    async facilitateStandup(teamStatus) {
        const prompt = `Quick standup summary:

Team status:
${JSON.stringify(teamStatus, null, 2)}

Identify:
1. Any blockers?
2. Who needs help?
3. What's the priority for today?

Keep it brief and actionable.`;

        return await this.think(prompt);
    }

    async analyzeBlockers(issues) {
        const prompt = `Analyze and resolve blockers:

${JSON.stringify(issues, null, 2)}

For each: root cause, resolution, who should handle it.
If you can fix it yourself - just do it.`;

        return await this.think(prompt);
    }

    async assessTeamNeeds(taskBacklog, teamCapacity) {
        const prompt = `Should I help with development/QA?

Pending tasks: ${taskBacklog.length}
Team capacity: ${teamCapacity} total requests remaining
My capacity: ${this.getRemainingRequests()} requests

If the team is overwhelmed, I should switch roles and help.
Respond: STAY_SCRUM or SWITCH_TO: [developer|qa]`;

        const response = await this.think(prompt);
        if (response?.includes('SWITCH_TO')) {
            if (response.includes('developer')) this.switchRole('developer');
            else if (response.includes('qa')) this.switchRole('qa');
        }
        return response;
    }
}

export default ScrumMaster;
