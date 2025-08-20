/**
 * permissions.ts
 * Consolidated macOS permissions management for Apple Reminders MCP Server
 * 
 * Handles EventKit and AppleScript permissions with proactive checks and user guidance
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from './logger.js';
import { BinaryValidationError } from './binaryValidator.js';
import { getModulePaths } from './moduleHelpers.js';
import { findSecureBinaryPath, getEnvironmentBinaryConfig } from './binaryValidator.js';
import { 
  TIMEOUTS, 
  APPLESCRIPT, 
  PERMISSIONS, 
  MESSAGES,
  FILE_SYSTEM,
  BINARY_PATHS,
  ENVIRONMENT_VARS,
  ENVIRONMENTS
} from './constants.js';

// Consolidated interfaces
export interface PermissionStatus {
  granted: boolean;
  error?: string;
  requiresUserAction?: boolean;
}

export interface SystemPermissions {
  eventKit: PermissionStatus;
  appleScript: PermissionStatus;
  allGranted: boolean;
}

// Binary path management
let cachedBinaryPath: string | null = null;

/**
 * Initializes and caches the Swift binary path
 */
function getBinaryPath(): string | null {
  if (cachedBinaryPath !== null) {
    return cachedBinaryPath;
  }

  if (process.env[ENVIRONMENT_VARS.NODE_ENV] === ENVIRONMENTS.TEST) {
    cachedBinaryPath = BINARY_PATHS.MOCK_PATH;
    return cachedBinaryPath;
  }

  try {
    const projectRoot = findProjectRoot();
    const possiblePaths = buildPossibleBinaryPaths(projectRoot);
    cachedBinaryPath = resolveSecureBinaryPath(possiblePaths);
    return cachedBinaryPath;
  } catch (error) {
    logger.error(`❌ Failed to initialize binary path: ${error}`);
    cachedBinaryPath = null;
    return null;
  }
}

/**
 * Finds project root by searching for package.json
 */
function findProjectRoot(): string {
  const { __filename } = getModulePaths();
  let projectRoot = path.dirname(__filename);
  let depth = 0;
  
  while (!packageJsonExists(projectRoot) && depth < FILE_SYSTEM.MAX_DIRECTORY_SEARCH_DEPTH) {
    const parent = path.dirname(projectRoot);
    if (parent === projectRoot) break;
    projectRoot = parent;
    depth++;
  }
  return projectRoot;
}

/**
 * Checks if package.json exists in directory
 */
function packageJsonExists(directory: string): boolean {
  return fs.existsSync(path.join(directory, FILE_SYSTEM.PACKAGE_JSON_FILENAME));
}

/**
 * Builds possible binary paths in order of preference
 */
function buildPossibleBinaryPaths(projectRoot: string): string[] {
  const binaryName = FILE_SYSTEM.SWIFT_BINARY_NAME;
  return [
    path.resolve(projectRoot, BINARY_PATHS.DIST_PATH, binaryName),
    path.resolve(projectRoot, BINARY_PATHS.SRC_PATH, binaryName),
    path.resolve(projectRoot, BINARY_PATHS.FALLBACK_PATH, binaryName)
  ];
}

/**
 * Resolves secure binary path from possible paths
 */
function resolveSecureBinaryPath(possiblePaths: string[]): string | null {
  const securityConfig = getEnvironmentBinaryConfig();
  const { path: securePath } = findSecureBinaryPath(possiblePaths, securityConfig);
  
  if (securePath) {
    logger.debug(`✅ Binary path initialized: ${securePath}`);
    return securePath;
  } else {
    logger.warn(`⚠️  Binary path not found`);
    return null;
  }
}

// Permission checking functions
/**
 * Checks EventKit permissions using Swift binary
 */
