import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="animate-in">
            <section className="hero">
                <h1>🍯 The Sweetie App</h1>
                <p>
                    Your personal Swiss Army knife for life's everyday needs.
                    Job hunting, meal planning, and more – all in one place!
                </p>
            </section>

            <section className="feature-grid">
                <Link to="/jobs" className="feature-card">
                    <div className="feature-icon">💼</div>
                    <h3>Job Search</h3>
                    <p>
                        Search across popular job sites to find the perfect opportunity.
                        Filter by location, salary, and more.
                    </p>
                </Link>

                <Link to="/recipes" className="feature-card">
                    <div className="feature-icon">🍳</div>
                    <h3>Recipe Finder</h3>
                    <p>
                        Discover delicious recipes while filtering out allergens.
                        Perfect for dietary restrictions!
                    </p>
                </Link>

                <div className="feature-card">
                    <div className="feature-icon">✨</div>
                    <h3>Coming Soon</h3>
                    <p>
                        More features are on the way! Our AI team is constantly
                        improving this app based on your needs.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default Home;
