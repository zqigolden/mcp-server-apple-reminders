// 使用全局 Jest 函数，避免额外依赖
import type { Reminder, ReminderList } from '../types/index.js';
import { remindersManager } from '../utils/reminders.js';
import { 
  handleListReminders,
  handleUpdateReminder,
  handleDeleteReminder,
  handleMoveReminder 
} from './handlers.js';

// Mock the reminders module to avoid import.meta issues
jest.mock('../utils/reminders.js');

// Define mocks before using them in jest.mock
let mockExecuteAppleScript: jest.MockedFunction<any>;
let mockCreateRemindersScript: jest.MockedFunction<any>;
let mockQuoteAppleScriptString: jest.MockedFunction<any>;
let mockCreateReminder: jest.MockedFunction<any>;
let mockUpdateReminder: jest.MockedFunction<any>;
let mockDeleteReminder: jest.MockedFunction<any>;
let mockMoveReminder: jest.MockedFunction<any>;
let mockFindReminders: jest.MockedFunction<any>;
let mockFindAllLists: jest.MockedFunction<any>;
let mockEnsurePermissions: jest.MockedFunction<any>;
let mockGenerateDateProperty: jest.MockedFunction<any>;
let mockParseDateWithType: jest.MockedFunction<any>;
let mockParseDate: jest.MockedFunction<any>;

// Initialize mocks
const initializeMocks = () => {
  mockExecuteAppleScript = jest.fn();
  mockCreateRemindersScript = jest.fn((script: string) => script);
  mockQuoteAppleScriptString = jest.fn((str: string) => `"${str.replace(/"/g, '\\"')}"`);
  mockCreateReminder = jest.fn();
  mockUpdateReminder = jest.fn();
  mockDeleteReminder = jest.fn();
  mockMoveReminder = jest.fn();
  mockFindReminders = jest.fn();
  mockFindAllLists = jest.fn();
  mockEnsurePermissions = jest.fn();
  mockGenerateDateProperty = jest.fn();
  mockParseDateWithType = jest.fn();
  mockParseDate = jest.fn();
};

// Mock the applescript module to test handlers without actual AppleScript execution
jest.mock('../utils/applescript.js', () => ({
  executeAppleScript: jest.fn(),
  createRemindersScript: jest.fn(),
  quoteAppleScriptString: jest.fn()
}));

// Mock the new repository module
jest.mock('../utils/reminderRepository.js', () => ({
  reminderRepository: {
    createReminder: jest.fn(),
    updateReminder: jest.fn(),
    deleteReminder: jest.fn(),
    moveReminder: jest.fn(),
    findReminders: jest.fn(),
    findAllLists: jest.fn(),
    createReminderList: jest.fn(),
    listExists: jest.fn()
  }
}));

// Mock organization strategies
jest.mock('../utils/organizationStrategies.js', () => ({
  ReminderOrganizer: {
    organizeReminders: jest.fn(() => ({ 'Test Category': [] })),
    categorizeByCategory: jest.fn(() => 'Test Category')
  }
}));

// Mock permissions module
jest.mock('../utils/permissions.js', () => ({
  ensurePermissions: jest.fn()
}));

// Mock date utilities
jest.mock('../utils/date.js', () => ({
  parseDate: mockParseDate,
  generateDateProperty: mockGenerateDateProperty,
  parseDateWithType: mockParseDateWithType
}));

