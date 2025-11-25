import request from 'supertest';
import express from 'express';
import routes from '../routes';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../session', () => ({
  redisClient: {
    ping: jest.fn().mockResolvedValue('PONG'),
  },
  sessionMiddleware: (req: any, res: any, next: any) => {
    req.session = {
      user: null,
      save: (cb: any) => cb && cb(),
      destroy: (cb: any) => cb && cb(),
    };
    next();
  },
}));

import { pool } from '../db';

describe('Backend API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = {
        user: null,
        save: (cb: any) => cb && cb(),
        destroy: (cb: any) => cb && cb(),
      } as any;
      next();
    });
    app.use('/api', routes);
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      const testDate = new Date();
      const mockUsers = [
        { id: 1, name: 'Test User', email: 'test@test.com', created_at: testDate, last_login: null },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockUsers]);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      // JSON serializes dates as ISO strings
      expect(response.body).toEqual([{
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        created_at: testDate.toISOString(),
        last_login: null
      }]);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, name, email, created_at, last_login FROM users'
      );
    });

    it('should handle database errors', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
      };

      const testDate = new Date();
      const mockResult = { insertId: 1 };
      const mockCreatedUser = {
        id: 1,
        name: newUser.name,
        email: newUser.email,
        created_at: testDate,
        last_login: null,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockResult])
        .mockResolvedValueOnce([[mockCreatedUser]]);

      const response = await request(app).post('/api/users').send(newUser);

      expect(response.status).toBe(201);
      // JSON serializes dates as ISO strings
      expect(response.body).toEqual({
        id: 1,
        name: newUser.name,
        email: newUser.email,
        created_at: testDate.toISOString(),
        last_login: null
      });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app).post('/api/users').send({
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: '`name`, `email` and `password` are required',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app).post('/api/users').send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid email format' });
    });

    it('should return 409 for duplicate email', async () => {
      const newUser = {
        name: 'New User',
        email: 'existing@test.com',
        password: 'password123',
      };

      const error: any = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';

      (pool.query as jest.Mock).mockRejectedValueOnce(error);

      const response = await request(app).post('/api/users').send(newUser);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Email already exists' });
    });
  });

  describe('POST /api/login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@test.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        password: hashedPassword,
        last_login: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app).post('/api/login').send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 400 if email or password is missing', async () => {
      const response = await request(app).post('/api/login').send({
        email: 'test@test.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'email and password required' });
    });

    it('should return 401 for non-existent user', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      const response = await request(app).post('/api/login').send({
        email: 'nonexistent@test.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        password: hashedPassword,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce([[mockUser]]);

      const response = await request(app).post('/api/login').send({
        email: 'test@test.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('POST /api/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app).post('/api/logout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });
  });

  describe('GET /api/me', () => {
    it('should return user info when authenticated', async () => {
      const testDate = new Date();
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        last_login: testDate,
      };

      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.session = {
          user: mockUser,
          save: (cb: any) => cb && cb(),
          destroy: (cb: any) => cb && cb(),
        } as any;
        next();
      });
      app.use('/api', routes);

      const response = await request(app).get('/api/me');

      expect(response.status).toBe(200);
      // JSON serializes dates as ISO strings
      expect(response.body).toEqual({
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        last_login: testDate.toISOString()
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Not authenticated' });
    });
  });
});
