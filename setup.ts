/**
 * setup.ts
 * Setup script for configuring the Claude desktop app to use this MCP server
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, 'config.json');

async function main() {
  let config: any = {};
  
  try {
    const configData = await fs.promises.readFile(CONFIG_PATH, 'utf-8');
    config = JSON.parse(configData);
  } catch (error) {
    // File doesn't exist or is invalid JSON, start with empty config
  }
  
  // Build Swift binary
  const nodePath = process.argv[0]; // Current node executable
  
  try {
    execSync('src/swift/build.sh', {
      stdio: 'inherit',
      env: {
        ...process.env,
        command: nodePath,
      },
    });
    
    config.swiftBinaryBuilt = true;
    await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    
    console.log('Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();
