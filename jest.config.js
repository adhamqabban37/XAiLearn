module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: [
    "**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)",
    "**/*.(test|spec).(ts|tsx|js|jsx)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/cypress/",
    "/e2e/",
    "^<rootDir>/firestore.test.ts$",
    // Ignore legacy duplicate TS tests in favor of JS versions
    "^<rootDir>/src/lib/__tests__/auth.unit.test.ts$",
    "^<rootDir>/src/lib/__tests__/courses.unit.test.ts$",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^lucide-react$": "<rootDir>/__mocks__/lucide-react.js",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
