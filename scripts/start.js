#!/usr/bin/env node

// Cross-platform start script that respects PORT environment variable
const { spawn } = require('child_process');

const port = process.env.PORT || '3000';

console.log(`Starting Next.js on port ${port}...`);

const child = spawn('npx', ['next', 'start', '-p', port], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});
