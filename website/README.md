# 🍯 The Sweetie App

> ⚠️ **UNDER CONTINUOUS DEVELOPMENT** - This app is constantly evolving! Built by AI agents with human oversight.

A personal "Swiss Army knife" web application for Jason & Liz. Built with React + Node.js.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 🎨 Current Features

### Job Search 💼
- Search by keywords and location
- Filter results
- Mock data (real API integration planned)

### Recipe Finder 🍳
- Search recipes
- **Allergen filtering** (exclude peanuts, tree nuts, etc.)
- Mock data (real API integration planned)

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## 📁 Structure

```
website/
├── src/
│   ├── pages/         # Home, Jobs, Recipes
│   ├── components/    # Layout, shared UI
│   └── App.jsx        # Routing
├── server/
│   ├── index.js       # Express server
│   └── routes/        # API endpoints
└── tests/             # Vitest tests
```

## 🤖 AI Development

This app is built by an AI development team that:
- Reads tasks from `../ceo-tasks.md`
- Works on `ai-main` branch only
- Runs tests before committing
- All work is audited

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Backend**: Node.js, Express 5
- **Styling**: Vanilla CSS with custom properties
- **Testing**: Vitest, React Testing Library

## 📄 License

MIT
