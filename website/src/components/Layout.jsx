import { Outlet, NavLink, Link } from 'react-router-dom';

function Layout() {
    return (
        <div className="app-layout">
            <nav className="nav">
                <Link to="/" className="nav-brand">
                    <span className="nav-brand-icon">🍯</span>
                    <span>The Sweetie App</span>
                </Link>

                <ul className="nav-links">
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            end
                        >
                            🏠 Home
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/jobs"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            💼 Jobs
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/recipes"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            🍳 Recipes
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <main>
                <Outlet />
            </main>

            <footer className="footer">
                <p>Made with ❤️ by Jason & Liz • The Sweetie App v1.0</p>
            </footer>
        </div>
    );
}

export default Layout;
