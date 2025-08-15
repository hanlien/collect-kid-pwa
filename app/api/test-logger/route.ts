import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET() {
  try {
    // Test basic logging
    logger.info('Test logger endpoint called');
    logger.recognitionStep('test_step', { test: true }, { recognitionId: 'test-123' });
    
    // Check if we can get logs
    const logs = await logger.getRecognitionLogs();
    
    return NextResponse.json({
      success: true,
      message: 'Logger test completed',
      logsCount: logs.length,
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        supabaseUrl: !!process.env.SUPABASE_URL,
        supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
