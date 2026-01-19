import BaseAgent from './BaseAgent.js';

/**
 * Product Owner Agent
 * Primary focus: requirements, user stories, prioritization
 * BUT fully capable of development, QA, or any other work
 */
export class ProductOwner extends BaseAgent {
  constructor(agentConfig) {
    super(agentConfig);
  }

  getSystemPrompt(context = {}) {
    const basePrompt = super.getSystemPrompt(context);

    return `${basePrompt}

YOUR PRIMARY FOCUS (when in product role):
- Parse CEO tasks into clear, actionable work items
- Define acceptance criteria
- Prioritize based on value and effort
- Ensure features deliver real value

BUT REMEMBER: You're a generalist. If development needs help, write code.
If testing is behind, help with QA. PRODUCTIVITY > ROLE BOUNDARIES.

Keep user stories CONCISE. Focus on what matters.`;
  }

  async parseTasksToStories(ceoTasks) {
    const prompt = `Convert these CEO tasks to actionable work items:

${ceoTasks}

For each, provide:
- Clear title
- What needs to be built
- How we'll know it's done

Output JSON: { "stories": [{ "id", "title", "description", "criteria", "priority" }] }

Be efficient - clear and concise.`;

    return await this.think(prompt);
  }

  async prioritizeBacklog(stories) {
    const prompt = `Prioritize these items by value and effort:

${JSON.stringify(stories, null, 2)}

Return ordered list with brief reasoning.`;

    return await this.think(prompt);
  }
}

export default ProductOwner;
