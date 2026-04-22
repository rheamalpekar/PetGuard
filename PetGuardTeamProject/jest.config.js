module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@react-native-async-storage/async-storage$": require.resolve("@react-native-async-storage/async-storage/jest/async-storage-mock"),
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
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  }
};