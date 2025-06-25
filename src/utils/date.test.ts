import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import moment from 'moment';
import { execSync } from 'child_process';
import { parseDate } from './date.js';

// Mock dependencies
jest.mock('moment');
jest.mock('child_process');
jest.mock('./logger.js', () => ({
  debugLog: jest.fn()
}));

const mockMoment = moment as jest.MockedFunction<typeof moment>;
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('Date Parser Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behavior
    const mockMomentInstance = {
      format: jest.fn(),
      isValid: jest.fn()
    };
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
    mockMomentInstance.format.mockReturnValue('3/15/2024 10:00:00');
    mockMomentInstance.isValid.mockReturnValue(true);
    
    // Mock system 24-hour time check
    mockExecSync.mockReturnValue(Buffer.from('0')); // Default to 12-hour format
  });

  test('should parse ISO 8601 date format', () => {
    const input = '2024-03-15T10:00:00Z';
    const result = parseDate(input);
    
    expect(mockMoment).toHaveBeenCalledWith(input, [
      "YYYY-MM-DD HH:mm:ss",
      moment.ISO_8601,
      "YYYY-MM-DD"
    ], true);
    expect(result).toBe('3/15/2024 10:00:00');
  });

  test('should parse YYYY-MM-DD HH:mm:ss format', () => {
    const input = '2024-03-15 14:30:00';
    const result = parseDate(input);
    
    expect(mockMoment).toHaveBeenCalledWith(input, [
      "YYYY-MM-DD HH:mm:ss",
      moment.ISO_8601,
      "YYYY-MM-DD"
    ], true);
    expect(result).toBe('3/15/2024 10:00:00');
  });

  test('should parse YYYY-MM-DD format', () => {
    const input = '2024-03-15';
    const result = parseDate(input);
    
    expect(mockMoment).toHaveBeenCalledWith(input, [
      "YYYY-MM-DD HH:mm:ss",
      moment.ISO_8601,
      "YYYY-MM-DD"
    ], true);
    expect(result).toBe('3/15/2024 10:00:00');
  });

  test('should format output to M/D/YYYY h:mm:ss A for 12-hour system', () => {
    const input = '2024-12-25 18:30:00';
    const mockMomentInstance = {
      format: jest.fn().mockReturnValue('12/25/2024 6:30:00 PM'),
      isValid: jest.fn().mockReturnValue(true)
    };
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
    mockExecSync.mockReturnValue(Buffer.from('0')); // 12-hour system
    
    const result = parseDate(input);
    
    expect(mockMomentInstance.format).toHaveBeenCalledWith('M/D/YYYY h:mm:ss A');
    expect(result).toBe('12/25/2024 6:30:00 PM');
  });

  test('should format output correctly based on system preference', () => {
    const input = '2024-12-25 18:30:00';
    const mockMomentInstance = {
      format: jest.fn().mockReturnValue('12/25/2024 6:30:00 PM'),
      isValid: jest.fn().mockReturnValue(true)
    };
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
    
    const result = parseDate(input);
    
    // Should call format with appropriate format string based on system preference
    expect(mockMomentInstance.format).toHaveBeenCalled();
    expect(result).toBe('12/25/2024 6:30:00 PM');
  });

  test('should handle invalid date gracefully', () => {
    const input = 'invalid-date';
    const mockMomentInstance = {
      format: jest.fn(),
      isValid: jest.fn().mockReturnValue(false)
    };
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
    
    expect(() => parseDate(input)).toThrow('Invalid date format: invalid-date');
    expect(mockMomentInstance.format).not.toHaveBeenCalled();
  });

  test('should handle empty string input', () => {
    const input = '';
    const mockMomentInstance = {
      format: jest.fn(),
      isValid: jest.fn().mockReturnValue(false)
    };
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
    
    expect(() => parseDate(input)).toThrow('Invalid date format: ');
  });

  test('should use strict parsing', () => {
    const input = '2024-03-15';
    parseDate(input);
    
    expect(mockMoment).toHaveBeenCalledWith(input, [
      "YYYY-MM-DD HH:mm:ss",
      moment.ISO_8601,
      "YYYY-MM-DD"
    ], true); // strict parsing enabled
  });

  test('should handle timezone information in ISO format', () => {
    const input = '2024-03-15T10:00:00-05:00';
    const result = parseDate(input);
    
    expect(mockMoment).toHaveBeenCalledWith(input, [
      "YYYY-MM-DD HH:mm:ss",
      moment.ISO_8601,
      "YYYY-MM-DD"
    ], true);
    expect(result).toBe('3/15/2024 10:00:00');
  });

  test('should handle date parsing with system settings', () => {
    const input = '2024-03-15 10:00:00';
    
    const result = parseDate(input);
    
    // Should return formatted date regardless of system settings
    expect(result).toBe('3/15/2024 10:00:00');
  });

  test('should handle system command failure gracefully', () => {
    const input = '2024-03-15 10:00:00';
    mockExecSync.mockImplementation(() => {
      throw new Error('Command failed');
    });
    
    const mockMomentInstance = {
      format: jest.fn().mockReturnValue('3/15/2024 10:00:00 AM'),
      isValid: jest.fn().mockReturnValue(true)
    };
    
    mockMoment.mockReturnValue(mockMomentInstance as any);
    
    const result = parseDate(input);
    
    // Should default to 12-hour format on command failure
    expect(mockMomentInstance.format).toHaveBeenCalledWith('M/D/YYYY h:mm:ss A');
    expect(result).toBe('3/15/2024 10:00:00 AM');
  });

  test('should handle edge case dates', () => {
    const testCases = [
      '2024-02-29 12:00:00', // Leap year
      '2024-12-31 23:59:59', // End of year
      '2024-01-01 00:00:00'  // Start of year
    ];

    testCases.forEach(testCase => {
      const mockMomentInstance = {
        format: jest.fn().mockReturnValue('formatted-date'),
        isValid: jest.fn().mockReturnValue(true)
      };
      
      mockMoment.mockReturnValue(mockMomentInstance as any);
      
      const result = parseDate(testCase);
      expect(result).toBe('formatted-date');
    });
  });

  test('should handle moment parsing error', () => {
    const input = 'invalid-date';
    mockMoment.mockImplementationOnce((() => {
      throw new Error('Moment parsing failed');
    }) as any);
    
    expect(() => parseDate(input)).toThrow('Invalid date format: invalid-date');
  });
});