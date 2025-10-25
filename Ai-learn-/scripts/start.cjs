#!/usr/bin/env node

// Cross-platform start script that respects PORT and supports standalone output
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const port = process.env.PORT || '3000';

const standaloneServer = join(process.cwd(), '.next', 'standalone', 'server.js');
if (existsSync(standaloneServer)) {
  console.log(`Detected standalone build. Starting server.js on port ${port}...`);
  const child = spawn('node', [standaloneServer], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port), HOSTNAME: '0.0.0.0' },
  });
  child.on('exit', (code) => process.exit(code));
} else {
  console.log(`Starting Next.js with next start on port ${port}...`);
  const child = spawn('npx', ['next', 'start', '-p', String(port)], {
    stdio: 'inherit',
  });
  child.on('exit', (code) => process.exit(code));
}
