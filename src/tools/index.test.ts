import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { handleToolCall, TOOLS } from './index.js';
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Mock all handler functions
jest.mock('./handlers.js', () => ({
  handleCreateReminder: jest.fn(),
  handleListReminderLists: jest.fn(),
  handleListReminders: jest.fn(),
  handleUpdateReminder: jest.fn(),
  handleDeleteReminder: jest.fn(),
  handleMoveReminder: jest.fn()
}));

jest.mock('./definitions.js', () => ({
  TOOLS: [
    { name: 'create_reminder', description: 'Create reminder' },
    { name: 'list_reminders', description: 'List reminders' },
    { name: 'list_reminder_lists', description: 'List reminder lists' },
    { name: 'update_reminder', description: 'Update reminder' },
    { name: 'delete_reminder', description: 'Delete reminder' },
    { name: 'move_reminder', description: 'Move reminder' }
  ]
}));

jest.mock('../utils/logger.js');

import {
  handleCreateReminder,
  handleListReminderLists,
  handleListReminders,
  handleUpdateReminder,
  handleDeleteReminder,
  handleMoveReminder
} from './handlers.js';

const mockHandleCreateReminder = handleCreateReminder as jest.MockedFunction<typeof handleCreateReminder>;
const mockHandleListReminderLists = handleListReminderLists as jest.MockedFunction<typeof handleListReminderLists>;
const mockHandleListReminders = handleListReminders as jest.MockedFunction<typeof handleListReminders>;
const mockHandleUpdateReminder = handleUpdateReminder as jest.MockedFunction<typeof handleUpdateReminder>;
const mockHandleDeleteReminder = handleDeleteReminder as jest.MockedFunction<typeof handleDeleteReminder>;
const mockHandleMoveReminder = handleMoveReminder as jest.MockedFunction<typeof handleMoveReminder>;

describe('Tools Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleToolCall', () => {
    test('should route create_reminder to handleCreateReminder', async () => {
      const args = { title: 'Test reminder' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Success' }],
        isError: false
      };

      mockHandleCreateReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('create_reminder', args);

      expect(mockHandleCreateReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route list_reminders to handleListReminders', async () => {
      const args = { list: 'Work' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Reminders list' }],
        isError: false
      };

      mockHandleListReminders.mockResolvedValue(expectedResult);

      const result = await handleToolCall('list_reminders', args);

      expect(mockHandleListReminders).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route list_reminder_lists to handleListReminderLists', async () => {
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Lists' }],
        isError: false
      };

      mockHandleListReminderLists.mockResolvedValue(expectedResult);

      const result = await handleToolCall('list_reminder_lists', {});

      expect(mockHandleListReminderLists).toHaveBeenCalledWith();
      expect(result).toEqual(expectedResult);
    });

    test('should route update_reminder to handleUpdateReminder', async () => {
      const args = { title: 'Old title', newTitle: 'New title' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Updated' }],
        isError: false
      };

      mockHandleUpdateReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('update_reminder', args);

      expect(mockHandleUpdateReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route delete_reminder to handleDeleteReminder', async () => {
      const args = { title: 'Delete me' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Deleted' }],
        isError: false
      };

      mockHandleDeleteReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('delete_reminder', args);

      expect(mockHandleDeleteReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should route move_reminder to handleMoveReminder', async () => {
      const args = { title: 'Move me', fromList: 'A', toList: 'B' };
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Moved' }],
        isError: false
      };

      mockHandleMoveReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('move_reminder', args);

      expect(mockHandleMoveReminder).toHaveBeenCalledWith(args);
      expect(result).toEqual(expectedResult);
    });

    test('should return error for unknown tool', async () => {
      const result = await handleToolCall('unknown_tool', {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown tool: unknown_tool'
          }
        ],
        isError: true
      });

      // Verify no handlers were called
      expect(mockHandleCreateReminder).not.toHaveBeenCalled();
      expect(mockHandleListReminders).not.toHaveBeenCalled();
      expect(mockHandleListReminderLists).not.toHaveBeenCalled();
      expect(mockHandleUpdateReminder).not.toHaveBeenCalled();
      expect(mockHandleDeleteReminder).not.toHaveBeenCalled();
      expect(mockHandleMoveReminder).not.toHaveBeenCalled();
    });

    test('should handle empty tool name', async () => {
      const result = await handleToolCall('', {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Unknown tool: '
          }
        ],
        isError: true
      });
    });

    test('should handle null/undefined args', async () => {
      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Success' }],
        isError: false
      };

      mockHandleCreateReminder.mockResolvedValue(expectedResult);

      // Test with null args
      await handleToolCall('create_reminder', null);
      expect(mockHandleCreateReminder).toHaveBeenCalledWith(null);

      // Test with undefined args
      await handleToolCall('create_reminder', undefined);
      expect(mockHandleCreateReminder).toHaveBeenCalledWith(undefined);
    });

    test('should propagate handler errors', async () => {
      const error = new Error('Handler failed');
      mockHandleCreateReminder.mockRejectedValue(error);

      await expect(handleToolCall('create_reminder', {})).rejects.toThrow('Handler failed');
    });

    test('should handle handlers returning different result types', async () => {
      const testCases = [
        {
          tool: 'create_reminder',
          handler: mockHandleCreateReminder,
          result: { content: [{ type: 'text' as const, text: 'Created' }], isError: false }
        },
        {
          tool: 'list_reminders',
          handler: mockHandleListReminders,
          result: { content: [{ type: 'text' as const, text: JSON.stringify({ reminders: [] }) }], isError: false }
        },
        {
          tool: 'update_reminder',
          handler: mockHandleUpdateReminder,
          result: { content: [{ type: 'text' as const, text: 'Updated successfully' }], isError: false }
        }
      ];

      for (const testCase of testCases) {
        testCase.handler.mockResolvedValue(testCase.result);
        
        const result = await handleToolCall(testCase.tool, {});
        
        expect(result).toEqual(testCase.result);
        expect(testCase.handler).toHaveBeenCalled();
        
        testCase.handler.mockClear();
      }
    });

    test('should handle complex arguments', async () => {
      const complexArgs = {
        title: 'Complex reminder',
        dueDate: '2024-12-25 18:00:00',
        list: 'Work Tasks',
        note: 'This is a complex note with\nmultiple lines\nand special chars: !@#$%',
        url: 'https://example.com/task',
        metadata: {
          priority: 'high',
          tags: ['urgent', 'client'],
          nested: { deep: 'value' }
        }
      };

      const expectedResult: CallToolResult = {
        content: [{ type: 'text', text: 'Complex reminder created' }],
        isError: false
      };

      mockHandleCreateReminder.mockResolvedValue(expectedResult);

      const result = await handleToolCall('create_reminder', complexArgs);

      expect(mockHandleCreateReminder).toHaveBeenCalledWith(complexArgs);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('TOOLS export', () => {
    test('should export TOOLS array', () => {
      expect(TOOLS).toBeDefined();
      expect(Array.isArray(TOOLS)).toBe(true);
      expect(TOOLS.length).toBeGreaterThan(0);
    });

    test('should contain expected tool definitions', () => {
      const toolNames = TOOLS.map(tool => tool.name);
      
      expect(toolNames).toContain('create_reminder');
      expect(toolNames).toContain('list_reminders');
      expect(toolNames).toContain('list_reminder_lists');
      expect(toolNames).toContain('update_reminder');
      expect(toolNames).toContain('delete_reminder');
      expect(toolNames).toContain('move_reminder');
    });
  });
});