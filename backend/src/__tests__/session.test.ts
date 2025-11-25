import request from 'supertest';
import express from 'express';

// Mock Redis client
const mockRedisClient = {
  ping: jest.fn().mockResolvedValue('PONG'),
  connect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe('Session Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create Redis client with correct configuration', () => {
    process.env.REDIS_HOST = 'testredis';
    process.env.REDIS_PORT = '6380';

    // Re-import to apply new environment variables
    jest.resetModules();
    const { redisClient } = require('../session');

    expect(redisClient).toBeDefined();
  });

  it('should handle Redis connection errors gracefully', async () => {
    const mockErrorClient = {
      ...mockRedisClient,
      connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
    };

    jest.resetModules();
    jest.doMock('redis', () => ({
      createClient: jest.fn(() => mockErrorClient),
    }));

    // Should not throw - errors are caught
    expect(() => require('../session')).not.toThrow();
  });

  it('should create session middleware', () => {
    jest.resetModules();
    const { sessionMiddleware } = require('../session');

    expect(sessionMiddleware).toBeDefined();
    expect(typeof sessionMiddleware).toBe('function');
  });

  it('should apply session middleware to requests', async () => {
    jest.resetModules();
    const { sessionMiddleware } = require('../session');

    const app = express();
    app.use(express.json());
    app.use(sessionMiddleware);
    
    app.get('/test', (req, res) => {
      res.json({ hasSession: !!req.session });
    });

    const response = await request(app).get('/test');
    
    expect(response.status).toBe(200);
    expect(response.body.hasSession).toBe(true);
  });
});
