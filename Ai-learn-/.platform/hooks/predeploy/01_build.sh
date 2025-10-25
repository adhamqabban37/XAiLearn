#!/bin/bash
# AWS Elastic Beanstalk predeploy hook
# Install dependencies and build the application

set -e

echo "Installing dependencies..."
npm ci

echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"