// Mock error handling
jest.mock('../utils/errorHandling.js', () => ({
  ErrorResponseFactory: {
    createError: jest.fn((error) => ({
      content: [{ type: 'text', text: JSON.stringify({ error: error.message, isError: true }) }],
      isError: true
    })),
    createSuccessResponse: jest.fn((message) => ({
      content: [{ type: 'text', text: message }],
      isError: false
    }))
  },
  handleAsyncOperation: jest.fn(async (operation) => {
    try {
      const result = await operation();
      return {
        content: [{ type: 'text', text: result }],
        isError: false
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed: System error occurred` }],
        isError: true
      };
    }
  }),
  handleJsonAsyncOperation: jest.fn(async (operation) => {
    try {
      const result = await operation();
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        isError: false
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `Failed: System error occurred`, isError: true }, null, 2) }],
        isError: true
      };
    }
  })
}));

// Initialize mocks before tests run
beforeAll(() => {
  initializeMocks();
});

// Setup repository mocks to return successful results by default
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Setup successful repository responses
  (reminderRepository.createReminder as jest.MockedFunction<any>).mockImplementation(async (data: any) => {
    // Simulate the AppleScript execution by calling the expected mocks
    (quoteAppleScriptString as jest.MockedFunction<any>)(data.title);
    if (data.list) (quoteAppleScriptString as jest.MockedFunction<any>)(data.list);
    if (data.note) (quoteAppleScriptString as jest.MockedFunction<any>)(data.note);
    if (data.url) (quoteAppleScriptString as jest.MockedFunction<any>)(data.url);
    (executeAppleScript as jest.MockedFunction<any>)('mock script');
    return undefined;
  });
  (reminderRepository.updateReminder as jest.MockedFunction<any>).mockResolvedValue(undefined);
  (reminderRepository.deleteReminder as jest.MockedFunction<any>).mockResolvedValue(undefined);
  (reminderRepository.moveReminder as jest.MockedFunction<any>).mockResolvedValue(undefined);
  (reminderRepository.findReminders as jest.MockedFunction<any>).mockResolvedValue([]);
  (reminderRepository.findAllLists as jest.MockedFunction<any>).mockResolvedValue([]);

  // Setup successful permission check
  (ensurePermissions as jest.MockedFunction<any>).mockResolvedValue(undefined);

  // Setup date mocks
  (parseDate as jest.MockedFunction<any>).mockImplementation((dateStr: string) => `${dateStr} parsed`);
  (generateDateProperty as jest.MockedFunction<any>).mockReturnValue(':due date(date "string")');
  (parseDateWithType as jest.MockedFunction<any>).mockReturnValue('parsed date');
});

// Mock constants
jest.mock('../utils/constants.js', () => ({
  MESSAGES: {
    SUCCESS: {
      REMINDER_CREATED: (title: string, hasNotes: boolean) => `Successfully created reminder: ${title}${hasNotes ? ' with notes' : ''}`,
      REMINDER_UPDATED: (title: string) => `Successfully updated reminder "${title}"`,
      REMINDER_DELETED: (title: string) => `Successfully deleted reminder: ${title}`,
      REMINDER_MOVED: (title: string, from: string, to: string) => `Successfully moved reminder "${title}" from ${from} to ${to}`,
      LIST_CREATED: (name: string) => `Successfully created reminder list: ${name}`
    },
    ERROR: {
      INPUT_VALIDATION_FAILED: (details: string) => `Input validation failed: ${details}`,
      SYSTEM_ERROR: (operation: string) => `Failed to ${operation}: System error occurred`
    }
  },
  JSON_FORMATTING: {
    INDENT_SPACES: 2
  }
}));

// Mock date filtering utilities
jest.mock('../utils/dateFiltering.js', () => ({
  applyReminderFilters: jest.fn((reminders, filters) => reminders)
}));

// Mock the date parser
jest.mock('../utils/date.js', () => ({
  parseDate: jest.fn((dateStr: string) => `${dateStr} parsed`),
  isDateOnlyFormat: jest.fn((dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())),
  parseDateWithType: jest.fn((dateStr: string) => ({
    formatted: `${dateStr} parsed`,
    isDateOnly: /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())
  })),
  generateDateProperty: jest.fn((dateStr: string, quoteFn: Function) => {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
    const dateType = isDateOnly ? 'allday due date' : 'due date';
    return `, ${dateType}:date ${quoteFn(`${dateStr} parsed`)}`;
  })
}));

// Mock the logger to suppress debug output in tests
jest.mock('../utils/logger.js', () => ({
  debugLog: jest.fn(),
  logError: jest.fn(),
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the reminders manager with correct return type
const mockGetReminders = jest.fn(async (showCompleted: boolean = false) => ({
  reminders: [] as Reminder[],
  lists: [] as ReminderList[]
}));
remindersManager.getReminders = mockGetReminders as unknown as typeof remindersManager.getReminders;

// Import the mocked functions after mocks are set up
import { executeAppleScript, createRemindersScript, quoteAppleScriptString } from '../utils/applescript.js';
import { parseDate, parseDateWithType, generateDateProperty } from '../utils/date.js';
import { reminderRepository } from '../utils/reminderRepository.js';
import { ensurePermissions } from '../utils/permissions.js';
import { handleCreateReminder } from './handlers.js';

// Use the mocks defined earlier

describe('handleListReminders', () => {
  beforeEach(() => {
    mockGetReminders.mockClear();
  });

  // Helper function to validate JSON response format
  const validateJsonResponse = (result: any) => {
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    // Verify it's valid JSON
    expect(() => JSON.parse(result.content[0].text)).not.toThrow();
  };

  test('should return valid JSON when listing reminders', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Test Reminder 1',
        list: 'Default',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
    // Verify JSON structure
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    // Verify JSON schema
    expect(parsedJson).toEqual(expect.objectContaining({
      reminders: expect.any(Array),
      total: expect.any(Number),
      filter: expect.objectContaining({
        list: expect.any(String),
        showCompleted: expect.any(Boolean)
      })
    }));
  });

  test('should use default list "Reminders" when only action is provided', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Default List Task',
        list: 'Reminders',
        isCompleted: false
      },
      {
        title: 'Other List Task',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0]).toEqual({
      title: 'Default List Task',
      list: 'Reminders',
      isCompleted: false,
      dueDate: null,
      notes: null,
    });
    expect(parsedJson.filter.list).toBe('Reminders');
    expect(parsedJson.filter.showCompleted).toBe(false);
  });

  test('should intelligently choose first available list when "Reminders" not found', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Work Task',
        list: 'Work',
        isCompleted: false
      },
      {
        title: 'Personal Task',
        list: 'Personal',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].list).toBe('Work'); // First available list
    expect(parsedJson.filter.list).toBe('Work');
  });

  test('should use Chinese default list name when available', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Chinese Task',
        list: '提醒事项',
        isCompleted: false
      },
      {
        title: 'Other Task',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({});
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].list).toBe('提醒事项');
    expect(parsedJson.filter.list).toBe('提醒事项');
  });

  test('should return valid JSON with filtered reminders', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Test Reminder 1',
        list: 'Default',
        isCompleted: false
      },
      {
        title: 'Test Reminder 2',
        list: 'Work',
        isCompleted: true
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ showCompleted: false });
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0]).toEqual({
      title: 'Test Reminder 1',
      list: 'Default',
      isCompleted: false,
      dueDate: null,
      notes: null
    });
  });

  test('should return valid JSON with error when operation fails', async () => {
    mockGetReminders.mockRejectedValue(new Error('Test error'));

    const result = await handleListReminders({});
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson).toEqual(expect.objectContaining({
      error: expect.any(String),
      isError: true
    }));
  });

  test('should return valid JSON with all reminder fields', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Complete Task',
        list: 'Work',
        isCompleted: true,
        dueDate: '2024-03-12 10:00:00',
        notes: 'Test notes'
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ showCompleted: true });
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders[0]).toEqual({
      title: 'Complete Task',
      list: 'Work',
      isCompleted: true,
      dueDate: '2024-03-12 10:00:00',
      notes: 'Test notes'
    });
  });

  test('should return valid JSON with list filtering', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Work Task',
        list: 'Work',
        isCompleted: false
      },
      {
        title: 'Personal Task',
        list: 'Personal',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ list: 'Work' });
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.filter.list).toBe('Work');
    expect(parsedJson.reminders[0].title).toBe('Work Task');
  });

  test('should filter reminders by search term', async () => {
    const mockReminders: Reminder[] = [
      {
        title: 'Meeting with client',
        list: 'Work',
        isCompleted: false,
        notes: 'Discuss project timeline'
      },
      {
        title: 'Buy groceries',
        list: 'Personal',
        isCompleted: false,
        notes: 'Get milk and eggs'
      },
      {
        title: 'Team meeting',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ search: 'meeting' });
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(2);
    expect(parsedJson.filter.search).toBe('meeting');
  });

  test('should filter reminders by due date', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mockReminders: Reminder[] = [
      {
        title: 'Due Today',
        list: 'Work',
        isCompleted: false,
        dueDate: today.toISOString()
      },
      {
        title: 'Due Tomorrow',
        list: 'Work',
        isCompleted: false,
        dueDate: tomorrow.toISOString()
      },
      {
        title: 'Overdue',
        list: 'Work',
        isCompleted: false,
        dueDate: yesterday.toISOString()
      },
      {
        title: 'No Due Date',
        list: 'Work',
        isCompleted: false
      }
    ];

    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    const result = await handleListReminders({ dueWithin: 'today' });
    
    validateJsonResponse(result);
    const parsedJson = JSON.parse(result.content[0].text as string);
    
    expect(parsedJson.reminders).toHaveLength(1);
    expect(parsedJson.reminders[0].title).toBe('Due Today');
    expect(parsedJson.filter.dueWithin).toBe('today');
  });
});

describe('handleCreateReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (executeAppleScript as jest.MockedFunction<any>).mockReturnValue('');
    mockCreateRemindersScript.mockImplementation((script: string) => script);
    (quoteAppleScriptString as jest.MockedFunction<any>).mockImplementation((str: string) => `"${str.replace(/"/g, '\\"')}"`);
    mockParseDate.mockImplementation((dateStr: string) => `${dateStr} parsed`);
  });

  test('should create reminder with title only', async () => {
    const args = { title: 'Test Reminder' };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Test Reminder');
    expect(executeAppleScript).toHaveBeenCalled();
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Test Reminder');
  });

  test('should create reminder with title and due date', async () => {
    const args = { 
      title: 'Meeting Tomorrow', 
      dueDate: '2024-03-15 10:00:00' 
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Meeting Tomorrow');
    expect(generateDateProperty).toHaveBeenCalledWith('2024-03-15 10:00:00', expect.any(Function));
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should create reminder with title, note, and list', async () => {
    const args = { 
      title: 'Buy Groceries', 
      note: 'Milk, eggs, bread',
      list: 'Shopping'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Buy Groceries with notes');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Buy Groceries');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Milk, eggs, bread');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Shopping');
  });

  test('should create reminder with URL attachment', async () => {
    const args = { 
      title: 'Review Document', 
      url: 'https://example.com/document'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Review Document with notes');
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should create reminder with note and URL combined', async () => {
    const args = { 
      title: 'Check Website', 
      note: 'Important update',
      url: 'https://example.com'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Check Website with notes');
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should handle AppleScript execution error', async () => {
    const args = { title: 'Test Reminder' };
    (executeAppleScript as jest.MockedFunction<any>).mockImplementation(() => {
      throw new Error('AppleScript failed');
    });

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to create reminder: System error occurred');
  });

  test('should handle special characters in title safely', async () => {
    const args = { title: 'Test "quotes" and \'apostrophes\'' };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Test "quotes" and \'apostrophes\'');
  });

  test('should create reminder with date-only format using allday due date', async () => {
    const args = { 
      title: 'Important Meeting', 
      dueDate: '2024-12-25'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Important Meeting');
    expect(generateDateProperty).toHaveBeenCalledWith('2024-12-25', expect.any(Function));
    
    // Verify the generated script contains allday due date for date-only format
    const generatedScript = mockCreateRemindersScript.mock.calls[0][0];
    expect(generatedScript).toContain('allday due date');
    expect(generatedScript).not.toContain(', due date');
  });

  test('should create reminder with datetime format using regular due date', async () => {
    const args = { 
      title: 'Appointment', 
      dueDate: '2024-12-25 14:30:00'
    };

    const result = await handleCreateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully created reminder: Appointment');
    expect(generateDateProperty).toHaveBeenCalledWith('2024-12-25 14:30:00', expect.any(Function));
    
    // Verify the generated script contains regular due date for datetime format
    const generatedScript = mockCreateRemindersScript.mock.calls[0][0];
    expect(generatedScript).toContain(', due date');
    expect(generatedScript).not.toContain('allday due date');
  });
});

describe('handleUpdateReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (executeAppleScript as jest.MockedFunction<any>).mockReturnValue('');
  });

  test('should update reminder title', async () => {
    const args = { 
      title: 'Old Title',
      newTitle: 'New Title'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Old Title": title to "New Title"');
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should update reminder due date', async () => {
    const args = { 
      title: 'Meeting',
      dueDate: '2024-03-20 14:00:00'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Meeting": due date');
    expect(parseDateWithType).toHaveBeenCalledWith('2024-03-20 14:00:00');
  });

  test('should update reminder completion status', async () => {
    const args = { 
      title: 'Task',
      completed: true
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Task": completed to true');
  });

  test('should update reminder with list specification', async () => {
    const args = { 
      title: 'Work Task',
      list: 'Work',
      note: 'Updated note'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Work Task": notes');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Work');
  });

  test('should handle update error when reminder not found', async () => {
    const args = { title: 'Nonexistent' };
    (executeAppleScript as jest.MockedFunction<any>).mockImplementation(() => {
      throw new Error('Reminder not found: Nonexistent');
    });

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to update reminder: System error occurred');
  });

  test('should update reminder with URL', async () => {
    const args = { 
      title: 'Research Task',
      url: 'https://research.example.com'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Research Task": notes');
  });

  test('should update reminder with empty note and URL without leading newlines', async () => {
    const args = { 
      title: 'Test Task',
      note: '',  // Empty string
      url: 'https://example.com'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Test Task": notes');
    
    // Verify that mockExecuteAppleScript was called with the correct script
    expect(executeAppleScript).toHaveBeenCalled();
    const calledScript = (executeAppleScript as jest.MockedFunction<any>).mock.calls[0][0];
    
    // The script should contain "URL: https://example.com" without leading newlines
    expect(calledScript).toContain('"URL: https://example.com"');
    expect(calledScript).not.toContain('"\n\nURL: https://example.com"');
  });

  test('should update reminder with date-only format using allday due date', async () => {
    const args = { 
      title: 'Existing Task', 
      dueDate: '2024-12-25'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Existing Task": due date');
    expect(parseDateWithType).toHaveBeenCalledWith('2024-12-25');
    
    // Verify the generated script contains allday due date for date-only format
    const generatedScript = (executeAppleScript as jest.MockedFunction<any>).mock.calls[0][0];
    expect(generatedScript).toContain('set allday due date');
    expect(generatedScript).not.toContain('set due date');
  });

  test('should update reminder with datetime format using regular due date', async () => {
    const args = { 
      title: 'Scheduled Task', 
      dueDate: '2024-12-25 14:30:00'
    };

    const result = await handleUpdateReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Successfully updated reminder "Scheduled Task": due date');
    expect(parseDateWithType).toHaveBeenCalledWith('2024-12-25 14:30:00');
    
    // Verify the generated script contains regular due date for datetime format
    const generatedScript = (executeAppleScript as jest.MockedFunction<any>).mock.calls[0][0];
    expect(generatedScript).toContain('set due date');
    expect(generatedScript).not.toContain('set allday due date');
  });
});

describe('handleDeleteReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (executeAppleScript as jest.MockedFunction<any>).mockReturnValue('');
  });

  test('should delete reminder by title', async () => {
    const args = { title: 'Delete Me' };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Successfully deleted reminder: Delete Me');
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should delete reminder from specific list', async () => {
    const args = { 
      title: 'Task to Delete',
      list: 'Work'
    };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Successfully deleted reminder: Task to Delete');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Work');
  });

  test('should handle delete error when reminder not found', async () => {
    const args = { title: 'Nonexistent' };
    (executeAppleScript as jest.MockedFunction<any>).mockImplementation(() => {
      throw new Error('Reminder not found: Nonexistent');
    });

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to delete reminder: System error occurred');
  });

  test('should handle special characters in title safely', async () => {
    const args = { title: 'Delete "this" reminder' };

    const result = await handleDeleteReminder(args);

    expect(result.isError).toBe(false);
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Delete "this" reminder');
  });
});

describe('handleMoveReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (executeAppleScript as jest.MockedFunction<any>).mockReturnValue('');
  });

  test('should move reminder between lists', async () => {
    const args = { 
      title: 'Move Me',
      fromList: 'Personal',
      toList: 'Work'
    };

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toBe('Successfully moved reminder "Move Me" from Personal to Work');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Personal');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('Work');
    expect(executeAppleScript).toHaveBeenCalled();
  });

  test('should handle move error when source list not found', async () => {
    const args = { 
      title: 'Task',
      fromList: 'Nonexistent',
      toList: 'Work'
    };
    (executeAppleScript as jest.MockedFunction<any>).mockImplementation(() => {
      throw new Error('Reminder not found in list Nonexistent: Task');
    });

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to move reminder: System error occurred');
  });

  test('should handle special characters in list names', async () => {
    const args = { 
      title: 'Task',
      fromList: 'List "A"',
      toList: 'List "B"'
    };

    const result = await handleMoveReminder(args);

    expect(result.isError).toBe(false);
    expect(quoteAppleScriptString).toHaveBeenCalledWith('List "A"');
    expect(quoteAppleScriptString).toHaveBeenCalledWith('List "B"');
  });
});