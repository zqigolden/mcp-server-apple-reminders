/**
 * organizationStrategies.ts
 * Strategy pattern implementation for different reminder organization approaches
 */

import type { Reminder } from "../types/index.js";
import { categorizeReminderByDueDate } from "./dateFiltering.js";

/**
 * Interface for organization strategies
 */
export interface OrganizationStrategy {
  categorizeReminder(reminder: Reminder): string;
  getStrategyName(): string;
}

/**
 * Strategy for organizing reminders by priority keywords
 */
export class PriorityOrganizationStrategy implements OrganizationStrategy {
  categorizeReminder(reminder: Reminder): string {
    const text = `${reminder.title} ${reminder.notes || ""}`.toLowerCase();
    
    if (this.containsHighPriorityKeywords(text)) {
      return "High Priority";
    }
    
    if (this.containsLowPriorityKeywords(text)) {
      return "Low Priority";
    }
    
    return "Medium Priority";
  }
  
  getStrategyName(): string {
    return "priority";
  }
  
  private containsHighPriorityKeywords(text: string): boolean {
    const highPriorityKeywords = ["urgent", "important", "critical", "asap"];
    return highPriorityKeywords.some(keyword => text.includes(keyword));
  }
  
  private containsLowPriorityKeywords(text: string): boolean {
    const lowPriorityKeywords = ["later", "someday", "eventually", "maybe"];
    return lowPriorityKeywords.some(keyword => text.includes(keyword));
  }
}

/**
 * Strategy for organizing reminders by due date
 */
export class DueDateOrganizationStrategy implements OrganizationStrategy {
  categorizeReminder(reminder: Reminder): string {
    return categorizeReminderByDueDate(reminder);
  }
  
  getStrategyName(): string {
    return "due_date";
  }
}

/**
 * Strategy for organizing reminders by completion status
 */
export class CompletionStatusOrganizationStrategy implements OrganizationStrategy {
  categorizeReminder(reminder: Reminder): string {
    return reminder.isCompleted ? "Completed" : "Active";
  }
  
  getStrategyName(): string {
    return "completion_status";
  }
}

/**
 * Strategy for organizing reminders by category keywords
 */
export class CategoryOrganizationStrategy implements OrganizationStrategy {
  private readonly categoryKeywords = {
    "Work": ["work", "meeting", "project", "office", "client", "business"],
    "Personal": ["personal", "home", "family", "friend", "self"],
    "Shopping": ["shopping", "buy", "store", "purchase", "groceries"],
    "Health": ["health", "doctor", "exercise", "medical", "fitness", "workout"],
    "Finance": ["bill", "payment", "finance", "money", "bank", "budget"],
    "Travel": ["travel", "trip", "vacation", "flight", "hotel"],
    "Education": ["study", "learn", "course", "school", "book", "research"]
  };
  
  categorizeReminder(reminder: Reminder): string {
    const text = `${reminder.title} ${reminder.notes || ""}`.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return "Uncategorized";
  }
  
  getStrategyName(): string {
    return "category";
  }
}

/**
 * Factory for creating organization strategies
 */
export class OrganizationStrategyFactory {
  private static strategies: Record<string, () => OrganizationStrategy> = {
    priority: () => new PriorityOrganizationStrategy(),
    due_date: () => new DueDateOrganizationStrategy(),
    completion_status: () => new CompletionStatusOrganizationStrategy(),
    category: () => new CategoryOrganizationStrategy(),
  };
  
  static createStrategy(strategyName: string): OrganizationStrategy {
    const factory = this.strategies[strategyName];
    
    if (!factory) {
      // Default to category strategy
      return new CategoryOrganizationStrategy();
    }
    
    return factory();
  }
  
  static getAvailableStrategies(): string[] {
    return Object.keys(this.strategies);
  }
}

/**
 * Service for organizing reminders using different strategies
 */
export class ReminderOrganizationService {
  private strategy: OrganizationStrategy;
  
  constructor(strategy: OrganizationStrategy) {
    this.strategy = strategy;
  }
  
  /**
   * Groups reminders by the current strategy
   */
  organizeReminders(reminders: Reminder[]): Record<string, Reminder[]> {
    const groups: Record<string, Reminder[]> = {};
    
    for (const reminder of reminders) {
      const groupKey = this.strategy.categorizeReminder(reminder);
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(reminder);
    }
    
    return groups;
  }
  
  /**
   * Changes the organization strategy
   */
  setStrategy(strategy: OrganizationStrategy): void {
    this.strategy = strategy;
  }
  
  /**
   * Gets the current strategy name
   */
  getStrategyName(): string {
    return this.strategy.getStrategyName();
  }
}