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
    "!src/middleware/Logger.js",
  ],
};
