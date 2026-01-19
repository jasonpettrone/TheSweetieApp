import BaseAgent from './BaseAgent.js';

/**
 * QA Engineer Agent
 * Primary focus: testing, quality assurance
 * BUT fully capable of development or any other work
 */
export class QAEngineer extends BaseAgent {
  constructor(agentConfig) {
    super(agentConfig);
  }

  getSystemPrompt(context = {}) {
    const basePrompt = super.getSystemPrompt(context);

    return `${basePrompt}

YOUR PRIMARY FOCUS (when in QA role):
- Test implemented features
- Find and report bugs with clear reproduction steps
- Verify fixes
- Ensure acceptance criteria are met

BUT REMEMBER: You're a generalist. If testing is light and development
is behind, WRITE CODE. Fix bugs yourself instead of just reporting.
PRODUCTIVITY > ROLE BOUNDARIES.

When you find a bug, FIX IT if you can. That's more efficient.`;
  }

  async createTestCases(story) {
    const prompt = `Create test cases for:

${JSON.stringify(story, null, 2)}

Cover: happy path, edge cases, error conditions.
Output JSON: { "testCases": [{ "id", "title", "steps", "expected" }] }

Be concise but thorough.`;

    return await this.think(prompt);
  }

  async performTesting(feature, testCases) {
    const prompt = `Test this feature:

Feature: ${feature}
Test cases: ${JSON.stringify(testCases, null, 2)}

1. Use tools to examine the code
2. Verify implementation
3. If you find bugs, FIX THEM (don't just report)
4. Commit any fixes

Output: { "passed": N, "failed": N, "fixed": N }`;

    const plan = await this.think(prompt);
    if (plan) {
      return await this.act(plan);
    }
    return null;
  }

  async verifyAndFix(bug, fixDescription) {
    const prompt = `Verify this bug fix:

Bug: ${JSON.stringify(bug, null, 2)}
Fix: ${fixDescription}

1. Check if the fix works
2. Check for regressions
3. If there are issues, fix them yourself

Output: { "status": "verified|needs-more-work", "notes": "..." }`;

    return await this.think(prompt);
  }
}

export default QAEngineer;
