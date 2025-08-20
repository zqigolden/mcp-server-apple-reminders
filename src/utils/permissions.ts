/**
 * permissions.ts
 * macOS permissions management for Apple Reminders MCP Server
 * 
 * Handles EventKit and AppleScript permissions with proactive checks and user guidance
 */

import { logger } from './logger.js';
import { BinaryValidationError } from './binaryValidator.js';
import { initializeBinaryPath } from './binaryPathInitializer.js';
import { checkEventKitPermissions, checkAppleScriptPermissions } from './permissionCheckers.js';
import { 
  generatePermissionGuidance, 
  createPermissionErrorDetails,
  type SystemPermissions,
  type PermissionStatus 
} from './permissionGuidance.js';
import { MESSAGES } from './constants.js';

export type { PermissionStatus, SystemPermissions };

/**
 * Permission manager for macOS system access
 */
export class PermissionsManager {
  private static instance: PermissionsManager;
  private binaryPath: string | null = null;
  
  private constructor() {
    this.binaryPath = initializeBinaryPath();
  }
  
  public static getInstance(): PermissionsManager {
    if (!PermissionsManager.instance) {
      PermissionsManager.instance = new PermissionsManager();
    }
    return PermissionsManager.instance;
  }
  
  /**
   * Check EventKit (Reminders) permissions using Swift binary
   */
  public async checkEventKitPermissions(): Promise<PermissionStatus> {
    return checkEventKitPermissions(this.binaryPath);
  }
  
  /**
   * Check AppleScript automation permissions
   */
  public async checkAppleScriptPermissions(): Promise<PermissionStatus> {
    return checkAppleScriptPermissions();
  }
  
  /**
   * Check all required permissions
   */
  public async checkAllPermissions(): Promise<SystemPermissions> {
    const [eventKit, appleScript] = await Promise.all([
      this.checkEventKitPermissions(),
      this.checkAppleScriptPermissions()
    ]);
    
    const allGranted = eventKit.granted && appleScript.granted;
    
    this.logPermissionResults(eventKit.granted, appleScript.granted, allGranted);
    
    return { eventKit, appleScript, allGranted };
  }
  
  /**
   * Logs permission check results for debugging
   */
  private logPermissionResults(
    eventKitGranted: boolean, 
    appleScriptGranted: boolean, 
    allGranted: boolean
  ): void {
    logger.debug('Permission check results:', {
      eventKit: eventKitGranted,
      appleScript: appleScriptGranted,
      allGranted
    });
  }
  
  /**
   * Get detailed permission guidance for users
   */
  public getPermissionGuidance(permissions: SystemPermissions): string {
    return generatePermissionGuidance(permissions);
  }
  
  /**
   * Proactively check and handle permission issues before operations
   */
  public async ensurePermissions(): Promise<void> {
    const permissions = await this.checkAllPermissions();
    
    if (!permissions.allGranted) {
      this.handlePermissionFailure(permissions);
    }
    
    logger.debug(MESSAGES.SUCCESS.PERMISSIONS_VERIFIED);
  }
  
  /**
   * Handles permission failures by logging and throwing appropriate errors
   */
  private handlePermissionFailure(permissions: SystemPermissions): void {
    const guidance = this.getPermissionGuidance(permissions);
    const errorDetails = createPermissionErrorDetails(permissions);
    
    logger.error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
    logger.error(guidance);
    
    throw new BinaryValidationError(
      `Permission verification failed:\n${errorDetails.join('\n')}\n\n${guidance}`,
      'PERMISSION_DENIED'
    );
  }
}

// Export singleton instance
export const permissionsManager = PermissionsManager.getInstance();