// Setup file for Jest tests
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.SESSION_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

jest.setTimeout(10000);
