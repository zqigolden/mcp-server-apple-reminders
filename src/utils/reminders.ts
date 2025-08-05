import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { Reminder, ReminderList } from '../types/index.js';
import { logger } from './logger.js';
import { getModulePaths } from './moduleHelpers.js';
import { 
  findSecureBinaryPath, 
  validateBinarySecurity, 
  getEnvironmentBinaryConfig,
  BinaryValidationError 
} from './binaryValidator.js';

/**
 * Class to interact with Apple Reminders using the Swift binary
 */
export class RemindersManager {
  private binaryPath: string;
  
  constructor() {
    // Skip binary initialization in test environment
    if (process.env.NODE_ENV === 'test') {
      this.binaryPath = '/mock/path/to/binary';
      return;
    }

    this.binaryPath = this.findBinaryPath();
    this.validateBinary();
  }

  private findBinaryPath(): string {
    // Auto-discover project root by searching for package.json
    const { __filename, __dirname } = getModulePaths();
    let projectRoot = path.dirname(__filename);
    const pathToPkg = 'package.json';
    const maxDepth = 10; // Prevent infinite loops
    let depth = 0;
    while (!fs.existsSync(path.join(projectRoot, pathToPkg)) && depth < maxDepth) {
      const parent = path.dirname(projectRoot);
      if (parent === projectRoot) break;
      projectRoot = parent;
      depth++;
    }

    // Try multiple possible binary locations with absolute paths
    const possiblePaths = [
      path.resolve(projectRoot, 'dist', 'swift', 'bin', 'GetReminders'),
      path.resolve(projectRoot, 'src', 'swift', 'bin', 'GetReminders'),
      path.resolve(projectRoot, 'swift', 'bin', 'GetReminders'),
      path.resolve(__dirname, '..', '..', 'dist', 'swift', 'bin', 'GetReminders'),
      path.resolve(__dirname, '..', '..', 'src', 'swift', 'bin', 'GetReminders')
    ];

    // Use secure binary path finder with environment-specific config
    const securityConfig = getEnvironmentBinaryConfig();
    const { path: securePath, validationResult } = findSecureBinaryPath(possiblePaths, securityConfig);

    if (securePath && validationResult?.isValid) {
      logger.debug(`✅ Secure Swift binary found at: ${securePath}`);
      if (validationResult.hash) {
        logger.debug(`Binary hash: ${validationResult.hash}`);
      }
      return securePath;
    }

    // If no secure path found, throw security error
    const errorDetails = validationResult?.errors.join('; ') || 'No valid binary found';
    logger.error(`❌ Binary security validation failed: ${errorDetails}`);
    
    // For backward compatibility, return default path but log security warning
    const defaultPath = path.resolve(projectRoot, 'dist', 'swift', 'bin', 'GetReminders');
    logger.warn(`⚠️  Using unvalidated binary path for backward compatibility: ${defaultPath}`);
    logger.warn(`⚠️  SECURITY WARNING: Binary integrity could not be verified`);
    
    return defaultPath;
  }

  private validateBinary(): void {
    logger.debug(`Binary path resolved to: ${this.binaryPath}`);
    logger.debug(`Running from compiled code: true`);
    
    // Perform comprehensive security validation
    const securityConfig = getEnvironmentBinaryConfig();
    const validationResult = validateBinarySecurity(this.binaryPath, securityConfig);
    
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.join('\n  - ');
      logger.error(`Swift binary security validation failed:\n  - ${errorMessage}`);
      
      // Provide helpful error message based on validation failure
      if (validationResult.errors.some(e => e.includes('FILE_NOT_FOUND'))) {
        throw new BinaryValidationError(`Swift binary not found. Please run the build script first:
        
  npm run build:swift
  
Or build the complete project:
  
  npm run build

Binary should be located at: ${this.binaryPath}`, 'BINARY_NOT_FOUND');
      }
      
      if (validationResult.errors.some(e => e.includes('NOT_EXECUTABLE'))) {
        throw new BinaryValidationError(`Swift binary is not executable. Please check permissions:
        
  chmod +x "${this.binaryPath}"
  
Or rebuild the binary:
  
  npm run build:swift`, 'BINARY_NOT_EXECUTABLE');
      }
      
      // Generic security error
      throw new BinaryValidationError(`Binary security validation failed: ${errorMessage}`, 'SECURITY_VALIDATION_FAILED');
    }
    
