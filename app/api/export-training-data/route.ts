import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAvailable } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is available
    if (!isSupabaseAvailable() || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Training data export unavailable - database not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const limit = parseInt(searchParams.get('limit') || '1000');
    const since = searchParams.get('since'); // ISO date string

    // Build query
    let query = supabaseAdmin
      .from('training_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add date filter if provided
    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch training data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch training data' },
        { status: 500 }
      );
    }

    // Transform data for training
    const trainingData = data.map(item => ({
      id: item.id,
      image_url: item.image_url,
      original_prediction: JSON.parse(item.original_prediction),
      is_correct: item.is_correct,
      correction: item.correction,
      confidence: item.confidence,
      category: item.category,
      provider: item.provider,
      created_at: item.created_at,
      metadata: JSON.parse(item.metadata || '{}')
    }));

    // Calculate statistics
    const stats = {
      total_samples: trainingData.length,
      correct_predictions: trainingData.filter(item => item.is_correct).length,
      incorrect_predictions: trainingData.filter(item => !item.is_correct).length,
      accuracy_rate: trainingData.length > 0 ? 
        (trainingData.filter(item => item.is_correct).length / trainingData.length * 100).toFixed(2) + '%' : '0%',
      by_category: {
        flower: trainingData.filter(item => item.category === 'flower').length,
        bug: trainingData.filter(item => item.category === 'bug').length,
        animal: trainingData.filter(item => item.category === 'animal').length,
      },
      by_provider: {
        inaturalist: trainingData.filter(item => item.provider === 'inaturalist').length,
        plantid: trainingData.filter(item => item.provider === 'plantid').length,
        gcv: trainingData.filter(item => item.provider === 'gcv').length,
      }
    };

    // Return in requested format
    if (format === 'csv') {
      const csvHeaders = 'id,image_url,original_prediction,is_correct,correction,confidence,category,provider,created_at\n';
      const csvRows = trainingData.map(item => 
        `${item.id},"${item.image_url}","${JSON.stringify(item.original_prediction)}",${item.is_correct},"${item.correction || ''}",${item.confidence},${item.category},${item.provider},"${item.created_at}"`
      ).join('\n');
      
      return new NextResponse(csvHeaders + csvRows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="training_data.csv"'
        }
      });
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      stats,
      data: trainingData,
      export_info: {
        format,
        limit,
        since,
        exported_at: new Date().toISOString(),
        total_samples: trainingData.length
      }
    });

  } catch (error) {
    console.error('Training data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export training data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is available
    if (!isSupabaseAvailable() || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Training data management unavailable - database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, sample_ids } = body;

    if (action === 'mark_for_training') {
      // Mark specific samples for training
      const { data, error } = await supabaseAdmin
        .from('training_feedback')
        .update({ training_status: 'ready' })
        .in('id', sample_ids)
        .select();

      if (error) {
        console.error('Failed to mark samples for training:', error);
        return NextResponse.json(
          { error: 'Failed to mark samples for training' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Marked ${data.length} samples for training`,
        samples: data
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Training data action error:', error);
    return NextResponse.json(
      { error: 'Failed to process training data action' },
      { status: 500 }
    );
  }
}
