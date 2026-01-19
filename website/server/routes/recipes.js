import express from 'express';

const router = express.Router();

/**
 * Recipe Search API
 * 
 * Future integrations:
 * - Spoonacular API
 * - Edamam API
 * - TheMealDB
 * 
 * Current: Placeholder with mock data
 */

// Mock recipe data for development
const mockRecipes = [
    {
        id: '1',
        title: 'Honey Garlic Salmon',
        description: 'Delicious pan-seared salmon with honey garlic glaze',
        prepTime: 10,
        cookTime: 15,
        servings: 4,
        difficulty: 'Easy',
        image: 'https://via.placeholder.com/300x200?text=Salmon',
        ingredients: [
            '4 salmon fillets',
            '3 tbsp honey',
            '4 cloves garlic, minced',
            '2 tbsp soy sauce',
            '1 tbsp olive oil',
        ],
        instructions: [
            'Season salmon with salt and pepper',
            'Heat oil in a pan over medium-high heat',
            'Sear salmon for 4 minutes each side',
            'Mix honey, garlic, and soy sauce',
            'Add sauce to pan and glaze salmon',
        ],
        allergens: ['fish', 'soy'],
        tags: ['dinner', 'healthy', 'quick'],
        source: 'mock',
    },
    {
        id: '2',
        title: 'Classic Margherita Pizza',
        description: 'Simple and delicious Italian pizza with fresh basil',
        prepTime: 20,
        cookTime: 15,
        servings: 2,
        difficulty: 'Medium',
        image: 'https://via.placeholder.com/300x200?text=Pizza',
        ingredients: [
            '1 pizza dough',
            '1/2 cup tomato sauce',
            '8 oz fresh mozzarella',
            'Fresh basil leaves',
            '2 tbsp olive oil',
        ],
        instructions: [
            'Preheat oven to 475°F',
            'Roll out pizza dough',
            'Spread tomato sauce evenly',
            'Add sliced mozzarella',
            'Bake 12-15 minutes until golden',
            'Top with fresh basil and olive oil',
        ],
        allergens: ['gluten', 'dairy'],
        tags: ['dinner', 'italian', 'vegetarian'],
        source: 'mock',
    },
];

/**
 * Search for recipes
 * 
 * Query params:
 * - query: Search terms
 * - exclude: Comma-separated allergens to exclude (e.g., "peanuts,tree-nuts")
 * - diet: dietary preference (vegetarian, vegan, etc.)
 * - maxTime: Maximum total cook time in minutes
 */
router.get('/search', async (req, res) => {
    try {
        const { query, exclude, diet, maxTime } = req.query;

        // TODO: Implement real recipe API integration
        let results = [...mockRecipes];

        if (query) {
            const q = query.toLowerCase();
            results = results.filter(recipe =>
                recipe.title.toLowerCase().includes(q) ||
                recipe.description.toLowerCase().includes(q) ||
                recipe.tags.some(tag => tag.includes(q))
            );
        }

        if (exclude) {
            const excludeList = exclude.toLowerCase().split(',').map(a => a.trim());
            results = results.filter(recipe =>
                !recipe.allergens.some(allergen =>
                    excludeList.some(ex => allergen.includes(ex))
                )
            );
        }

        if (maxTime) {
            const max = parseInt(maxTime);
            results = results.filter(recipe =>
                (recipe.prepTime + recipe.cookTime) <= max
            );
        }

        res.json({
            success: true,
            query: { query, exclude, diet, maxTime },
            count: results.length,
            recipes: results,
            note: 'Using mock data. Real API integration coming soon!',
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get recipe details by ID
 */
router.get('/:id', async (req, res) => {
    const recipe = mockRecipes.find(r => r.id === req.params.id);

    if (!recipe) {
        return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    res.json({ success: true, recipe });
});

/**
 * Save a recipe to favorites
 */
router.post('/favorites', async (req, res) => {
    const { recipeId, userId } = req.body;

    // TODO: Implement favorites storage
    res.json({
        success: true,
        message: 'Recipe saved to favorites',
        recipeId,
    });
});

export default router;
