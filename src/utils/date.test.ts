// 使用全局 Jest 函数，避免额外依赖

import { spawnSync } from 'node:child_process';
import moment from 'moment';

// Mock dependencies
jest.mock('moment');
jest.mock('node:child_process', () => ({
  spawnSync: jest.fn(),
}));
jest.mock('./logger.js', () => ({
  debugLog: jest.fn(),
}));

const mockMoment = moment as jest.MockedFunction<typeof moment>;
const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;

// Create a mock moment instance type
interface MockMomentInstance {
  format: jest.MockedFunction<(format?: string) => string>;
  isValid: jest.MockedFunction<() => boolean>;
  locale: jest.MockedFunction<(locale: string) => MockMomentInstance>;
  localeData: jest.MockedFunction<
    () => {
      longDateFormat: (token: string) => string;
    }
  >;
  year: jest.MockedFunction<() => number>;
  month: jest.MockedFunction<() => number>;
  date: jest.MockedFunction<() => number>;
  hour: jest.MockedFunction<() => number>;
  minute: jest.MockedFunction<() => number>;
  second: jest.MockedFunction<() => number>;
}

let dateTimeFormatSpy: jest.SpyInstance;

function mockDateTimeFormat(
  resolvedOptions: Partial<Intl.ResolvedDateTimeFormatOptions>,
) {
  dateTimeFormatSpy.mockImplementation(
    () =>
      ({
        resolvedOptions: () => resolvedOptions,
      }) as Intl.DateTimeFormat,
  );
}

beforeAll(() => {
  dateTimeFormatSpy = jest.spyOn(Intl, 'DateTimeFormat');
});

afterEach(() => {
  dateTimeFormatSpy.mockReset();
});

afterAll(() => {
  dateTimeFormatSpy.mockRestore();
});

// Helper to create mock spawnSync result
function createMockSpawnSyncResult(
  stdout: string,
  status = 0,
  stderr = '',
): ReturnType<typeof spawnSync> {
  return {
    stdout,
    stderr,
    status,
    pid: 0,
    output: [],
    signal: null,
  } as unknown as ReturnType<typeof spawnSync>;
}

describe('isDateOnlyFormat utility function', () => {
  test('should identify date-only format correctly', async () => {
    const { isDateOnlyFormat } = await import('./date.js');

    // Valid date-only formats
    expect(isDateOnlyFormat('2024-12-25')).toBe(true);
    expect(isDateOnlyFormat('2023-01-01')).toBe(true);
    expect(isDateOnlyFormat('2025-02-28')).toBe(true);
    expect(isDateOnlyFormat('  2024-12-25  ')).toBe(true); // with whitespace

    // Invalid date-only formats (should return false)
    expect(isDateOnlyFormat('2024-12-25 14:30:00')).toBe(false);
    expect(isDateOnlyFormat('2024-12-25T14:30:00Z')).toBe(false);
    expect(isDateOnlyFormat('2024-12-25T14:30:00-05:00')).toBe(false);
    expect(isDateOnlyFormat('12/25/2024')).toBe(false);
    expect(isDateOnlyFormat('invalid-date')).toBe(false);
    expect(isDateOnlyFormat('')).toBe(false);
    expect(isDateOnlyFormat('2024-12')).toBe(false);
    expect(isDateOnlyFormat('2024-12-25-extra')).toBe(false);
  });
});

