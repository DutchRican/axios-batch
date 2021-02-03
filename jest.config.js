module.exports = {
  "transform": {
    ".(ts|tsx)": "ts-jest"
  },
  "moduleFileExtensions": ["ts", "tsx", "js"],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testEnvironment: "node",
};
