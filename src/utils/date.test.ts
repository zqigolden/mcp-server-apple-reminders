import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import moment from 'moment';
import { execSync } from 'child_process';

// Mock dependencies
jest.mock('moment');
jest.mock('child_process');
jest.mock('./logger.js', () => ({
  debugLog: jest.fn()
}));

const mockMoment = moment as jest.MockedFunction<typeof moment>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

// Create a mock moment instance type
interface MockMomentInstance {
  format: jest.MockedFunction<any>;
  isValid: jest.MockedFunction<() => boolean>;
  locale: jest.MockedFunction<(locale: string) => MockMomentInstance>;
}

describe('Date Parser Tests (12-hour system)', () => {
  let mockMomentInstance: MockMomentInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecSync.mockReturnValue(Buffer.from('0'));
    
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
    expect(() => parseDate(input)).toThrow('Invalid date format: invalid-date');
    expect(mockMomentInstance.format).not.toHaveBeenCalled();
  });

  test('should handle empty string input', async () => {
    mockMomentInstance.isValid.mockReturnValue(false);
    const { parseDate } = await import('./date.js');
    const input = '';
    expect(() => parseDate(input)).toThrow('Invalid date format: ');
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
    mockExecSync.mockImplementation(() => { throw new Error('Command failed'); });
    mockMomentInstance.format.mockReturnValue('March 15, 2024 10:00:00 AM');
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15 10:00:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY h:mm:ss A');
    expect(result).toBe('March 15, 2024 10:00:00 AM');
  });

  test('should handle edge case dates', async () => {
    const { parseDate } = await import('./date.js');
    const testCases = [
      { input: '2024-02-29 12:00:00', output: 'February 29, 2024 12:00:00 PM' },
      { input: '2024-12-31 23:59:59', output: 'December 31, 2024 11:59:59 PM' },
      { input: '2024-01-01 00:00:00', output: 'January 1, 2024 12:00:00 AM' }
    ];
    testCases.forEach(({ input, output }) => {
      mockMomentInstance.format.mockReturnValue(output);
      const result = parseDate(input);
      expect(result).toBe(output);
    });
  });

  test('should handle moment parsing error', async () => {
    const input = 'invalid-date';
    mockMoment.mockImplementationOnce((() => {
      throw new Error('Moment parsing failed');
    }) as any);
    const { parseDate } = await import('./date.js');
    expect(() => parseDate(input)).toThrow('Invalid date format: invalid-date');
  });
});

describe('Date Parser Tests (24-hour system)', () => {
  let mockMomentInstance: MockMomentInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    
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
    mockExecSync.mockReturnValue(Buffer.from('1')); // 24-hour system
  });

  test('should use 24-hour format when system prefers it', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25 18:30:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY HH:mm:ss');
    expect(result).toBe('December 25, 2024 18:30:00');
  });
});