/**
 * permissionGuidance.ts
 * Utilities for generating user-friendly permission guidance
 */

export interface SystemPermissions {
  eventKit: PermissionStatus;
  appleScript: PermissionStatus;
  allGranted: boolean;
}

export interface PermissionStatus {
  granted: boolean;
  error?: string;
  requiresUserAction?: boolean;
}

/**
 * Generates comprehensive permission guidance for users
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
 * Creates the guidance header
 */
function createHeader(): string {
  return '🔐 Apple Reminders MCP Server requires the following permissions:\n';
}

/**
 * Creates permission status sections
 */
function createPermissionSections(permissions: SystemPermissions): string[] {
  const sections: string[] = [];
  
  sections.push(createEventKitSection(permissions.eventKit));
  sections.push(createAppleScriptSection(permissions.appleScript));
  
  return sections;
}

/**
 * Creates the EventKit permission section
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
 * Creates the AppleScript permission section
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
 * Creates action guidance sections when permissions are missing
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
 * Creates the post-permission action guidance
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