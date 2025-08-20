/**
 * binaryPathInitializer.ts
 * Handles initialization and resolution of Swift binary paths
 */

import path from 'path';
import fs from 'fs';
import { logger } from './logger.js';
import { getModulePaths } from './moduleHelpers.js';
import { findSecureBinaryPath, getEnvironmentBinaryConfig } from './binaryValidator.js';
import { 
  FILE_SYSTEM, 
  BINARY_PATHS, 
  ENVIRONMENT_VARS, 
  ENVIRONMENTS 
} from './constants.js';

/**
 * Initializes and resolves the Swift binary path with fallbacks
 */
export function initializeBinaryPath(): string | null {
  if (isTestEnvironment()) {
    return BINARY_PATHS.MOCK_PATH;
  }

  try {
    const projectRoot = findProjectRoot();
    const possiblePaths = buildPossibleBinaryPaths(projectRoot);
    
    return resolveSecureBinaryPath(possiblePaths);
  } catch (error) {
    logger.error(`❌ Failed to initialize binary path: ${error}`);
    return null;
  }
}

/**
 * Checks if running in test environment
 */
function isTestEnvironment(): boolean {
  return process.env[ENVIRONMENT_VARS.NODE_ENV] === ENVIRONMENTS.TEST;
}

/**
 * Finds the project root directory by searching for package.json
 */
function findProjectRoot(): string {
  const { __filename } = getModulePaths();
  let projectRoot = path.dirname(__filename);
  let depth = 0;
  
  while (!packageJsonExists(projectRoot) && depth < FILE_SYSTEM.MAX_DIRECTORY_SEARCH_DEPTH) {
    const parent = path.dirname(projectRoot);
    if (parent === projectRoot) break; // Reached filesystem root
    
    projectRoot = parent;
    depth++;
  }

  return projectRoot;
}

/**
 * Checks if package.json exists in the given directory
 */
function packageJsonExists(directory: string): boolean {
  return fs.existsSync(path.join(directory, FILE_SYSTEM.PACKAGE_JSON_FILENAME));
}

/**
 * Builds array of possible binary paths in order of preference
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
 * Resolves the secure binary path from possible paths
 */
function resolveSecureBinaryPath(possiblePaths: string[]): string | null {
  const securityConfig = getEnvironmentBinaryConfig();
  const { path: securePath } = findSecureBinaryPath(possiblePaths, securityConfig);
  
  if (securePath) {
    logger.debug(`✅ Binary path initialized for permission checks: ${securePath}`);
    return securePath;
  } else {
    logger.warn(`⚠️  Binary path not found for permission checks`);
    return null;
  }
}