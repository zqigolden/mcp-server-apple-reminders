import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RemindersManager, remindersManager } from './reminders.js';
import type { Reminder, ReminderList } from '../types/index.js';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');
jest.mock('url');
jest.mock('./logger.js');

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockFileURLToPath = fileURLToPath as jest.MockedFunction<typeof fileURLToPath>;

describe('RemindersManager', () => {
  let manager: RemindersManager;
  let mockProcess: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset NODE_ENV
    delete process.env.NODE_ENV;
    
    // Mock path operations
    mockFileURLToPath.mockReturnValue('/test/file/path.js');
    mockPath.dirname.mockReturnValue('/test/file');
    mockPath.join.mockImplementation((...args) => args.join('/'));
    
    // Mock fs operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.accessSync.mockReturnValue(undefined);
    
    // Mock process events
    mockProcess = {
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn()
    };
    
    mockSpawn.mockReturnValue(mockProcess as any);
  });

  describe('constructor', () => {
    test('should skip binary initialization in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      manager = new RemindersManager();
      
      expect(mockFs.existsSync).not.toHaveBeenCalled();
    });

    test('should initialize binary path in non-test environment', () => {
      manager = new RemindersManager();
      
      // The getModulePaths function uses Function constructor which may fail in test env
      // but binary path should still be set via fallback
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    test('should throw error if binary does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      expect(() => new RemindersManager()).toThrow('Swift binary not found');
    });

    test('should throw error if binary is not executable', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.accessSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      expect(() => new RemindersManager()).toThrow('Swift binary is not executable');
    });

    test('should resolve project root by finding package.json', () => {
      let callCount = 0;
      mockFs.existsSync.mockImplementation((filePath: any) => {
        callCount++;
        if (typeof filePath === 'string' && filePath.includes('package.json')) {
          return callCount > 2; // Return true after a few attempts
        }
        return true;
      });
      
      manager = new RemindersManager();
      
      expect(mockFs.existsSync).toHaveBeenCalledWith(expect.stringContaining('package.json'));
    });
  });

  describe('getReminders', () => {
    beforeEach(() => {
      manager = new RemindersManager();
    });

    test('should spawn Swift binary with correct arguments for showCompleted=false', async () => {
      const mockOutput = `=== REMINDER LISTS ===
1. Default
2. Work

=== ALL REMINDERS ===
Title: Buy groceries
Due Date: 2024-03-15 10:00:00
Notes: Milk and eggs
List: Default
Status: Incomplete
Raw isCompleted value: false
-------------------
Title: Work meeting
Due Date: 2024-03-16 14:00:00
Notes: 
List: Work
Status: Completed
Raw isCompleted value: true
-------------------`;

      // Setup mock process behavior
      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from(mockOutput));
        }
      });
      
      mockProcess.stderr.on.mockImplementation(() => {});
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(0); // Exit code 0 = success
        }
      });

      const result = await manager.getReminders(false);

      expect(mockSpawn).toHaveBeenCalledWith(expect.any(String), []);
      expect(result.lists).toHaveLength(2);
      expect(result.reminders).toHaveLength(2);
      expect(result.lists[0]).toEqual({ id: 1, title: 'Default' });
      expect(result.reminders[0].title).toBe('Buy groceries');
      expect(result.reminders[0].isCompleted).toBe(false);
      expect(result.reminders[1].isCompleted).toBe(true);
    });

    test('should spawn Swift binary with showCompleted flag when true', async () => {
      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from('=== REMINDER LISTS ===\n=== ALL REMINDERS ==='));
        }
      });
      
      mockProcess.stderr.on.mockImplementation(() => {});
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(0);
        }
      });

      await manager.getReminders(true);

      expect(mockSpawn).toHaveBeenCalledWith(expect.any(String), ['--show-completed']);
    });

    test('should handle Swift binary execution failure', async () => {
      const errorMessage = 'Permission denied';
      
      mockProcess.stderr.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from(errorMessage));
        }
      });
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(1); // Exit code 1 = failure
        }
      });

      await expect(manager.getReminders()).rejects.toThrow(`Failed to get reminders: ${errorMessage}`);
    });

    test('should handle malformed Swift output', async () => {
      const malformedOutput = 'Invalid output format';
      
      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from(malformedOutput));
        }
      });
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(0);
        }
      });

      const result = await manager.getReminders();

      expect(result.lists).toEqual([]);
      expect(result.reminders).toEqual([]);
    });

    test('should parse complex reminder output correctly', async () => {
      const complexOutput = `=== REMINDER LISTS ===
1. Shopping
2. Work
3. Personal

=== ALL REMINDERS ===
Title: Complex task with "quotes"
Due Date: 2024-12-25 23:59:59
Notes: Multi-line
note content
with special chars & symbols
List: Work
Status: Incomplete
Raw isCompleted value: false
-------------------
Title: No due date task
Due Date: 
Notes: 
List: Personal
Status: Completed
Raw isCompleted value: true
-------------------`;

      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from(complexOutput));
        }
      });
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(0);
        }
      });

      const result = await manager.getReminders();

      expect(result.lists).toHaveLength(3);
      expect(result.reminders).toHaveLength(2);
      
      const complexReminder = result.reminders[0];
      expect(complexReminder.title).toBe('Complex task with "quotes"');
      expect(complexReminder.dueDate).toBe('2024-12-25 23:59:59');
      expect(complexReminder.notes).toContain('Multi-line');
      expect(complexReminder.list).toBe('Work');
      expect(complexReminder.isCompleted).toBe(false);
      
      const noDueDateReminder = result.reminders[1];
      expect(noDueDateReminder.title).toBe('No due date task');
      expect(noDueDateReminder.dueDate).toBe('');
      expect(noDueDateReminder.isCompleted).toBe(true);
    });

    test('should handle parsing errors gracefully', async () => {
      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          // Simulate parsing error by throwing during parse
          callback(Buffer.from('=== REMINDER LISTS ===\n=== ALL REMINDERS ==='));
        }
      });
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          // Simulate parsing error
          callback(0);
        }
      });

      // Mock parseSwiftOutput to throw
      const originalParseSwiftOutput = (manager as any).parseSwiftOutput;
      (manager as any).parseSwiftOutput = jest.fn().mockImplementation(() => {
        throw new Error('Parse error');
      });

      await expect(manager.getReminders()).rejects.toThrow('Parse error');

      // Restore original method
      (manager as any).parseSwiftOutput = originalParseSwiftOutput;
    });

    test('should normalize isCompleted values correctly', async () => {
      const testOutput = `=== REMINDER LISTS ===
1. Test

=== ALL REMINDERS ===
Title: String true
List: Test
Status: Completed
Raw isCompleted value: true
-------------------
Title: String false
List: Test
Status: Incomplete
Raw isCompleted value: false
-------------------
Title: Boolean true
List: Test
Status: Completed
Raw isCompleted value: true
-------------------`;

      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from(testOutput));
        }
      });
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(0);
        }
      });

      const result = await manager.getReminders();

      expect(result.reminders).toHaveLength(3);
      expect(result.reminders[0].isCompleted).toBe(true);
      expect(result.reminders[1].isCompleted).toBe(false);
      expect(result.reminders[2].isCompleted).toBe(true);
      
      // All isCompleted values should be boolean
      result.reminders.forEach(reminder => {
        expect(typeof reminder.isCompleted).toBe('boolean');
      });
    });

    test('should handle incomplete reminder data', async () => {
      const incompleteOutput = `=== REMINDER LISTS ===
1. Test

=== ALL REMINDERS ===
Title: Incomplete reminder
Due Date: 2024-03-15
-------------------
Title: 
List: Test
Status: Incomplete
Raw isCompleted value: false
-------------------
Title: Valid reminder
List: Test
Status: Incomplete
Raw isCompleted value: false
-------------------`;

      mockProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callback(Buffer.from(incompleteOutput));
        }
      });
      
      mockProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(0);
        }
      });

      const result = await manager.getReminders();

      // Should only include reminders with both title and list
      expect(result.reminders).toHaveLength(1);
      expect(result.reminders[0].title).toBe('Valid reminder');
    });
  });

  describe('normalizeIsCompleted', () => {
    beforeEach(() => {
      manager = new RemindersManager();
    });

    test('should handle various input types', () => {
      const normalize = (manager as any).normalizeIsCompleted.bind(manager);
      
      expect(normalize(true)).toBe(true);
      expect(normalize(false)).toBe(false);
      expect(normalize('true')).toBe(true);
      expect(normalize('false')).toBe(false);
      expect(normalize('TRUE')).toBe(true);
      expect(normalize('FALSE')).toBe(false); // 'FALSE' lowercased is 'false', not 'true'
      expect(normalize('')).toBe(false);
      expect(normalize(null)).toBe(false);
      expect(normalize(undefined)).toBe(false);
      expect(normalize(0)).toBe(false);
      expect(normalize(1)).toBe(true);
    });
  });
});

describe('remindersManager singleton', () => {
  test('should export a singleton instance', () => {
    expect(remindersManager).toBeInstanceOf(RemindersManager);
  });
});