describe('Date Parser Tests (12-hour system)', () => {
  let mockMomentInstance: MockMomentInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDateTimeFormat({ locale: 'en-US', hour12: true });

    // Mock spawnSync to return '0' for 12-hour system
    mockSpawnSync.mockReturnValue(createMockSpawnSyncResult('0'));

    const { clearTimePreferenceCache } = await import('./date.js');
    clearTimePreferenceCache();

    // Create mock moment instance
    const localeDataMock = {
      longDateFormat: jest.fn((token: string) =>
        token === 'LL' ? 'MMMM D, YYYY' : 'h:mm:ss A',
      ),
    };
    mockMomentInstance = {
      format: jest.fn().mockReturnValue('15 March 2024 2:30:00 PM'),
      isValid: jest.fn().mockReturnValue(true),
      locale: jest.fn().mockReturnThis(),
      localeData: jest.fn().mockReturnValue(localeDataMock),
      year: jest.fn().mockReturnValue(2024),
      month: jest.fn().mockReturnValue(2),
      date: jest.fn().mockReturnValue(15),
      hour: jest.fn().mockReturnValue(14),
      minute: jest.fn().mockReturnValue(30),
      second: jest.fn().mockReturnValue(0),
    } as MockMomentInstance;

    mockMoment.mockReturnValue(mockMomentInstance);
  });

  test('should parse date-only format without time', async () => {
    mockMomentInstance.format.mockReturnValue('March 15, 2024');
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(
      input,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
    expect(mockMomentInstance.format).toHaveBeenCalledWith('MMMM D, YYYY');
    expect(result).toBe('March 15, 2024');
  });

  test('should parse ISO 8601 date format with time', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15T10:00:00Z';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(
      input,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
    expect(mockMomentInstance.format).toHaveBeenCalledWith(
      'MMMM D, YYYY h:mm:ss A',
    );
    expect(result).toBe('15 March 2024 2:30:00 PM');
  });

  test('should parse YYYY-MM-DD HH:mm:ss format with time', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15 14:30:00';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(
      input,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
    expect(mockMomentInstance.format).toHaveBeenCalledWith(
      'MMMM D, YYYY h:mm:ss A',
    );
    expect(result).toBe('15 March 2024 2:30:00 PM');
  });

  test('should format datetime output with English locale for 12-hour system', async () => {
    mockMomentInstance.format.mockReturnValue('December 25, 2024 6:30:00 PM');
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25 18:30:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en-us');
    expect(mockMomentInstance.format).toHaveBeenCalledWith(
      'MMMM D, YYYY h:mm:ss A',
    );
    expect(result).toBe('December 25, 2024 6:30:00 PM');
  });

  test('should handle invalid date gracefully', async () => {
    mockMomentInstance.isValid.mockReturnValue(false);
    const { parseDate } = await import('./date.js');
    const input = 'invalid-date';
    expect(() => parseDate(input)).toThrow(
      'Invalid or unsupported date format: "invalid-date". ' +
        'Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ' +
        'Example: "2024-12-25 14:30:00"',
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
        'Example: "2024-12-25 14:30:00"',
    );
  });

  test('should use strict parsing', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15';
    parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(
      input,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
  });

  test('should handle timezone information in ISO format', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15T10:00:00-05:00';
    const result = parseDate(input);
    expect(mockMoment).toHaveBeenCalledWith(
      input,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
    expect(result).toBe('15 March 2024 2:30:00 PM');
  });

  test('should handle system command failure gracefully', async () => {
    // Mock spawnSync to simulate command failure and fall back to default
    mockSpawnSync.mockImplementationOnce(() =>
      createMockSpawnSyncResult('', 1, 'Command failed'),
    );
    mockMomentInstance.format.mockReturnValue('March 15, 2024 10:00:00 AM');
    const { parseDate } = await import('./date.js');
    const input = '2024-03-15 10:00:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en-us');
    const formatArg = mockMomentInstance.format.mock.calls[0]?.[0];
    expect([
      'MMMM D, YYYY h:mm:ss A',
      'MMMM D, YYYY HH:mm:ss',
      'D MMMM YYYY HH:mm:ss',
    ]).toContain(formatArg);
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
    mockMoment.mockImplementationOnce(() => {
      throw new Error('Moment parsing failed');
    });
    const { parseDate } = await import('./date.js');
    expect(() => parseDate(input)).toThrow(
      'Invalid or unsupported date format: "invalid-date". ' +
        'Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ' +
        'Example: "2024-12-25 14:30:00"',
    );
  });
});

describe('Date Parser Tests (24-hour system)', () => {
  let mockMomentInstance: MockMomentInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDateTimeFormat({ locale: 'en-GB', hour12: false });

    // Mock spawnSync to return '1' for 24-hour system
    mockSpawnSync.mockReturnValue(createMockSpawnSyncResult('1'));

    // Clear the time preference cache to ensure fresh state
    const { clearTimePreferenceCache } = await import('./date.js');
    clearTimePreferenceCache();

    // Create mock moment instance for 24-hour system
    const localeDataMock = {
      longDateFormat: jest.fn((token: string) =>
        token === 'LL' ? 'D MMMM YYYY' : 'HH:mm:ss',
      ),
    };
    mockMomentInstance = {
      format: jest.fn().mockReturnValue('25 December 2024 18:30:00'),
      isValid: jest.fn().mockReturnValue(true),
      locale: jest.fn().mockReturnThis(),
      localeData: jest.fn().mockReturnValue(localeDataMock),
      year: jest.fn().mockReturnValue(2024),
      month: jest.fn().mockReturnValue(11),
      date: jest.fn().mockReturnValue(25),
      hour: jest.fn().mockReturnValue(18),
      minute: jest.fn().mockReturnValue(30),
      second: jest.fn().mockReturnValue(0),
    } as MockMomentInstance;

    mockMoment.mockReturnValue(mockMomentInstance);
  });

  test('should use 24-hour format when system prefers it', async () => {
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25 18:30:00';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en-gb');
    expect(mockMomentInstance.format).toHaveBeenCalledWith(
      'D MMMM YYYY HH:mm:ss',
    );
    expect(result).toBe('25 December 2024 18:30:00');
  });

  test('should handle date-only format in 24-hour system', async () => {
    mockMomentInstance.format.mockReturnValue('25 December 2024');
    const { parseDate } = await import('./date.js');
    const input = '2024-12-25';
    const result = parseDate(input);
    expect(mockMomentInstance.locale).toHaveBeenCalledWith('en-gb');
    expect(mockMomentInstance.format).toHaveBeenCalledWith('D MMMM YYYY');
    expect(result).toBe('25 December 2024');
  });
});

