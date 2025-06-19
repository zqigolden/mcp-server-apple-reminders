/**
 * Jest test setup file
 * This file is executed before all tests
 */

// Mock console.log for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(10000);

// Mock import.meta for Jest compatibility
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      url: 'file:///mock/test/path/file.js'
    }
  }
}); 