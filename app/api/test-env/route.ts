import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    supabaseUrl: !!process.env.SUPABASE_URL,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    openaiKey: !!process.env.OPENAI_API_KEY,
    googleKey: !!process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY,
    plantIdKey: !!process.env.PLANT_ID_API_KEY,
    googleCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    debugPassword: process.env.NEXT_PUBLIC_DEBUG_PASSWORD,
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL
  };

  return NextResponse.json({
    success: true,
    environment: envCheck,
    timestamp: new Date().toISOString()
  });
}
