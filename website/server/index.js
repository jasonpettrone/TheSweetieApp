import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import jobsRouter from './routes/jobs.js';
import recipesRouter from './routes/recipes.js';
import healthRouter from './routes/health.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/recipes', recipesRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
    console.log(`🍯 Sweetie App API running on http://localhost:${PORT}`);
});

export default app;
