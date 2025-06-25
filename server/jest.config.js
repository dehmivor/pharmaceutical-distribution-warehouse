const date = new Date().toISOString().replace(/[:.]/g, '-');
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.js', '<rootDir>/src/**/*.(spec|test).js'],
  globalTeardown: '<rootDir>/testTeardown.js',
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
