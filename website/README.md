# 🍯 The Sweetie App

> ⚠️ **UNDER CONTINUOUS DEVELOPMENT** - This app is constantly evolving! New features are added regularly by our AI development team. Current features (job search, recipes) are just the beginning.

A personal "Swiss Army knife" web application for Jason & Liz. Built with React + Node.js and continuously improved by AI agents.

## 🎯 Vision

A single app that handles whatever you need:
- **Now**: Job search, recipe finder
- **Soon**: Authentication, favorites, meal planning
- **Future**: Budget tracking, shopping lists, and more!

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server (frontend + backend)
npm run dev

# Run tests
npm test
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📁 Project Structure

```
website/
├── src/                    # React frontend
│   ├── pages/              # Home, Jobs, Recipes
│   ├── components/         # Reusable UI components
│   ├── App.jsx             # Main app with routing
│   └── App.css             # Global styles & theme
├── server/                 # Express backend
│   ├── index.js            # Server entry point
│   └── routes/             # API route handlers
│       ├── jobs.js         # Job search API
│       ├── recipes.js      # Recipe search API
│       └── health.js       # Health check
└── tests/                  # Test suites
```

## 🧪 Testing

We practice TDD (Test Driven Development):
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
```

Tests cover:
- React components
- API routes
- Utility functions

## 🎨 Features

### Job Search 💼
- Search by keywords and location
- Filter by salary, remote options
- Save favorites (coming soon)

### Recipe Finder 🍳
- Search recipes by ingredients
- **Allergen filtering** (e.g., exclude peanuts/tree nuts)
- Dietary preferences (coming soon)

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Backend**: Node.js, Express 5
- **Styling**: Vanilla CSS with custom properties
- **Testing**: Vitest, React Testing Library

## 🤖 AI Development

This app is built by an AI development team! They:
- Read priorities from `../ceo-tasks.md`
- Implement features autonomously
- Run tests to verify changes
- Create PRs for review

## 📄 License

MIT
