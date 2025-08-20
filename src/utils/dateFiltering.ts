/**
 * dateFiltering.ts
 * Reusable utilities for filtering reminders by date criteria
 */

import type { Reminder } from "../types/index.js";

/**
 * Date range filters for reminders
 */
export type DateFilter = "today" | "tomorrow" | "this-week" | "overdue" | "no-date";

/**
 * Date range boundaries
 */
interface DateBoundaries {
  today: Date;
  tomorrow: Date;
  weekEnd: Date;
}

/**
 * Creates standardized date boundaries for filtering operations
 */
export function createDateBoundaries(): DateBoundaries {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  return { today, tomorrow, weekEnd };
}

/**
 * Filters reminders based on due date criteria
 */
export function filterRemindersByDate(
  reminders: Reminder[], 
  filter: DateFilter
): Reminder[] {
  if (filter === "no-date") {
    return reminders.filter(reminder => !reminder.dueDate);
  }
  
  const { today, tomorrow, weekEnd } = createDateBoundaries();
  
  return reminders.filter(reminder => {
    if (!reminder.dueDate) return false;
    
    const dueDate = new Date(reminder.dueDate);
    
    switch (filter) {
      case "overdue":
        return dueDate < today;
        
      case "today":
        return dueDate >= today && dueDate < tomorrow;
        
      case "tomorrow":
        return dueDate >= tomorrow && dueDate < getNextDay(tomorrow);
        
      case "this-week":
        return dueDate >= today && dueDate <= weekEnd;
        
      default:
        return true;
    }
  });
}

/**
 * Utility to get the next day after a given date
 */
function getNextDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
}

/**
 * Categorizes a reminder based on its due date
 */
export function categorizeReminderByDueDate(reminder: Reminder): string {
  if (!reminder.dueDate) {
    return "No Due Date";
  }
  
  const { today, tomorrow, weekEnd } = createDateBoundaries();
  const dueDate = new Date(reminder.dueDate);
  const diffDays = calculateDaysDifference(dueDate, today);
  
  if (diffDays < 0) {
    return "Overdue";
  }
  
  if (diffDays === 0) {
    return "Due Today";
  }
  
  if (diffDays <= 7) {
    return "Due This Week";
  }
  
  return "Due Later";
}

/**
 * Calculates the difference in days between two dates
 */
function calculateDaysDifference(date1: Date, date2: Date): number {
  const timeDifference = date1.getTime() - date2.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24));
}

/**
 * Filters for reminder search operations
 */
export interface ReminderFilters {
  showCompleted?: boolean;
  search?: string;
  dueWithin?: DateFilter;
  list?: string;
}

/**
 * Applies multiple filters to a list of reminders
 */
export function applyReminderFilters(
  reminders: Reminder[], 
  filters: ReminderFilters
): Reminder[] {
  let filteredReminders = [...reminders];
  
  // Filter by completion status
  if (filters.showCompleted !== undefined) {
    filteredReminders = filteredReminders.filter(reminder => 
      filters.showCompleted || !reminder.isCompleted
    );
  }
  
  // Filter by list
  if (filters.list) {
    filteredReminders = filteredReminders.filter(reminder => 
      reminder.list === filters.list
    );
  }
  
  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredReminders = filteredReminders.filter(reminder => 
      reminder.title.toLowerCase().includes(searchLower) ||
      (reminder.notes && reminder.notes.toLowerCase().includes(searchLower))
    );
  }
  
  // Filter by due date
  if (filters.dueWithin) {
    filteredReminders = filterRemindersByDate(filteredReminders, filters.dueWithin);
  }
  
  return filteredReminders;
}