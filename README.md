# AI Software Team - Multi-Agent Development Framework

> ⚠️ **UNDER CONTINUOUS DEVELOPMENT** - This framework and the applications it builds are constantly evolving. New features, improvements, and capabilities are added regularly by both human developers and AI agents.

A multi-agent AI development team using **Gemini 2.5 Pro** that autonomously works on software projects. The team consists of 10 cross-functional AI agents that operate like an Agile/Scrum team.

## 🏢 The Team

| Agent | Primary Role | Can Do |
|-------|-------------|--------|
| Engineering Manager | Coordination, code review | Everything |
| Product Owner | Requirements, user stories | Everything |
| Scrum Master | Facilitation, blockers | Everything |
| Developer 1-4 | Implementation | Everything |
| QA Engineer 1-2 | Testing, quality | Everything |
| Flex Agent | Gap-filling | Everything |

**All agents are cross-functional generalists** - they can and will switch roles as needed to maximize productivity.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Create a `.env` file with 10 Gemini API keys:
```env
GEMINI_API_KEY_1=your_key_here
GEMINI_API_KEY_2=your_key_here
# ... up to GEMINI_API_KEY_10
```

### 3. Add Your Tasks
Edit `ceo-tasks.md` with plain English descriptions of what you want built.

### 4. Run the Team
```bash
# Check agent status
npm run status

# Run one day of work manually
npm run manualDay

# Start daily scheduler (runs at 9 AM)
npm start

# Run tests
npm test
```

## 📁 Project Structure

```
├── src/
│   ├── agents/          # AI agent classes
│   ├── workflow/        # Day simulator, scheduler
│   ├── tasks/           # Task parsing, board
│   ├── config/          # Configuration
│   └── cli/             # Command line interface
├── data/
│   ├── knowledge-base/  # Shared context for agents
│   ├── daily-progress/  # Daily work reports
│   └── agent-state/     # Agent state persistence
├── tests/               # Test suites (NO API calls)
├── website/             # The Sweetie App (target project)
└── ceo-tasks.md         # CEO priorities
```

## 🧪 Testing

Tests are designed for TDD and **never invoke Gemini API calls**:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

Agents can run tests to verify their changes don't break existing functionality.

## 🔧 How It Works

1. **CEO** (you) adds tasks to `ceo-tasks.md`
2. **Product Owner** parses tasks into user stories
3. **Engineering Manager** assigns work to developers
4. **Developers** implement features using tool calls
5. **QA Engineers** test and verify changes
6. **All agents** can pivot roles as needed

### Rate Limits
- Each agent: 25 requests/day (Gemini API limit)
- Total team capacity: 250 requests/day

### Safety Features
- Agents work within designated project directories
- Cannot modify `ceo-tasks.md`
- All work tracked through git

## 📊 Monitoring

```bash
# View agent usage
npm run status

# Check today's progress
cat data/daily-progress/$(date +%Y-%m-%d).json
```

## 🌐 Current Project: The Sweetie App

The team is currently building **The Sweetie App** - see `website/README.md` for details.

## 📄 License

MIT
