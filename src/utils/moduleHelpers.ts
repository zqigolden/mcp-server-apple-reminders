/**
 * moduleHelpers.ts
 * Helper functions for module path resolution
 */

import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Get module paths for current file
 * @returns Object with __filename and __dirname
 */
export function getModulePaths() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return { __filename, __dirname };
}