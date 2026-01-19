import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root directory (agents can work on anything here)
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Website directory (primary target for development work)
export const WEBSITE_DIR = path.join(PROJECT_ROOT, 'website');

// Working directory - agents primarily work in website folder
export const WORKING_DIR = WEBSITE_DIR;

// Data directories
export const DATA_DIR = path.join(PROJECT_ROOT, 'data');
export const DAILY_PROGRESS_DIR = path.join(DATA_DIR, 'daily-progress');
export const AGENT_USAGE_DIR = path.join(DATA_DIR, 'agent-usage');
export const AGENT_STATE_DIR = path.join(DATA_DIR, 'agent-state');
export const KNOWLEDGE_BASE_DIR = path.join(DATA_DIR, 'knowledge-base');

// CEO tasks file (protected from agent modification)
export const CEO_TASKS_FILE = path.join(PROJECT_ROOT, 'ceo-tasks.md');

// API Configuration
export const GEMINI_MODEL = 'gemini-2.5-pro';
export const MAX_REQUESTS_PER_DAY = 25;

// GitHub Configuration
export const GITHUB_REPO = 'jasonpettrone/AISearchAgent';
export const GITHUB_REMOTE = 'origin';
export const DEFAULT_BRANCH = 'main';

// Agent definitions - ALL agents are cross-functional generalists
// Primary role is a guideline, not a restriction
export const AGENTS = [
  { id: 'engineering-manager', name: 'Engineering Manager', primaryRole: 'manager', apiKeyEnv: 'GEMINI_API_KEY_1' },
  { id: 'product-owner', name: 'Product Owner', primaryRole: 'product', apiKeyEnv: 'GEMINI_API_KEY_2' },
  { id: 'scrum-master', name: 'Scrum Master', primaryRole: 'scrum', apiKeyEnv: 'GEMINI_API_KEY_3' },
  { id: 'developer-1', name: 'Developer 1', primaryRole: 'developer', apiKeyEnv: 'GEMINI_API_KEY_4' },
  { id: 'developer-2', name: 'Developer 2', primaryRole: 'developer', apiKeyEnv: 'GEMINI_API_KEY_5' },
  { id: 'developer-3', name: 'Developer 3', primaryRole: 'developer', apiKeyEnv: 'GEMINI_API_KEY_6' },
  { id: 'developer-4', name: 'Developer 4', primaryRole: 'developer', apiKeyEnv: 'GEMINI_API_KEY_7' },
  { id: 'qa-engineer-1', name: 'QA Engineer 1', primaryRole: 'qa', apiKeyEnv: 'GEMINI_API_KEY_8' },
  { id: 'qa-engineer-2', name: 'QA Engineer 2', primaryRole: 'qa', apiKeyEnv: 'GEMINI_API_KEY_9' },
  { id: 'flex-agent', name: 'Flex Agent', primaryRole: 'flex', apiKeyEnv: 'GEMINI_API_KEY_10' },
];

// Get API key for an agent
export function getApiKey(agent) {
  const key = process.env[agent.apiKeyEnv];
  if (!key) {
    throw new Error(`Missing API key for ${agent.name}. Please set ${agent.apiKeyEnv} in your .env file.`);
  }
  return key;
}

// Scheduler configuration
export const SCHEDULE_TIME = '0 9 * * *'; // 9:00 AM daily

export default {
  PROJECT_ROOT,
  WORKING_DIR,
  DATA_DIR,
  DAILY_PROGRESS_DIR,
  AGENT_USAGE_DIR,
  AGENT_STATE_DIR,
  KNOWLEDGE_BASE_DIR,
  CEO_TASKS_FILE,
  GEMINI_MODEL,
  MAX_REQUESTS_PER_DAY,
  GITHUB_REPO,
  GITHUB_REMOTE,
  DEFAULT_BRANCH,
  AGENTS,
  getApiKey,
  SCHEDULE_TIME,
};
