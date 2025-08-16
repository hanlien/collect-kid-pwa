import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get recent recognition logs
    const logs = await logger.getRecognitionLogs(undefined, 20);
    
    return NextResponse.json({
      success: true,
      logs,
      totalLogs: logs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'clear') {
      await logger.clearLogs();
      return NextResponse.json({ success: true, message: 'Logs cleared' });
    }
    
    if (action === 'test') {
      // Test logging
          await logger.info('Test log entry', { test: true, timestamp: Date.now() });
    await logger.recognitionStep('test_step', { test: true }, { recognitionId: 'test-123' });
      
      return NextResponse.json({ success: true, message: 'Test logs created' });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
