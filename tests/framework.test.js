/**
 * AI Agent Framework - Test Suite
 * 
 * CRITICAL: These tests do NOT invoke Gemini API calls!
 * They test the framework logic, utilities, and configuration.
 * 
 * Run with: npm test
 */

import { jest } from '@jest/globals';

// Mock the Gemini API before importing agents
jest.unstable_mockModule('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: { text: () => 'Mocked AI response' }
            })
        })
    }))
}));

describe('Configuration Tests', () => {
    let config;

    beforeAll(async () => {
        config = await import('../src/config/index.js');
    });

    test('should have correct number of agents', () => {
        expect(config.AGENTS).toHaveLength(10);
    });

    test('all agents should have required properties', () => {
        config.AGENTS.forEach(agent => {
            expect(agent).toHaveProperty('id');
            expect(agent).toHaveProperty('name');
            expect(agent).toHaveProperty('primaryRole');
            expect(agent).toHaveProperty('apiKeyEnv');
        });
    });

    test('should have correct max requests per day', () => {
        expect(config.MAX_REQUESTS_PER_DAY).toBe(25);
    });

    test('should use gemini-2.5-pro model', () => {
        expect(config.GEMINI_MODEL).toBe('gemini-2.5-pro');
    });

    test('should have data directories configured', () => {
        expect(config.DATA_DIR).toBeDefined();
        expect(config.DAILY_PROGRESS_DIR).toBeDefined();
        expect(config.AGENT_USAGE_DIR).toBeDefined();
        expect(config.KNOWLEDGE_BASE_DIR).toBeDefined();
    });

    test('should have GitHub configuration', () => {
        expect(config.GITHUB_REPO).toBeDefined();
        expect(config.DEFAULT_BRANCH).toBe('main');
    });
});

describe('File Utilities Tests', () => {
    let fileUtils;

    beforeAll(async () => {
        fileUtils = await import('../src/utils/fileUtils.js');
    });

    test('getTodayDate should return YYYY-MM-DD format', () => {
        const today = fileUtils.getTodayDate();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('isPathSafe should block paths outside working directory', async () => {
        const config = await import('../src/config/index.js');
        const result = fileUtils.isPathSafe('C:\\Windows\\System32', 'test-agent');
        expect(result.safe).toBe(false);
    });

    test('isPathSafe should block CEO tasks modification by agents', async () => {
        const config = await import('../src/config/index.js');
        const result = fileUtils.isPathSafe(config.CEO_TASKS_FILE, 'test-agent');
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('CEO tasks');
    });

    test('isPathSafe should allow paths within working directory', async () => {
        const config = await import('../src/config/index.js');
        const testPath = config.WORKING_DIR + '\\test.txt';
        const result = fileUtils.isPathSafe(testPath, 'test-agent');
        expect(result.safe).toBe(true);
    });
});

describe('Task Parser Tests', () => {
    let TaskParser;

    beforeAll(async () => {
        const module = await import('../src/tasks/TaskParser.js');
        TaskParser = module.TaskParser;
    });

    test('should parse priority sections correctly', () => {
        const parser = new TaskParser();
        const content = `
# CEO Tasks

## High Priority
- Build feature A
- Fix bug B

## Normal Priority
- Add documentation

## Low Priority
- Nice to have feature
`;
        const tasks = parser.parseMarkdown(content);

        expect(tasks.length).toBe(4);
        expect(tasks[0].priority).toBe('high');
        expect(tasks[1].priority).toBe('high');
        expect(tasks[2].priority).toBe('normal');
        expect(tasks[3].priority).toBe('low');
    });

    test('should sort tasks by priority', () => {
        const parser = new TaskParser();
        const content = `
## Low Priority
- Low task

## High Priority
- High task
`;
        const tasks = parser.parseMarkdown(content);

        expect(tasks[0].priority).toBe('high');
        expect(tasks[1].priority).toBe('low');
    });

    test('should ignore comments in markdown', () => {
        const parser = new TaskParser();
        const content = `
- Real task
<!-- - Commented task -->
`;
        const tasks = parser.parseMarkdown(content);
        expect(tasks.length).toBe(1);
    });
});

describe('Task Board Tests', () => {
    let TaskBoard;

    beforeAll(async () => {
        const module = await import('../src/tasks/TaskBoard.js');
        TaskBoard = module.TaskBoard;
    });

    test('should add tasks to backlog without duplicates', () => {
        const board = new TaskBoard();
        const tasks = [
            { id: '1', description: 'Task A' },
            { id: '2', description: 'Task B' },
        ];

        board.addToBacklog(tasks);
        board.addToBacklog(tasks); // Try adding again

        expect(board.backlog.length).toBe(2);
    });

    test('should move task through lifecycle', () => {
        const board = new TaskBoard();
        board.addToBacklog([{ id: '1', description: 'Test task' }]);

        // Assign
        const assigned = board.assignTask('1', 'dev-1');
        expect(assigned.status).toBe('in-progress');
        expect(board.backlog.length).toBe(0);
        expect(board.inProgress.length).toBe(1);

        // Complete
        const completed = board.completeTask('1');
        expect(completed.status).toBe('done');
        expect(board.inProgress.length).toBe(0);
        expect(board.done.length).toBe(1);
    });

    test('should get summary correctly', () => {
        const board = new TaskBoard();
        board.addToBacklog([{ id: '1', description: 'Task 1' }]);

        const summary = board.getSummary();
        expect(summary.backlog).toBe(1);
        expect(summary.inProgress).toBe(0);
        expect(summary.done).toBe(0);
    });
});

describe('Agent Tool Parsing Tests', () => {
    test('should parse tool calls correctly', async () => {
        const { BaseAgent } = await import('../src/agents/BaseAgent.js');
        const agent = new BaseAgent({
            id: 'test',
            name: 'Test Agent',
            primaryRole: 'developer',
            apiKeyEnv: 'TEST_KEY'
        });

        const text = `
I will read a file:
<tool:readFile>src/index.js</tool>

Then write a file:
<tool:writeFile>src/output.js|console.log('hello')</tool>
`;

        const actions = agent.parseToolCalls(text);

        expect(actions.length).toBe(2);
        expect(actions[0].tool).toBe('readFile');
        expect(actions[0].args[0]).toBe('src/index.js');
        expect(actions[1].tool).toBe('writeFile');
        expect(actions[1].args[0]).toBe('src/output.js');
        expect(actions[1].args[1]).toBe("console.log('hello')");
    });
});

describe('Agent Role Switching Tests', () => {
    test('agent should be able to switch roles', async () => {
        const { BaseAgent } = await import('../src/agents/BaseAgent.js');
        const agent = new BaseAgent({
            id: 'test',
            name: 'Test Agent',
            primaryRole: 'developer',
            apiKeyEnv: 'TEST_KEY'
        });

        expect(agent.currentRole).toBe('developer');

        agent.switchRole('qa');
        expect(agent.currentRole).toBe('qa');

        agent.resetRole();
        expect(agent.currentRole).toBe('developer');
    });

    test('should reject invalid roles', async () => {
        const { BaseAgent } = await import('../src/agents/BaseAgent.js');
        const agent = new BaseAgent({
            id: 'test',
            name: 'Test Agent',
            primaryRole: 'developer',
            apiKeyEnv: 'TEST_KEY'
        });

        const result = agent.switchRole('invalid-role');
        expect(result).toBe(false);
        expect(agent.currentRole).toBe('developer');
    });
});
