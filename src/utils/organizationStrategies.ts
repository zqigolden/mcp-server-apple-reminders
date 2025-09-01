/**
 * organizationStrategies.ts
 * Simplified reminder organization utilities
 */

import type { Reminder } from '../types/index.js';
import { categorizeReminderByDueDate } from './dateFiltering.js';

/**
 * Simple categorization functions for reminders
 */
export const ReminderOrganizer = {
  categorizeByPriority(reminder: Reminder): string {
    const text = `${reminder.title} ${reminder.notes || ''}`.toLowerCase();
    const highKeywords = ['urgent', 'important', 'critical', 'asap'];
    const lowKeywords = ['later', 'someday', 'eventually', 'maybe'];

    if (highKeywords.some((k) => text.includes(k))) return 'High Priority';
    if (lowKeywords.some((k) => text.includes(k))) return 'Low Priority';
    return 'Medium Priority';
  },

  categorizeByDueDate(reminder: Reminder): string {
    return categorizeReminderByDueDate(reminder);
  },

  categorizeByCompletion(reminder: Reminder): string {
    return reminder.isCompleted ? 'Completed' : 'Active';
  },

  categorizeByCategory(reminder: Reminder): string {
    const text = `${reminder.title} ${reminder.notes || ''}`.toLowerCase();
    const categories = {
      Work: ['work', 'meeting', 'project', 'office', 'client', 'business'],
      Personal: ['personal', 'home', 'family', 'friend', 'self'],
      Shopping: ['shopping', 'buy', 'store', 'purchase', 'groceries'],
      Health: ['health', 'doctor', 'exercise', 'medical', 'fitness', 'workout'],
      Finance: ['bill', 'payment', 'finance', 'money', 'bank', 'budget'],
      Travel: ['travel', 'trip', 'vacation', 'flight', 'hotel'],
      Education: ['study', 'learn', 'course', 'school', 'book', 'research'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category;
      }
    }

    return 'Uncategorized';
  },

  organizeReminders(
    reminders: Reminder[],
    strategy: string = 'category',
  ): Record<string, Reminder[]> {
    const groups: Record<string, Reminder[]> = {};

    for (const reminder of reminders) {
      let category: string;

      switch (strategy) {
        case 'priority':
          category = ReminderOrganizer.categorizeByPriority(reminder);
          break;
        case 'due_date':
          category = ReminderOrganizer.categorizeByDueDate(reminder);
          break;
        case 'completion_status':
          category = ReminderOrganizer.categorizeByCompletion(reminder);
          break;
        default:
          category = ReminderOrganizer.categorizeByCategory(reminder);
          break;
      }

      if (!groups[category]) groups[category] = [];
      groups[category].push(reminder);
    }

    return groups;
  },
};
