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
      const startLog = sessionLogs.find(log => log.message.includes('Recognition Pipeline Started') || log.message.includes('llm_only_start'));
      const successLog = sessionLogs.find(log => 
        log.message.includes('Recognition Successful') || 
        log.message.includes('llm_only_success') ||
        log.message.includes('llm_only_final_success') ||
        log.message.includes('hybrid_success') ||
        log.message.includes('ai_only_success')
      );
      const errorLog = sessionLogs.find(log => 
        log.message.includes('Recognition Failed') || 
        log.message.includes('llm_only_error') ||
        log.message.includes('both_systems_failed')
      );
      
      const visionLog = sessionLogs.find(log => log.message.includes('Vision API Results'));
      const decisionLog = sessionLogs.find(log => log.message.includes('Decision Making'));
      const llmSuccessLog = sessionLogs.find(log => log.message.includes('llm_only_success'));
      
      // Calculate duration from start to success or last log
      let duration;
      if (startLog && successLog) {
        duration = new Date(successLog.timestamp).getTime() - new Date(startLog.timestamp).getTime();
      } else if (startLog && sessionLogs.length > 0) {
        const lastLog = sessionLogs[0]; // Logs are ordered by timestamp desc
        duration = new Date(lastLog.timestamp).getTime() - new Date(startLog.timestamp).getTime();
      }
      
      // Determine status
      let status = 'in_progress';
      if (errorLog) {
        status = 'failed';
      } else if (successLog || llmSuccessLog) {
        status = 'success';
      }
      
      // Extract final result from various log types
      let finalResult = null;
      if (successLog?.data?.result) {
        finalResult = successLog.data.result;
      } else if (llmSuccessLog?.data) {
        // For AI-only results, construct the result from log data
        finalResult = {
          commonName: llmSuccessLog.data.commonName || 'Unknown',
          scientificName: llmSuccessLog.data.scientificName || '',
          confidence: llmSuccessLog.data.confidence || 0.6,
          category: llmSuccessLog.data.category || 'mysterious',
          provider: 'ai-router',
          model: llmSuccessLog.data.model
        };
      }
      
      // Also check for the final success log
      const finalSuccessLog = sessionLogs.find(log => log.message.includes('llm_only_final_success'));
      if (finalSuccessLog?.data?.result) {
        finalResult = finalSuccessLog.data.result;
      }
      
      return {
        sessionId,
        startTime: startLog?.timestamp,
        duration,
        status,
        imageSize: startLog?.data?.imageSize,
        visionLabels: visionLog?.data?.labels?.length || 0,
        decision: decisionLog?.data?.mode,
        logCount: sessionLogs.length,
        error: errorLog?.data?.details || errorLog?.error?.message || errorLog?.data?.error,
        finalResult
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
