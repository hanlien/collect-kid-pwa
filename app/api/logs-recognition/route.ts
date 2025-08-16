import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recognitionId = searchParams.get('recognitionId');
    const limit = searchParams.get('limit');
    const exportLogs = searchParams.get('export') === 'true';
    const level = searchParams.get('level');

    // Get recognition-specific logs
    const logs = await logger.getRecognitionLogs(
      recognitionId || undefined,
      limit ? parseInt(limit) : undefined
    );

    // Filter by level if specified
    const filteredLogs = level ? 
      logs.filter(log => log.level >= parseInt(level)) : 
      logs;

    if (exportLogs) {
      const logsJson = JSON.stringify(filteredLogs, null, 2);
      return new NextResponse(logsJson, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="recognition-logs${recognitionId ? `-${recognitionId}` : ''}.json"`,
        },
      });
    }

    // Group logs by recognition session for better readability
    const groupedLogs = filteredLogs.reduce((acc, log) => {
      const sessionId = log.recognitionId || 'unknown';
      if (!acc[sessionId]) {
        acc[sessionId] = [];
      }
      acc[sessionId].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    // Create a summary of each recognition session
    const sessionSummaries = Object.entries(groupedLogs).map(([sessionId, sessionLogs]) => {
      const startLog = sessionLogs.find(log => log.message.includes('Recognition Pipeline Started'));
      const successLog = sessionLogs.find(log => log.message.includes('Recognition Successful'));
      const errorLog = sessionLogs.find(log => log.message.includes('Recognition Failed'));
      
      const visionLog = sessionLogs.find(log => log.message.includes('Vision API Results'));
      const decisionLog = sessionLogs.find(log => log.message.includes('Decision Making'));
      
      return {
        sessionId,
        startTime: startLog?.timestamp,
        duration: startLog && successLog ? 
          new Date(successLog.timestamp).getTime() - new Date(startLog.timestamp).getTime() : 
          undefined,
        status: errorLog ? 'failed' : successLog ? 'success' : 'in_progress',
        imageSize: startLog?.data?.imageSize,
        visionLabels: visionLog?.data?.labels?.length || 0,
        decision: decisionLog?.data?.mode,
        logCount: sessionLogs.length,
        error: errorLog?.data?.details || errorLog?.error?.message,
        finalResult: successLog?.data?.result
      };
    });

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      groupedLogs,
      sessionSummaries,
      total: filteredLogs.length,
      sessions: Object.keys(groupedLogs).length,
      timestamp: new Date().toISOString(),
      recognitionId: recognitionId || 'all',
    });

  } catch (error) {
    await logger.error('Error fetching recognition logs', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch recognition logs' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const success = await logger.clearLogs();
    
    return NextResponse.json({
      success,
      message: success ? 'Recognition logs cleared' : 'Failed to clear logs',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    await logger.error('Error clearing recognition logs', error as Error);
    return NextResponse.json(
      { error: 'Failed to clear recognition logs' },
      { status: 500 }
    );
  }
}
