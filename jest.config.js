module.exports = {
  "transform": {
    ".(ts|tsx)": "ts-jest"
  },
  "moduleFileExtensions": ["ts", "tsx", "js"],
  "collectCoverageFrom": [
    "**/lib/**/*.{ts}",
    "!**/node_modules/**",
    "!**/vendor/**"
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testEnvironment: "node",
};
