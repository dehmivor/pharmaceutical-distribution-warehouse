module.exports = {
  displayName: 'client',
  testEnvironment: 'jsdom',
  // Sửa đường dẫn testMatch
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.(spec|test).[jt]s?(x)'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        // Sửa outputDirectory thành đường dẫn tương đối
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        ancestorSeparator: ' › '
      }
    ]
  ]
};
