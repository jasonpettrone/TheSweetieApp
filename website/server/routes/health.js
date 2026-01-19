import express from 'express';

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        app: 'The Sweetie App',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

export default router;
