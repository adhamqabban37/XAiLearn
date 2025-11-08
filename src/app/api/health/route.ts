import { NextRequest, NextResponse } from 'next/server';

/**
 * Health check endpoint for platform monitoring
 * Returns basic application health status
 */
export async function GET(request: NextRequest) {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    port: process.env.PORT || 3000,
  };

  return NextResponse.json(healthCheck, { status: 200 });
}

/**
 * HEAD method for lightweight health checks
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
