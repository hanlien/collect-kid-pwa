import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('training_feedback')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        suggestion: 'Run the SQL in training_tables.sql in your Supabase dashboard'
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      table_exists: true
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
