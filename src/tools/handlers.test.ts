import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { Reminder, ReminderList } from '../types/index.js';
import { remindersManager } from '../utils/reminders.js';
import { handleListReminders } from './handlers.js';

// Mock the reminders manager with correct return type
const mockGetReminders = jest.fn(async (showCompleted: boolean = false) => ({
  reminders: [] as Reminder[],
  lists: [] as ReminderList[]
}));
remindersManager.getReminders = mockGetReminders as unknown as typeof remindersManager.getReminders;

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
});