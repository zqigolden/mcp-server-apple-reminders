import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import moment from 'moment';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock dependencies
jest.mock('moment');
jest.mock('child_process');
jest.mock('./logger.js', () => ({
  debugLog: jest.fn()
}));

const mockMoment = moment as jest.MockedFunction<typeof moment>;
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Create a mock moment instance type
interface MockMomentInstance {
  format: jest.MockedFunction<any>;
  isValid: jest.MockedFunction<() => boolean>;
  locale: jest.MockedFunction<(locale: string) => MockMomentInstance>;
}

// Helper to create mock spawn process
function createMockSpawnProcess(returnValue: string) {
  const mockProcess = new EventEmitter() as any;
  mockProcess.stdout = new EventEmitter();
  mockProcess.stderr = new EventEmitter();
  
  // Simulate async process completion
  setTimeout(() => {
    mockProcess.stdout.emit('data', Buffer.from(returnValue));
    mockProcess.emit('close', 0);
  }, 0);
  
  return mockProcess;
}

describe('Date Parser Tests (12-hour system)', () => {
  let mockMomentInstance: MockMomentInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock spawn to return '0' for 12-hour system
    mockSpawn.mockReturnValue(createMockSpawnProcess('0'));
    
    // Create mock moment instance
    mockMomentInstance = {
      format: jest.fn().mockReturnValue('March 15, 2024 2:30:00 PM'),
      isValid: jest.fn().mockReturnValue(true),
      locale: jest.fn().mockReturnThis()
    } as MockMomentInstance;
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
  });

  test('should parse ISO 8601 date format', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15T10:00:00Z';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(input, [
      'YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'
    ], true);
    expect(result).toBe('March 15, 2024 2:30:00 PM');
  });

  test('should parse YYYY-MM-DD HH:mm:ss format', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15 14:30:00';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(input, [
      'YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'
    ], true);
    expect(result).toBe('March 15, 2024 2:30:00 PM');
  });

  test('should parse YYYY-MM-DD format', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(input, [
      'YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'
    ], true);
    expect(result).toBe('March 15, 2024 2:30:00 PM');
  });

  test('should format output with English locale for 12-hour system', async () => {
    mockMomentInstance.format.mockReturnValue('December 25, 2024 6:30:00 PM');
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25 18:30:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY h:mm:ss A');
    expect(result).toBe('December 25, 2024 6:30:00 PM');
  });

  test('should handle invalid date gracefully', async () => {
    mockMomentInstance.isValid.mockReturnValue(false);
    const { parseDate } = await import('./date.js');
    const input = 'invalid-date';
    expect(() => parseDate(input)).toThrow(
      'Invalid or unsupported date format: "invalid-date". ' +
      'Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ' +
      'Example: "2024-12-25 14:30:00"'
    );
    expect(mockMomentInstance.format).not.toHaveBeenCalled();
  });

  test('should handle empty string input', async () => {
    mockMomentInstance.isValid.mockReturnValue(false);
    const { parseDate } = await import('./date.js');
    const input = '';
    expect(() => parseDate(input)).toThrow(
      'Invalid or unsupported date format: "". ' +
      'Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ' +
      'Example: "2024-12-25 14:30:00"'
    );
  });

  test('should use strict parsing', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15';
    parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(input, [
      'YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'
    ], true);
  });

  test('should handle timezone information in ISO format', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15T10:00:00-05:00';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(input, [
      'YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'
    ], true);
    expect(result).toBe('March 15, 2024 2:30:00 PM');
  });

  test('should handle system command failure gracefully', async () => {
    // Mock spawn to simulate command failure
    const failedProcess = new EventEmitter() as any;
    failedProcess.stdout = new EventEmitter();
    failedProcess.stderr = new EventEmitter();
    setTimeout(() => {
      failedProcess.stderr.emit('data', Buffer.from('Command failed'));
      failedProcess.emit('close', 1);
    }, 0);
    mockSpawn.mockReturnValue(failedProcess);
    mockMomentInstance.format.mockReturnValue('March 15, 2024 10:00:00 AM');
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15 10:00:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY h:mm:ss A');
    expect(result).toBe('March 15, 2024 10:00:00 AM');
  });

  test('should handle leap year date correctly', async () => {
    mockMomentInstance.format.mockReturnValue('February 29, 2024 12:00:00 PM');
    const { parseDate } = await import('./date.js');
    const result = parseDate('2024-02-29 12:00:00');
    expect(result).toBe('February 29, 2024 12:00:00 PM');
  });

  test('should handle end of year date correctly', async () => {
    mockMomentInstance.format.mockReturnValue('December 31, 2024 11:59:59 PM');
    const { parseDate } = await import('./date.js');
    const result = parseDate('2024-12-31 23:59:59');
    expect(result).toBe('December 31, 2024 11:59:59 PM');
  });

  test('should handle start of year date correctly', async () => {
    mockMomentInstance.format.mockReturnValue('January 1, 2024 12:00:00 AM');
    const { parseDate } = await import('./date.js');
    const result = parseDate('2024-01-01 00:00:00');
    expect(result).toBe('January 1, 2024 12:00:00 AM');
  });

  test('should handle moment parsing error', async () => {
    const input = 'invalid-date';
    mockMoment.mockImplementationOnce((() => {
      throw new Error('Moment parsing failed');
    }) as any);
    const { parseDate } = await import('./date.js');
    expect(() => parseDate(input)).toThrow(
      'Invalid or unsupported date format: "invalid-date". ' +
      'Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ' +
      'Example: "2024-12-25 14:30:00"'
    );
  });
});

describe('Date Parser Tests (24-hour system)', () => {
  let mockMomentInstance: MockMomentInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Mock spawn to return '1' for 24-hour system
    mockSpawn.mockReturnValue(createMockSpawnProcess('1'));
    
    // Clear the time preference cache to ensure fresh state
    const { clearTimePreferenceCache } = await import('./date.js');
    clearTimePreferenceCache();
    
    // Create mock moment instance for 24-hour system
    mockMomentInstance = {
      format: jest.fn().mockReturnValue('December 25, 2024 18:30:00'),
      isValid: jest.fn().mockReturnValue(true),
      locale: jest.fn().mockReturnThis()
    } as MockMomentInstance;
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
  });

  test('should use 24-hour format when system prefers it', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25 18:30:00';
    
    // First call will use default (12-hour), but trigger async update
    parseDate(input);
    
    // Wait for async system determination to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Clear mock calls from first invocation
    jest.clearAllMocks();
    mockMomentInstance.format.mockReturnValue('December 25, 2024 18:30:00');
    
    // Second call should use 24-hour format from cache
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY HH:mm:ss');
    expect(result).toBe('December 25, 2024 18:30:00');
  });
});