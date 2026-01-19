export default {
    testEnvironment: 'node',
    transform: {},
    moduleFileExtensions: ['js', 'mjs'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/cli/**',
    ],
    coverageDirectory: 'coverage',
    verbose: true,
};
