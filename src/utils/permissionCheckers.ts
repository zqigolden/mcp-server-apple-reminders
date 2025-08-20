/**
 * permissionCheckers.ts
 * Specialized permission checkers following single responsibility principle
 */

import { spawn } from 'child_process';
import { logger } from './logger.js';
import { TIMEOUTS, APPLESCRIPT, PERMISSIONS, MESSAGES } from './constants.js';

export interface PermissionStatus {
  granted: boolean;
  error?: string;
  requiresUserAction?: boolean;
}

/**
 * Checks EventKit permissions using the Swift binary
 */
export async function checkEventKitPermissions(binaryPath: string | null): Promise<PermissionStatus> {
  if (!binaryPath) {
    return createPermissionFailure(MESSAGES.ERROR.BINARY_NOT_AVAILABLE, true);
  }

  return executePermissionCheck(
    binaryPath,
    [PERMISSIONS.CHECK_PERMISSIONS_ARG],
    TIMEOUTS.EVENTKIT_PERMISSION_CHECK,
    'EventKit'
  );
}

/**
 * Checks AppleScript automation permissions
 */
export async function checkAppleScriptPermissions(): Promise<PermissionStatus> {
  return executePermissionCheck(
    APPLESCRIPT.EXECUTABLE,
    [APPLESCRIPT.EXECUTE_FLAG, APPLESCRIPT.PERMISSION_TEST_SCRIPT],
    TIMEOUTS.APPLESCRIPT_PERMISSION_CHECK,
    'AppleScript'
  );
}

/**
 * Executes a permission check process and returns the result
 */
async function executePermissionCheck(
  command: string,
  args: string[],
  timeout: number,
  permissionType: string
): Promise<PermissionStatus> {
  return new Promise((resolve) => {
    const process = spawn(command, args);
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      resolve(handleProcessClose(code, stdout, stderr, permissionType));
    });
    
    process.on('error', (error) => {
      resolve(createPermissionFailure(
        MESSAGES.ERROR.PERMISSION_CHECK_FAILED(permissionType, error.message),
        true
      ));
    });
    
    // Handle timeout
    setTimeout(() => {
      if (!process.killed) {
        process.kill();
        resolve(createPermissionFailure(
          MESSAGES.ERROR.PERMISSION_CHECK_TIMEOUT(permissionType),
          true
        ));
      }
    }, timeout);
  });
}

/**
 * Handles the close event of a permission check process
 */
function handleProcessClose(
  code: number | null,
  stdout: string,
  stderr: string,
  permissionType: string
): PermissionStatus {
  if (code === 0 && (permissionType === 'EventKit' || stdout.trim())) {
    return { granted: true, error: undefined, requiresUserAction: false };
  }
  
  return analyzePermissionError(stderr, permissionType);
}

/**
 * Analyzes permission error and provides appropriate guidance
 */
function analyzePermissionError(stderr: string, permissionType: string): PermissionStatus {
  const errorText = stderr.toLowerCase();
  const isPermissionError = PERMISSIONS.PERMISSION_ERROR_KEYWORDS.some(
    keyword => errorText.includes(keyword)
  );
  
  if (isPermissionError) {
    const guidance = getPermissionGuidance(permissionType);
    return createPermissionFailure(guidance, true);
  }
  
  return createPermissionFailure(
    `${permissionType} check failed: ${stderr}`,
    false
  );
}

/**
 * Gets specific permission guidance for different types
 */
function getPermissionGuidance(permissionType: string): string {
  switch (permissionType) {
    case 'EventKit':
      return 'EventKit permission denied. Please grant access in System Settings > Privacy & Security > Reminders';
    case 'AppleScript':
      return 'AppleScript automation permission denied. Please grant access in System Settings > Privacy & Security > Automation';
    default:
      return `${permissionType} permission denied. Please check system settings.`;
  }
}

/**
 * Creates a standardized permission failure response
 */
function createPermissionFailure(error: string, requiresUserAction: boolean): PermissionStatus {
  return {
    granted: false,
    error,
    requiresUserAction
  };
}