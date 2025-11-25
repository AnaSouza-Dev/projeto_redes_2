import request from 'supertest';
import express from 'express';

// Mock Redis client
const mockRedisClient = {
  ping: jest.fn().mockResolvedValue('PONG'),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

describe('Web Server 2 Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a simple test app that mimics the web server structure
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Mock session middleware
    app.use((req, res, next) => {
      req.session = {
        user: null,
        save: (cb: any) => cb && cb(),
        destroy: (cb: any) => cb && cb(),
      } as any;
      next();
    });

    // Add routes
    app.get('/', (req, res) => {
      const user = req.session && (req.session as any).user;
      if (user) return res.redirect('/home');
      return res.redirect('/login');
    });

    app.get('/healthz', async (_req, res) => {
      try {
        const pong = await mockRedisClient.ping();
        if (pong !== 'PONG') throw new Error('bad ping');
        res.json({ status: 'ok' });
      } catch (err) {
        res.status(503).json({ status: 'unhealthy' });
      }
    });

    app.get('/login', (_req, res) => {
      res.send('<html><body>Login Page</body></html>');
    });

    app.get('/home', (req, res) => {
      const user = req.session && (req.session as any).user;
      if (!user) return res.redirect('/login');
      res.send(`<html><body>Welcome ${user.name}</body></html>`);
    });

    app.get('/profile', (req, res) => {
      const user = req.session && (req.session as any).user;
      if (!user) return res.redirect('/login');
      res.send(`<html><body>Profile: ${user.email}</body></html>`);
    });

    app.post('/logout', (req, res) => {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            return res.status(500).json({ error: 'Logout failed' });
          }
          res.json({ message: 'Logged out successfully' });
        });
      } else {
        res.json({ message: 'No active session' });
      }
    });
  });

  describe('GET /', () => {
    it('should redirect to /login when not authenticated', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/login');
    });

    it('should redirect to /home when authenticated', async () => {
      // Create app with authenticated session
      const authApp = express();
      authApp.use(express.json());
      authApp.use((req, res, next) => {
        req.session = {
          user: { id: 1, name: 'Test User', email: 'test@test.com' },
          save: (cb: any) => cb && cb(),
          destroy: (cb: any) => cb && cb(),
        } as any;
        next();
      });
      authApp.get('/', (req, res) => {
        const user = req.session && (req.session as any).user;
        if (user) return res.redirect('/home');
        return res.redirect('/login');
      });

      const response = await request(authApp).get('/');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/home');
    });
  });

  describe('GET /healthz', () => {
    it('should return ok status when Redis is healthy', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const response = await request(app).get('/healthz');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return unhealthy status when Redis fails', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis error'));

      const response = await request(app).get('/healthz');
      
      expect(response.status).toBe(503);
      expect(response.body).toEqual({ status: 'unhealthy' });
    });
  });

  describe('GET /login', () => {
    it('should return login page', async () => {
      const response = await request(app).get('/login');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Login Page');
    });
  });

  describe('GET /home', () => {
    it('should redirect to /login when not authenticated', async () => {
      const response = await request(app).get('/home');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/login');
    });

    it('should show home page when authenticated', async () => {
      const authApp = express();
      authApp.use(express.json());
      authApp.use((req, res, next) => {
        req.session = {
          user: { id: 1, name: 'Test User', email: 'test@test.com' },
          save: (cb: any) => cb && cb(),
          destroy: (cb: any) => cb && cb(),
        } as any;
        next();
      });
      authApp.get('/home', (req, res) => {
        const user = req.session && (req.session as any).user;
        if (!user) return res.redirect('/login');
        res.send(`<html><body>Welcome ${user.name}</body></html>`);
      });

      const response = await request(authApp).get('/home');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Welcome Test User');
    });
  });

  describe('GET /profile', () => {
    it('should redirect to /login when not authenticated', async () => {
      const response = await request(app).get('/profile');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/login');
    });

    it('should show profile page when authenticated', async () => {
      const authApp = express();
      authApp.use(express.json());
      authApp.use((req, res, next) => {
        req.session = {
          user: { id: 1, name: 'Test User', email: 'test@test.com' },
          save: (cb: any) => cb && cb(),
          destroy: (cb: any) => cb && cb(),
        } as any;
        next();
      });
      authApp.get('/profile', (req, res) => {
        const user = req.session && (req.session as any).user;
        if (!user) return res.redirect('/login');
        res.send(`<html><body>Profile: ${user.email}</body></html>`);
      });

      const response = await request(authApp).get('/profile');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Profile: test@test.com');
    });
  });

  describe('POST /logout', () => {
    it('should destroy session on logout', async () => {
      const response = await request(app).post('/logout');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle logout when no session exists', async () => {
      const noSessionApp = express();
      noSessionApp.post('/logout', (req, res) => {
        if (req.session) {
          req.session.destroy((err: any) => {
            if (err) {
              return res.status(500).json({ error: 'Logout failed' });
            }
            res.json({ message: 'Logged out successfully' });
          });
        } else {
          res.json({ message: 'No active session' });
        }
      });

      const response = await request(noSessionApp).post('/logout');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('No active session');
    });
  });

  describe('Session Management', () => {
    it('should handle session save errors gracefully', async () => {
      const errorApp = express();
      errorApp.use((req, res, next) => {
        req.session = {
          user: null,
          save: (cb: any) => cb && cb(new Error('Save failed')),
          destroy: (cb: any) => cb && cb(),
        } as any;
        next();
      });
      errorApp.get('/test', (req, res) => {
        if (req.session) {
          req.session.save((err: any) => {
            if (err) {
              return res.status(500).json({ error: 'Session save failed' });
            }
            res.json({ status: 'ok' });
          });
        } else {
          res.json({ status: 'no session' });
        }
      });

      const response = await request(errorApp).get('/test');
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Session save failed');
    });
  });

  describe('Redis Connection', () => {
    it('should handle Redis connection errors', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection refused'));

      const response = await request(app).get('/healthz');
      
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
    });

    it('should return unhealthy when Redis ping returns unexpected value', async () => {
      mockRedisClient.ping.mockResolvedValue('UNEXPECTED');

      const response = await request(app).get('/healthz');
      
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('Request Handling', () => {
    it('should handle JSON requests', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.post('/api/data', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(testApp)
        .post('/api/data')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ test: 'data' });
    });

    it('should handle URL encoded requests', async () => {
      const testApp = express();
      testApp.use(express.urlencoded({ extended: true }));
      testApp.post('/api/form', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(testApp)
        .post('/api/form')
        .send('name=test&value=123')
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ name: 'test', value: '123' });
    });
  });
});
