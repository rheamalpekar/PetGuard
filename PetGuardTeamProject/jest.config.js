module.exports = {
  preset: "react-native",
  transformIgnorePatterns: [
    "node_modules/(?!react-native|@react-native|@testing-library/react-native)"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};