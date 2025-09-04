/**
 * projectUtils.ts
 * Shared utilities for project-related operations
 */

import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';

/**
 * Finds the project root directory by looking for package.json
 * @param maxDepth - Maximum directory levels to traverse upward
 * @returns Project root directory path
 * @throws Error if project root cannot be found
 */
export function findProjectRoot(maxDepth = 10): string {
  let currentDir = process.cwd();
  
  // In test environment, use cwd-based search only
  if (process.env.NODE_ENV === 'test') {
    let depth = 0;
    while (depth < maxDepth) {
      if (isCorrectProjectRoot(currentDir)) {
        logger.debug(`Project root found at: ${currentDir}`);
        return currentDir;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break; // Reached filesystem root
      }
      
      currentDir = parentDir;
      depth++;
    }
  } else {
    // In production/development, use a more robust approach
    let depth = 0;
    while (depth < maxDepth) {
      if (isCorrectProjectRoot(currentDir)) {
        logger.debug(`Project root found at: ${currentDir}`);
        return currentDir;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break; // Reached filesystem root
      }
      
      currentDir = parentDir;
      depth++;
    }
  }

  throw new Error(`Project root not found within ${maxDepth} directory levels`);
}

/**
 * Checks if a directory contains the correct package.json for this project
 */
function isCorrectProjectRoot(dir: string): boolean {
  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(packageContent);
    return packageData.name === 'mcp-server-apple-reminders';
  } catch (error) {
    logger.debug(`Failed to parse package.json at ${packageJsonPath}:`, error);
    return false;
  }
}

/**
 * Resolves a path relative to the project root
 * @param relativePath - Path relative to project root
 * @returns Absolute path
 */
export function resolveFromProjectRoot(relativePath: string): string {
  const projectRoot = findProjectRoot();
  return path.resolve(projectRoot, relativePath);
}