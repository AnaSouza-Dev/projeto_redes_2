// Setup file for Jest tests
// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'testuser';
process.env.DB_PASS = 'testpass';
process.env.DB_NAME = 'testdb';
process.env.DB_PORT = '3306';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.SESSION_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(10000);
