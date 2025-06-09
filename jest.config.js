/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-puppeteer',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '@testing-library/jest-dom'
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts,tsx}',
    '<rootDir>/tests/e2e/**/*.test.{js,ts}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  testEnvironmentOptions: {
    customExportConditions: [''],
  }
};