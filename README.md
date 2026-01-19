# AI Software Team - Multi-Agent Development Framework

> ⚠️ **UNDER CONTINUOUS DEVELOPMENT** - This framework and the applications it builds are constantly evolving.

A multi-agent AI development team using **Gemini 2.5 Pro** that autonomously works on software projects. 10 cross-functional AI agents operate like an Agile/Scrum team with full safety controls.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Create `.env` with 10 Gemini API keys:
```env
GEMINI_API_KEY_1=your_key_here
GEMINI_API_KEY_2=your_key_here
# ... up to GEMINI_API_KEY_10
```

### 3. Create AI Branch
```bash
git checkout -b ai-main
```
> Agents can ONLY work on `ai-main` or `ai-feature/*` branches. Never `main`.

### 4. Add Tasks
Edit `ceo-tasks.md` with plain English descriptions of what you want built.

### 5. Run the Team
```bash
# Run in Docker (isolated, recommended)
npm run docker

# Or run directly (faster, less isolated)
npm run manualDay
```

## 📊 Monitoring & Auditing

```bash
npm run status              # Agent status
npm run audit               # View all activity
npm run audit:violations    # View blocked actions
```

All AI prompts, responses, tool calls, and violations are logged to `data/audit.db`.

## 🛡️ Safety Features

| Feature | Description |
|---------|-------------|
| **Docker Isolation** | Agents run in container with 1 CPU, 1GB RAM |
| **Branch Protection** | Can't touch `main`, only `ai-main` |
| **File Protection** | Can't modify `src/`, `ceo-tasks.md`, `.env` |
| **Audit Logging** | Every action logged to SQLite |
| **Invariant Rules** | All tool calls validated before execution |

## 🏢 The Team

| Agent | Primary Role | Capabilities |
|-------|-------------|--------------|
| Engineering Manager | Coordination | All roles |
| Product Owner | Requirements | All roles |
| Scrum Master | Facilitation | All roles |
| Developer 1-4 | Implementation | All roles |
| QA Engineer 1-2 | Testing | All roles |
| Flex Agent | Gap-filling | All roles |

**All agents are cross-functional generalists** - they dynamically switch roles as needed.

## 📁 Project Structure

```
├── src/
│   ├── agents/         # AI agent classes
│   ├── safety/         # Invariant rules
│   ├── audit/          # SQLite logging
│   ├── workflow/       # Day simulator
│   └── cli/            # Commands
├── docker/             # Container config
├── data/               # Logs, state, audit.db
├── website/            # Target project (Sweetie App)
└── ceo-tasks.md        # Your priorities
```

## 🔄 Typical Workflow

1. Add tasks to `ceo-tasks.md`
2. Run `npm run docker`
3. Monitor with `npm run audit`
4. Review changes: `git diff`
5. If satisfied, merge `ai-main` → `main`

## 📄 License

MIT
