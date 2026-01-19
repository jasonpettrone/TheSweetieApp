import express from 'express';

const router = express.Router();

/**
 * Job Search API
 * 
 * Future integrations:
 * - LinkedIn Jobs API
 * - Indeed API
 * - Glassdoor API
 * - ZipRecruiter API
 * 
 * Current: Placeholder with mock data
 */

// Mock job data for development
const mockJobs = [
    {
        id: '1',
        title: 'Chemistry PhD - Research Manager',
        company: 'Pfizer',
        location: 'New York, NY',
        salary: '$120,000 - $150,000',
        description: 'Lead a team of research chemists in drug discovery...',
        url: 'https://example.com/job/1',
        postedDate: '2026-01-10',
        source: 'mock',
    },
    {
        id: '2',
        title: 'Senior Chemist - R&D',
        company: 'Merck',
        location: 'Rahway, NJ',
        salary: '$95,000 - $120,000',
        description: 'Conduct research on new pharmaceutical compounds...',
        url: 'https://example.com/job/2',
        postedDate: '2026-01-12',
        source: 'mock',
    },
];

/**
 * Search for jobs
 * 
 * Query params:
 * - query: Search terms (e.g., "chemistry phd manager")
 * - location: Location filter (e.g., "NY")
 * - remote: true/false for remote jobs
 * - salary_min: Minimum salary
 */
router.get('/search', async (req, res) => {
    try {
        const { query, location, remote, salary_min } = req.query;

        // TODO: Implement real job search API integration
        // For now, return filtered mock data
        let results = [...mockJobs];

        if (query) {
            const q = query.toLowerCase();
            results = results.filter(job =>
                job.title.toLowerCase().includes(q) ||
                job.description.toLowerCase().includes(q)
            );
        }

        if (location) {
            const loc = location.toLowerCase();
            results = results.filter(job =>
                job.location.toLowerCase().includes(loc)
            );
        }

        res.json({
            success: true,
            query: { query, location, remote, salary_min },
            count: results.length,
            jobs: results,
            note: 'Using mock data. Real API integration coming soon!',
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get job details by ID
 */
router.get('/:id', async (req, res) => {
    const job = mockJobs.find(j => j.id === req.params.id);

    if (!job) {
        return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, job });
});

/**
 * Save a job to favorites
 */
router.post('/favorites', async (req, res) => {
    const { jobId, userId } = req.body;

    // TODO: Implement favorites storage
    res.json({
        success: true,
        message: 'Job saved to favorites',
        jobId,
    });
});

export default router;
