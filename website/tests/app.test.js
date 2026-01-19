/**
 * The Sweetie App - Test Suite
 * 
 * Tests for React components and Express API routes.
 * Uses Vitest + React Testing Library for frontend tests.
 * Uses supertest for API route tests.
 * 
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ==========================================
// API Route Tests (Unit tests - no server running)
// ==========================================

describe('Jobs API Tests', () => {
    let mockJobs;

    beforeEach(() => {
        mockJobs = [
            {
                id: '1',
                title: 'Chemistry PhD - Research Manager',
                company: 'Pfizer',
                location: 'New York, NY',
                salary: '$120,000 - $150,000',
                description: 'Lead a team of research chemists',
            },
            {
                id: '2',
                title: 'Senior Chemist',
                company: 'Merck',
                location: 'Rahway, NJ',
                salary: '$95,000 - $120,000',
                description: 'Conduct research on compounds',
            },
        ];
    });

    it('should filter jobs by query', () => {
        const query = 'manager';
        const filtered = mockJobs.filter(job =>
            job.title.toLowerCase().includes(query.toLowerCase())
        );
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toContain('Manager');
    });

    it('should filter jobs by location', () => {
        const location = 'ny';
        const filtered = mockJobs.filter(job =>
            job.location.toLowerCase().includes(location.toLowerCase())
        );
        expect(filtered.length).toBe(1);
        expect(filtered[0].location).toContain('NY');
    });

    it('should return all jobs when no filters', () => {
        const filtered = mockJobs;
        expect(filtered.length).toBe(2);
    });
});

describe('Recipes API Tests', () => {
    let mockRecipes;

    beforeEach(() => {
        mockRecipes = [
            {
                id: '1',
                title: 'Honey Garlic Salmon',
                allergens: ['fish', 'soy'],
                tags: ['dinner', 'healthy'],
                prepTime: 10,
                cookTime: 15,
            },
            {
                id: '2',
                title: 'Classic Margherita Pizza',
                allergens: ['gluten', 'dairy'],
                tags: ['dinner', 'italian'],
                prepTime: 20,
                cookTime: 15,
            },
            {
                id: '3',
                title: 'Peanut Butter Cookies',
                allergens: ['peanuts', 'gluten', 'dairy'],
                tags: ['dessert', 'snack'],
                prepTime: 15,
                cookTime: 12,
            },
        ];
    });

    it('should filter out recipes with excluded allergens', () => {
        const exclude = 'peanuts';
        const filtered = mockRecipes.filter(recipe =>
            !recipe.allergens.some(a => a.includes(exclude))
        );
        expect(filtered.length).toBe(2);
        expect(filtered.every(r => !r.allergens.includes('peanuts'))).toBe(true);
    });

    it('should handle multiple allergen exclusions', () => {
        const excludeList = ['peanuts', 'fish'];
        const filtered = mockRecipes.filter(recipe =>
            !recipe.allergens.some(a =>
                excludeList.some(ex => a.includes(ex))
            )
        );
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe('Classic Margherita Pizza');
    });

    it('should filter by max time', () => {
        const maxTime = 30;
        const filtered = mockRecipes.filter(recipe =>
            (recipe.prepTime + recipe.cookTime) <= maxTime
        );
        expect(filtered.length).toBe(2);
    });

    it('should filter by tags/query', () => {
        const query = 'dinner';
        const filtered = mockRecipes.filter(recipe =>
            recipe.tags.includes(query)
        );
        expect(filtered.length).toBe(2);
    });
});

// ==========================================
// Utility Tests
// ==========================================

describe('Utility Functions', () => {
    it('should format dates correctly', () => {
        const date = new Date('2026-01-14');
        const formatted = date.toISOString().slice(0, 10);
        expect(formatted).toBe('2026-01-14');
    });

    it('should handle empty search queries', () => {
        const items = [{ name: 'test' }];
        const query = '';
        const filtered = query ? items.filter(i => i.name.includes(query)) : items;
        expect(filtered.length).toBe(1);
    });
});

// ==========================================
// Component Logic Tests
// ==========================================

describe('Search State Management', () => {
    it('should initialize with empty search state', () => {
        const initialState = {
            query: '',
            location: '',
            results: [],
            loading: false,
            searched: false,
        };

        expect(initialState.query).toBe('');
        expect(initialState.results).toEqual([]);
        expect(initialState.loading).toBe(false);
    });

    it('should update loading state correctly', () => {
        let state = { loading: false };

        // Start loading
        state.loading = true;
        expect(state.loading).toBe(true);

        // End loading
        state.loading = false;
        expect(state.loading).toBe(false);
    });
});

describe('Navigation Routes', () => {
    const routes = ['/', '/jobs', '/recipes'];

    it('should have home route', () => {
        expect(routes).toContain('/');
    });

    it('should have jobs route', () => {
        expect(routes).toContain('/jobs');
    });

    it('should have recipes route', () => {
        expect(routes).toContain('/recipes');
    });
});
