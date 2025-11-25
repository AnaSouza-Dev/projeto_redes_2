import mysql from 'mysql2/promise';

// Mock mysql2
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear require cache to reload module with fresh mocks
    jest.resetModules();
  });

  it('should create a connection pool with correct configuration', () => {
    // Set environment variables
    process.env.DB_HOST = 'testhost';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASS = 'testpass';
    process.env.DB_NAME = 'testdb';
    process.env.DB_PORT = '3307';

    // Re-import the module with mocked mysql
    jest.isolateModules(() => {
      const mysql2 = require('mysql2/promise');
      require('../db');
      
      expect(mysql2.createPool).toHaveBeenCalledWith({
        host: 'testhost',
        user: 'testuser',
        password: 'testpass',
        database: 'testdb',
        port: 3307,
        connectionLimit: 10,
      });
    });
  });

  it('should use default values when environment variables are not set', () => {
    // Clear environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASS;
    delete process.env.DB_NAME;
    delete process.env.DB_PORT;

    // Re-import the module with mocked mysql
    jest.isolateModules(() => {
      const mysql2 = require('mysql2/promise');
      require('../db');
      
      expect(mysql2.createPool).toHaveBeenCalledWith({
        host: 'db',
        user: 'appuser',
        password: 'apppassword',
        database: 'appdb',
        port: 3306,
        connectionLimit: 10,
      });
    });
  });
});
