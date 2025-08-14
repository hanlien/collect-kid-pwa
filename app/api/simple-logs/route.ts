import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Simple logs API working',
    timestamp: new Date().toISOString(),
    logs: [],
    total: 0,
    sessions: 0,
  });
}
