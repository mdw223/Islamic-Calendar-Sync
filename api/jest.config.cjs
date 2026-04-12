module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  coverageProvider: "v8",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/services/**/*.js",
    "src/util/**/*.js",
    "src/middleware/**/*.js",
    "!src/index.js",
    "!src/middleware/logger.js",
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
};
