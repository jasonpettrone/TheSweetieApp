import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

function Jobs() {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const searchJobs = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);

        try {
            const response = await axios.get(`${API_BASE}/jobs/search`, {
                params: { query, location }
            });
            setJobs(response.data.jobs);
        } catch (error) {
            console.error('Error searching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in">
            <header className="page-header">
                <h1>💼 Job Search</h1>
                <p>Find your dream job across top job boards</p>
            </header>

            <form className="search-container" onSubmit={searchJobs}>
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Job title, keywords, or company..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Location (e.g., NY, Remote)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        style={{ maxWidth: '200px' }}
                    />
                    <button type="submit" className="btn btn-primary">
                        Search Jobs
                    </button>
                </div>
            </form>

            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {!loading && searched && jobs.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No jobs found</h3>
                    <p>Try different search terms or location</p>
                </div>
            )}

            {!loading && jobs.length > 0 && (
                <div className="results-grid">
                    {jobs.map(job => (
                        <div key={job.id} className="result-card">
                            <h3 className="result-title">{job.title}</h3>
                            <div className="result-meta">
                                {job.company} • {job.location}
                            </div>
                            <div className="result-meta" style={{ color: 'var(--success)' }}>
                                {job.salary}
                            </div>
                            <p className="result-description">{job.description}</p>
                            <div>
                                <span className="tag tag-primary">{job.source}</span>
                                <span className="tag">Posted: {job.postedDate}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Jobs;
