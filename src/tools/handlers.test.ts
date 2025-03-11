import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Reminder, ReminderList } from '../types';
import { remindersManager } from '../utils/reminders';
import { handleListReminders } from './handlers';

// Mock the reminders manager with correct return type
const mockGetReminders = mock(async (showCompleted: boolean = false) => ({
  reminders: [] as Reminder[],
  lists: [] as ReminderList[]
}));
remindersManager.getReminders = mockGetReminders as unknown as typeof remindersManager.getReminders;

describe('handleListReminders', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockGetReminders.mockClear();
  });

  test('should list all reminders when no list is specified', async () => {
    // Mock data
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

    // Setup mock return value
    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    // Test with showCompleted = false
    const result = await handleListReminders({ showCompleted: false });

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Test Reminder 1');
    expect(result.content[0].text).not.toContain('Test Reminder 2');
    expect(mockGetReminders).toHaveBeenCalledWith(false);
  });

  test('should show completed reminders when showCompleted is true', async () => {
    // Mock data
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

    // Setup mock return value
    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    // Test with showCompleted = true
    const result = await handleListReminders({ showCompleted: true });

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Test Reminder 1');
    expect(result.content[0].text).toContain('Test Reminder 2');
    expect(mockGetReminders).toHaveBeenCalledWith(true);
  });

  test('should filter reminders by list name', async () => {
    // Mock data
    const mockReminders: Reminder[] = [
      {
        title: 'Work Task 1',
        list: 'Work',
        isCompleted: false
      },
      {
        title: 'Personal Task',
        list: 'Personal',
        isCompleted: false
      }
    ];

    // Setup mock return value
    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    // Test with specific list
    const result = await handleListReminders({ list: 'Work' });

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Work Task 1');
    expect(result.content[0].text).not.toContain('Personal Task');
  });

  test('should handle reminders with all fields', async () => {
    // Mock data with all possible fields
    const mockReminders: Reminder[] = [
      {
        title: 'Complete Task',
        list: 'Work',
        isCompleted: true,
        dueDate: '2024-03-12 10:00:00',
        notes: 'Test notes'
      }
    ];

    // Setup mock return value
    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    // Test with showCompleted = true
    const result = await handleListReminders({ showCompleted: true });

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Complete Task');
    expect(result.content[0].text).toContain('2024-03-12 10:00:00');
  });

  test('should handle errors gracefully', async () => {
    // Setup mock to throw error
    mockGetReminders.mockRejectedValue(
      new Error('Failed to fetch reminders')
    );

    // Test error handling
    const result = await handleListReminders({});

    // Verify error handling
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Failed to list reminders');
  });

  test('should handle various isCompleted value types', async () => {
    // Mock data with different isCompleted value types
    const mockReminders: Reminder[] = [
      {
        title: 'Boolean True',
        list: 'Test',
        isCompleted: true
      },
      {
        title: 'Boolean False',
        list: 'Test',
        isCompleted: false
      },
      {
        title: 'String True',
        list: 'Test',
        isCompleted: 'true' as unknown as boolean // Simulating string input
      },
      {
        title: 'String False',
        list: 'Test',
        isCompleted: 'false' as unknown as boolean // Simulating string input
      }
    ];

    // Setup mock return value
    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    // Test with showCompleted = true to see all items
    const result = await handleListReminders({ showCompleted: true });

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('Boolean True ✓');
    expect(result.content[0].text).not.toContain('Boolean False ✓');
    expect(result.content[0].text).toContain('String True ✓');
    expect(result.content[0].text).not.toContain('String False ✓');
  });

  test('should handle edge cases of isCompleted values', async () => {
    // Mock data with edge cases
    const mockReminders: Reminder[] = [
      {
        title: 'Undefined',
        list: 'Test',
        isCompleted: undefined as unknown as boolean
      },
      {
        title: 'Null',
        list: 'Test',
        isCompleted: null as unknown as boolean
      },
      {
        title: 'Number 1',
        list: 'Test',
        isCompleted: 1 as unknown as boolean
      },
      {
        title: 'Number 0',
        list: 'Test',
        isCompleted: 0 as unknown as boolean
      }
    ];

    // Setup mock return value
    mockGetReminders.mockResolvedValue({
      reminders: mockReminders,
      lists: []
    });

    // Test with showCompleted = true
    const result = await handleListReminders({ showCompleted: true });

    // Verify the result
    expect(result.isError).toBe(false);
    expect(result.content[0].text).not.toContain('Undefined ✓');
    expect(result.content[0].text).not.toContain('Null ✓');
    expect(result.content[0].text).not.toContain('Number 0 ✓');
    expect(result.content[0].text).toContain('Number 1');
  });
}); 