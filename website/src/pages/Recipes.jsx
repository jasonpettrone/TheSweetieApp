import { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

function Recipes() {
    const [query, setQuery] = useState('');
    const [exclude, setExclude] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const searchRecipes = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);

        try {
            const response = await axios.get(`${API_BASE}/recipes/search`, {
                params: { query, exclude }
            });
            setRecipes(response.data.recipes);
        } catch (error) {
            console.error('Error searching recipes:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in">
            <header className="page-header">
                <h1>🍳 Recipe Finder</h1>
                <p>Discover delicious recipes with allergen filtering</p>
            </header>

            <form className="search-container" onSubmit={searchRecipes}>
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search recipes (e.g., pasta, chicken, dessert)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Exclude allergens (e.g., peanuts, nuts)"
                        value={exclude}
                        onChange={(e) => setExclude(e.target.value)}
                        style={{ maxWidth: '250px' }}
                    />
                    <button type="submit" className="btn btn-primary">
                        Find Recipes
                    </button>
                </div>
            </form>

            {loading && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {!loading && searched && recipes.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">🥗</div>
                    <h3>No recipes found</h3>
                    <p>Try different search terms or allergen filters</p>
                </div>
            )}

            {!loading && recipes.length > 0 && (
                <div className="results-grid">
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="result-card">
                            <h3 className="result-title">{recipe.title}</h3>
                            <div className="result-meta">
                                ⏱ {recipe.prepTime + recipe.cookTime} min •
                                👥 {recipe.servings} servings •
                                📊 {recipe.difficulty}
                            </div>
                            <p className="result-description">{recipe.description}</p>
                            <div>
                                {recipe.tags.map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                {recipe.allergens.map(allergen => (
                                    <span key={allergen} className="tag" style={{ background: 'var(--warning)', color: '#000' }}>
                                        ⚠️ {allergen}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Recipes;
