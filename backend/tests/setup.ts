import { beforeAll, afterAll } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_taskmanagement';

// Mock database for tests
jest.mock('../src/db/connection', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeAll(async () => {
  // Setup test database or mocks
});

afterAll(async () => {
  // Cleanup
});