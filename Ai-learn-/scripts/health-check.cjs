#!/usr/bin/env node

const http = require('http');

const port = process.env.PORT || '3000';
const url = `http://localhost:${port}/api/health`;

http
  .get(url, (res) => {
    const { statusCode } = res;
    if (statusCode !== 200) {
      console.error(`Health check failed with status ${statusCode}`);
      process.exit(1);
    }

    let rawData = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => (rawData += chunk));
    res.on('end', () => {
      try {
        const parsed = JSON.parse(rawData);
        console.log('Health OK:', parsed);
        process.exit(0);
      } catch (e) {
        console.log('Health OK');
        process.exit(0);
      }
    });
  })
  .on('error', (e) => {
    console.error(`Health check error: ${e.message}`);
    process.exit(1);
  });
