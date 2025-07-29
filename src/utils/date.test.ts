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

describe('Date Parser Tests (12-hour system)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecSync.mockReturnValue(Buffer.from('0'));
    const realMoment = jest.requireActual('moment').default as typeof moment;
    const mockMomentInstance = realMoment();
    Object.defineProperty(mockMomentInstance, 'format', { value: jest.fn().mockReturnValue('March 15, 2024 2:30:00 PM') });
    Object.defineProperty(mockMomentInstance, 'isValid', { value: jest.fn().mockReturnValue(true) });
    Object.defineProperty(mockMomentInstance, 'locale', { value: jest.fn().mockReturnThis() });
    mockMoment.mockReturnValue(mockMomentInstance);
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

  test('should format output to MMMM D, YYYY h:mm:ss A for 12-hour system', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25 18:30:00';
    const realMoment = jest.requireActual('moment').default as typeof moment;
    const mockMomentInstance = realMoment();
    Object.defineProperty(mockMomentInstance, 'format', { value: jest.fn().mockReturnValue('December 25, 2024 6:30:00 PM') });
    Object.defineProperty(mockMomentInstance, 'isValid', { value: jest.fn().mockReturnValue(true) });
    Object.defineProperty(mockMomentInstance, 'locale', { value: jest.fn().mockReturnThis() });
    mockMoment.mockReturnValue(mockMomentInstance);
    mockExecSync.mockReturnValue(Buffer.from('0'));
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY h:mm:ss A');
    expect(result).toBe('December 25, 2024 6:30:00 PM');
  });

  test('should handle invalid date gracefully', async () => {
    const { parseDate } = await import('./date.js');
    const input = 'invalid-date';
    const realMoment = jest.requireActual('moment').default as typeof moment;
    const mockMomentInstance = realMoment();
    Object.defineProperty(mockMomentInstance, 'format', { value: jest.fn() });
    Object.defineProperty(mockMomentInstance, 'isValid', { value: jest.fn().mockReturnValue(false) });
    Object.defineProperty(mockMomentInstance, 'locale', { value: jest.fn().mockReturnThis() });
    mockMoment.mockReturnValue(mockMomentInstance);
    expect(() => parseDate(input)).toThrow('Invalid date format: invalid-date');
    expect(mockMomentInstance.format).not.toHaveBeenCalled();
  });

  test('should handle empty string input', async () => {
    const { parseDate } = await import('./date.js');
    const input = '';
    const realMoment = jest.requireActual('moment').default as typeof moment;
    const mockMomentInstance = realMoment();
    Object.defineProperty(mockMomentInstance, 'format', { value: jest.fn() });
    Object.defineProperty(mockMomentInstance, 'isValid', { value: jest.fn().mockReturnValue(false) });
    Object.defineProperty(mockMomentInstance, 'locale', { value: jest.fn().mockReturnThis() });
    mockMoment.mockReturnValue(mockMomentInstance);
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

  test('should handle date parsing with system settings', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15 10:00:00';
    const result = parseDate(input);
    expect(result).toBe('March 15, 2024 2:30:00 PM');
  });

  test('should handle system command failure gracefully', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15 10:00:00';
    mockExecSync.mockImplementation(() => { throw new Error('Command failed'); });
    const realMoment = jest.requireActual('moment').default as typeof moment;
    const mockMomentInstance = realMoment();
    Object.defineProperty(mockMomentInstance, 'format', { value: jest.fn().mockReturnValue('March 15, 2024 10:00:00 AM') });
    Object.defineProperty(mockMomentInstance, 'isValid', { value: jest.fn().mockReturnValue(true) });
    Object.defineProperty(mockMomentInstance, 'locale', { value: jest.fn().mockReturnThis() });
    mockMoment.mockReturnValue(mockMomentInstance);
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
      const realMoment = jest.requireActual('moment').default as typeof moment;
      const mockMomentInstance = realMoment();
      Object.defineProperty(mockMomentInstance, 'format', { value: jest.fn().mockReturnValue(output) });
      Object.defineProperty(mockMomentInstance, 'isValid', { value: jest.fn().mockReturnValue(true) });
      Object.defineProperty(mockMomentInstance, 'locale', { value: jest.fn().mockReturnThis() });
      mockMoment.mockReturnValue(mockMomentInstance);
      const result = parseDate(input);
      expect(result).toBe(output);
    });
  });

  test('should handle moment parsing error', async () => {
    const { parseDate } = await import('./date.js');
    const input = 'invalid-date';
    mockMoment.mockImplementationOnce(() => { throw new Error('Moment parsing failed'); });
    expect(() => parseDate(input)).toThrow('Invalid date format: invalid-date');
  });
});

describe('Date Parser Tests (24-hour system)', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  test('should use 24-hour format when system prefers it', async () => {
    jest.resetModules();
    const moment = require('moment');
    const { execSync } = require('child_process');
    execSync.mockReturnValue(Buffer.from('1'));
    const realMoment = jest.requireActual('moment').default as typeof moment;
    const mockMomentInstance = realMoment();
    Object.defineProperty(mockMomentInstance, 'format', { value: jest.fn().mockReturnValue('December 25, 2024 18:30:00') });
    Object.defineProperty(mockMomentInstance, 'isValid', { value: jest.fn().mockReturnValue(true) });
    Object.defineProperty(mockMomentInstance, 'locale', { value: jest.fn().mockReturnThis() });
    (moment as jest.MockedFunction<typeof moment>).mockReturnValue(mockMomentInstance);
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25 18:30:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY HH:mm:ss');
    expect(result).toBe('December 25, 2024 18:30:00');
  });
});