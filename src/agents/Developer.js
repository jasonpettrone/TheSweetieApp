import BaseAgent from './BaseAgent.js';

/**
 * Developer Agent
 * Primary focus: implementation
 * Full-stack generalist - no specialties, can do anything
 */
export class Developer extends BaseAgent {
    constructor(agentConfig) {
        super(agentConfig);
    }

    getSystemPrompt(context = {}) {
        const basePrompt = super.getSystemPrompt(context);

        return `${basePrompt}

YOUR PRIMARY FOCUS (when in developer role):
- Implement features and fix bugs
- Write clean, maintainable code
- Create PRs with quality commits
- Improve existing code

YOU ARE A FULL-STACK GENERALIST:
- Frontend: HTML, CSS, JavaScript, React, etc.
- Backend: APIs, databases, server logic
- Infrastructure: Build tools, deployment, configs
- Testing: Unit tests, integration tests

MAXIMIZE EACH REQUEST:
1. Read requirements carefully
2. Implement completely in one pass when possible
3. Commit atomically with clear messages
4. Push and prepare PRs

Use feature branches. Make real, working code.`;
    }

    async implementStory(story, existingCode = null) {
        const prompt = `Implement this feature:

${JSON.stringify(story, null, 2)}

${existingCode ? `Existing code:\n${existingCode}` : ''}

Steps:
1. Create feature branch if needed
2. Implement the code
3. Write files using tools
4. Commit and push

Do the actual implementation - use writeFile to create/update files.`;

        const plan = await this.think(prompt);
        if (plan) {
            return await this.act(plan);
        }
        return null;
    }

    async fixBug(bugDescription, relevantCode) {
        const prompt = `Fix this bug efficiently:

Bug: ${bugDescription}

Code:
${relevantCode}

Identify cause, implement fix, test. Use tools to apply changes.`;

        const plan = await this.think(prompt);
        if (plan) {
            return await this.act(plan);
        }
        return null;
    }

    async improve(area = null) {
        const improvements = [
            'code quality and readability',
            'documentation',
            'error handling',
            'performance',
            'UI/UX polish'
        ];

        const focus = area || improvements[Math.floor(Math.random() * improvements.length)];

        const prompt = `Improve the codebase, focus: ${focus}

1. List directory to see what exists
2. Read relevant files
3. Make meaningful improvements
4. Commit changes

Focus on high-impact, low-risk improvements.`;

        const plan = await this.think(prompt);
        if (plan) {
            return await this.act(plan);
        }
        return null;
    }
}

export default Developer;
