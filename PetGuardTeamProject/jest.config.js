module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!react-native|@react-native|@testing-library/react-native)"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/_tests_/**/*.test.ts",
    "**/_tests_/**/*.test.tsx"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/emergency/core/**/*.ts",
    "utils/**/*.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};