export async function checkEventKitPermissions(): Promise<PermissionStatus> {
  const binaryPath = getBinaryPath();
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
 * Executes permission check process
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
 * Handles process close event
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
 * Analyzes permission error and provides guidance
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
 * Gets permission guidance for specific types
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
 * Creates standardized permission failure response
 */
function createPermissionFailure(error: string, requiresUserAction: boolean): PermissionStatus {
  return {
    granted: false,
    error,
    requiresUserAction
  };
}

// Combined operations
/**
 * Checks all required permissions
 */
export async function checkAllPermissions(): Promise<SystemPermissions> {
  const [eventKit, appleScript] = await Promise.all([
    checkEventKitPermissions(),
    checkAppleScriptPermissions()
  ]);
  
  const allGranted = eventKit.granted && appleScript.granted;
  
  logger.debug('Permission check results:', {
    eventKit: eventKit.granted,
    appleScript: appleScript.granted,
    allGranted
  });
  
  return { eventKit, appleScript, allGranted };
}

// User guidance generation
/**
 * Generates comprehensive permission guidance
 */
export function generatePermissionGuidance(permissions: SystemPermissions): string {
  if (permissions.allGranted) {
    return '✅ All permissions granted successfully';
  }
  
  const sections = [
    createHeader(),
    ...createPermissionSections(permissions),
    ...createActionSections(permissions)
  ];
  
  return sections.join('\n');
}

/**
 * Creates guidance header
 */
function createHeader(): string {
  return '🔐 Apple Reminders MCP Server requires the following permissions:\n';
}

/**
 * Creates permission status sections
 */
function createPermissionSections(permissions: SystemPermissions): string[] {
  return [
    createEventKitSection(permissions.eventKit),
    createAppleScriptSection(permissions.appleScript)
  ];
}

/**
 * Creates EventKit permission section
 */
function createEventKitSection(eventKit: PermissionStatus): string {
  if (eventKit.granted) {
    return '✅ EventKit (Reminders) Access: Granted\n';
  }
  
  return [
    '❌ EventKit (Reminders) Access:',
    '   • Open System Settings > Privacy & Security > Reminders',
    '   • Find your terminal or application in the list',
    '   • Enable access by toggling the switch',
    ''
  ].join('\n');
}

/**
 * Creates AppleScript permission section
 */
function createAppleScriptSection(appleScript: PermissionStatus): string {
  if (appleScript.granted) {
    return '✅ AppleScript Automation: Granted\n';
  }
  
  return [
    '❌ AppleScript Automation:',
    '   • Open System Settings > Privacy & Security > Automation',
    '   • Find your terminal or application in the list',
    '   • Expand it and enable "Reminders" access',
    '   • You may also need to allow "System Events" if prompted',
    ''
  ].join('\n');
}

/**
 * Creates action guidance sections
 */
function createActionSections(permissions: SystemPermissions): string[] {
  if (permissions.allGranted) {
    return [];
  }
  
  return [
    createPostPermissionActions(),
    createTroubleshootingTips()
  ];
}

/**
 * Creates post-permission action guidance
 */
function createPostPermissionActions(): string {
  return [
    '📋 After granting permissions:',
    '   1. Restart your terminal or application',
    '   2. Run the MCP server again',
    '   3. The system may prompt you to confirm access - click "Allow"',
    ''
  ].join('\n');
}

/**
 * Creates troubleshooting tips
 */
function createTroubleshootingTips(): string {
  return [
    '💡 If you continue having issues, try:',
    '   • Logging out and back in to macOS',
    '   • Restarting your Mac',
    '   • Checking Console.app for permission-related errors'
  ].join('\n');
}

/**
 * Creates error details for MCP client consumption
 */
export function createPermissionErrorDetails(permissions: SystemPermissions): string[] {
  const errorDetails: string[] = [];
  
  if (!permissions.eventKit.granted) {
    errorDetails.push(`EventKit: ${permissions.eventKit.error}`);
  }
  
  if (!permissions.appleScript.granted) {
    errorDetails.push(`AppleScript: ${permissions.appleScript.error}`);
  }
  
  return errorDetails;
}

// Main API function
/**
 * Proactively checks and handles permission issues before operations
 */
export async function ensurePermissions(): Promise<void> {
  const permissions = await checkAllPermissions();
  
  if (!permissions.allGranted) {
    const guidance = generatePermissionGuidance(permissions);
    const errorDetails = createPermissionErrorDetails(permissions);
    
    logger.error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
    logger.error(guidance);
    
    throw new BinaryValidationError(
      `Permission verification failed:\n${errorDetails.join('\n')}\n\n${guidance}`,
      'PERMISSION_DENIED'
    );
  }
  
  logger.debug(MESSAGES.SUCCESS.PERMISSIONS_VERIFIED);
}