describe('New Utility Functions', () => {
  let mockMomentInstance: MockMomentInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDateTimeFormat({ locale: 'en-US', hour12: true });

    // Create mock moment instance
    const localeDataMock = {
      longDateFormat: jest.fn((token: string) =>
        token === 'LL' ? 'MMMM D, YYYY' : 'h:mm:ss A',
      ),
    };
    mockMomentInstance = {
      format: jest.fn().mockReturnValue('December 25, 2024'),
      isValid: jest.fn().mockReturnValue(true),
      locale: jest.fn().mockReturnThis(),
      localeData: jest.fn().mockReturnValue(localeDataMock),
      year: jest.fn().mockReturnValue(2024),
      month: jest.fn().mockReturnValue(11),
      date: jest.fn().mockReturnValue(25),
      hour: jest.fn().mockReturnValue(0),
      minute: jest.fn().mockReturnValue(0),
      second: jest.fn().mockReturnValue(0),
    } as MockMomentInstance;

    mockMoment.mockReturnValue(mockMomentInstance);
  });

  test('parseDateWithType should return both formatted date and type', async () => {
    const { parseDateWithType } = await import('./date.js');

    // Test date-only format
    const dateOnlyResult = parseDateWithType('2024-12-25');
    expect(dateOnlyResult.isDateOnly).toBe(true);
    expect(dateOnlyResult.formatted).toBe('December 25, 2024');

    // Test datetime format
    mockMomentInstance.format.mockReturnValue('December 25, 2024 2:30:00 PM');
    const datetimeResult = parseDateWithType('2024-12-25 14:30:00');
    expect(datetimeResult.isDateOnly).toBe(false);
    expect(datetimeResult.formatted).toBe('December 25, 2024 2:30:00 PM');
  });

  test('generateDateProperty should produce AppleScript date components', async () => {
    const { generateDateProperty } = await import('./date.js');

    // Date-only case
    mockMomentInstance.year.mockReturnValue(2024);
    mockMomentInstance.month.mockReturnValue(11);
    mockMomentInstance.date.mockReturnValue(25);
    mockMomentInstance.hour.mockReturnValue(0);
    mockMomentInstance.minute.mockReturnValue(0);
    mockMomentInstance.second.mockReturnValue(0);

    const dateOnlyValue = generateDateProperty('2024-12-25', 'dueDateValue');
    expect(dateOnlyValue.isDateOnly).toBe(true);
    expect(dateOnlyValue.variableName).toBe('dueDateValue');
    expect(dateOnlyValue.prelude).toEqual([
      'set dueDateValue to current date',
      'set year of dueDateValue to 2024',
      'set month of dueDateValue to December',
      'set day of dueDateValue to 25',
      'set time of dueDateValue to 0',
    ]);

    // Datetime case
    mockMomentInstance.year.mockReturnValue(2024);
    mockMomentInstance.month.mockReturnValue(11);
    mockMomentInstance.date.mockReturnValue(25);
    mockMomentInstance.hour.mockReturnValue(14);
    mockMomentInstance.minute.mockReturnValue(30);
    mockMomentInstance.second.mockReturnValue(15);

    const datetimeValue = generateDateProperty(
      '2024-12-25 14:30:15',
      'updatedDueDateValue',
    );
    expect(datetimeValue.isDateOnly).toBe(false);
    expect(datetimeValue.variableName).toBe('updatedDueDateValue');
    expect(datetimeValue.prelude).toEqual([
      'set updatedDueDateValue to current date',
      'set year of updatedDueDateValue to 2024',
      'set month of updatedDueDateValue to December',
      'set day of updatedDueDateValue to 25',
      'set time of updatedDueDateValue to 52215',
    ]);
  });
});
