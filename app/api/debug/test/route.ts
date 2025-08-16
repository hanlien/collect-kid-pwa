import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Simple password protection
    const DEBUG_PASSWORD = process.env.NEXT_PUBLIC_DEBUG_PASSWORD || 'brandon2025';
    if (password !== DEBUG_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test database connection
    const connectionTest = await logger.testConnection();

    // Test logging functionality
    const testLog = await logger.info('🧪 Debug test log', { 
      test: true, 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    });

    // Get recent logs to verify they're being stored
    const recentLogs = await logger.getLogs(5);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {
        databaseConnection: connectionTest,
        loggingTest: !!testLog,
        recentLogsCount: recentLogs.length
      },
      environmentVariables: {
        supabaseUrl: !!process.env.SUPABASE_URL,
        supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV
      },
      recentLogs: recentLogs.slice(0, 3).map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        level: log.level
      }))
    });

  } catch (error) {
    console.error('Error in debug test:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
