const date = new Date().toISOString().replace(/[:.]/g, '-');
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js',
    '!**/*.spec.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  clearMocks: true,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './server/test-results',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
      },
    ],
  ],
};