    logger.debug(`✅ Binary security validation passed`);
    if (validationResult.hash) {
      logger.debug(`Binary integrity hash: ${validationResult.hash}`);
    }
  }
  
  /**
   * Execute the Swift binary and parse its output
   * @returns Promise with parsed reminders data
   */
  public async getReminders(showCompleted: boolean = false): Promise<{
    lists: ReminderList[];
    reminders: Reminder[];
  }> {
    return new Promise((resolve, reject) => {
      // Convert boolean to string argument
      const args = [];
      if (showCompleted) {
        args.push('--show-completed');
      }
      
      logger.debug(`Spawning Swift binary with showCompleted=${showCompleted}, args:`, args);
      const process = spawn(this.binaryPath, args);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        logger.debug('Received stdout chunk:', chunk);
        stdout += chunk;
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.error(`Swift binary stderr: ${stderr}`);
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          logger.error(`Swift process exited with code ${code}`);
          logger.error(`Error: ${stderr}`);
          return reject(new Error(`Failed to get reminders: ${stderr}`));
        }
        
        try {
          // Parse the output
          const result = this.parseSwiftOutput(stdout);
          resolve(result);
        } catch (error) {
          logger.error(`Failed to parse Swift output: ${error}`);
          reject(error);
        }
      });
    });
  }
  
  /**
   * Ensures the isCompleted value is a proper boolean
   */
  private normalizeIsCompleted(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }
  
  /**
   * Parse the output from the Swift binary
   * @param output The raw output from the Swift binary
   * @returns Parsed reminders data
   */
  private parseSwiftOutput(output: string): {
    lists: ReminderList[];
    reminders: Reminder[];
  } {
    const debugReminderState = (reminder: Partial<Reminder>, stage: string) => {
      logger.debug(`[${stage}] Reminder "${reminder.title}":
        - isCompleted: ${reminder.isCompleted}
        - Type: ${typeof reminder.isCompleted}
        - Normalized: ${this.normalizeIsCompleted(reminder.isCompleted)}
        - toString(): ${reminder.isCompleted?.toString()}
        - JSON: ${JSON.stringify(reminder)}
      `);
    };

    const lines = output.split('\n');
    const lists: ReminderList[] = [];
    const reminders: Reminder[] = [];
    
    let parsingLists = false;
    let parsingReminders = false;
    let currentReminder: Partial<Reminder> = {};
    
    logger.debug(`Starting to parse Swift output, ${lines.length} lines`);
    
    for (const line of lines) {
      // Parse reminder lists section
      if (line.includes('=== REMINDER LISTS ===')) {
        parsingLists = true;
        parsingReminders = false;
        continue;
      }
      
      // Parse reminders section
      if (line.includes('=== ALL REMINDERS ===')) {
        parsingLists = false;
        parsingReminders = true;
        continue;
      }
      
      // Parse reminder lists
      if (parsingLists && line.trim() !== '') {
        const match = line.match(/^(\d+)\.\s(.+)$/);
        if (match) {
          lists.push({
            id: parseInt(match[1], 10),
            title: match[2]
          });
        }
      }
      
      // Parse reminders
      if (parsingReminders) {
        if (line.startsWith('Title:')) {
          // Start a new reminder
          if (Object.keys(currentReminder).length > 0 && currentReminder.title && currentReminder.list) {
            // Only add if we have required fields
            reminders.push(currentReminder as Reminder);
          }
          currentReminder = {
            title: line.replace('Title:', '').trim(),
            isCompleted: false, // Default to not completed
            list: ''
          };
        } else if (line.startsWith('Due Date:')) {
          currentReminder.dueDate = line.replace('Due Date:', '').trim();
        } else if (line.startsWith('Notes:')) {
          currentReminder.notes = line.replace('Notes:', '').trim();
        } else if (line.startsWith('List:')) {
          currentReminder.list = line.replace('List:', '').trim();
        } else if (line.startsWith('Status:')) {
          const status = line.trim();
          logger.debug(`Processing status line: "${status}" for reminder: ${currentReminder.title}`);
          
          // 使用严格的布尔值转换
          currentReminder.isCompleted = this.normalizeIsCompleted(status === 'Status: Completed');
          logger.debug(`Normalized isCompleted value: ${currentReminder.isCompleted}`);
        } else if (line.startsWith('Raw isCompleted value:')) {
          // 直接使用 Swift 程序提供的原始布尔值
          const rawValue = line.replace('Raw isCompleted value:', '').trim().toLowerCase();
          currentReminder.isCompleted = rawValue === 'true';
          debugReminderState(currentReminder, 'After setting raw value');
          
          // 额外检查以确保值类型正确
          logger.debug(`After setting raw value, isCompleted=${currentReminder.isCompleted}, type=${typeof currentReminder.isCompleted}`);
        } else if (line === '-------------------' && Object.keys(currentReminder).length > 0) {
          // End of a reminder - validate required fields
          if (currentReminder.title && currentReminder.list) {
            // Ensure isCompleted is strictly a boolean
            if (typeof currentReminder.isCompleted !== 'boolean') {
              logger.warn(`Reminder ${currentReminder.title} has non-boolean isCompleted: ${currentReminder.isCompleted} (${typeof currentReminder.isCompleted})`);
              currentReminder.isCompleted = false;
            }
            
            debugReminderState(currentReminder, 'Before adding to list');
            reminders.push(currentReminder as Reminder);
            currentReminder = {};
          } else {
            logger.warn('Skipping reminder with missing required fields:', currentReminder);
          }
        }
      }
    }
    
    // Add the last reminder if it exists
    if (Object.keys(currentReminder).length > 0 && currentReminder.title && currentReminder.list) {
      // Ensure isCompleted is strictly a boolean for the last reminder too
      if (typeof currentReminder.isCompleted !== 'boolean') {
        logger.warn(`Last reminder ${currentReminder.title} has non-boolean isCompleted: ${currentReminder.isCompleted} (${typeof currentReminder.isCompleted})`);
        currentReminder.isCompleted = false;
      }
      
      logger.debug(`Adding last reminder: ${currentReminder.title}, isCompleted=${currentReminder.isCompleted}`);
      reminders.push(currentReminder as Reminder);
    }
    
    logger.debug(`Finished parsing: ${lists.length} lists, ${reminders.length} reminders`);
    
    return {
      lists,
      reminders: reminders.map(reminder => ({
        ...reminder,
        isCompleted: this.normalizeIsCompleted(reminder.isCompleted),
      }))
    };
  }



}

// Export a singleton instance
export const remindersManager = new RemindersManager(); 