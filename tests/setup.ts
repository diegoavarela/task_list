import '@testing-library/jest-dom';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Extend Jest matchers
expect.extend({ toMatchImageSnapshot });

// Global test setup
beforeEach(() => {
  // Clear localStorage before each test
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});

// Mock window.crypto for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15)
  }
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});