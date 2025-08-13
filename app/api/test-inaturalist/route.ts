import { NextRequest, NextResponse } from 'next/server';
import { iNaturalistAPI } from '@/lib/inaturalistAPI';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image || !image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid image file' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await image.arrayBuffer());

    console.log('🧪 Testing iNaturalist API...');
    console.log('📸 Image size:', imageBuffer.length, 'bytes');

    // Test iNaturalist identification
    const result = await iNaturalistAPI.getBestIdentification(imageBuffer);

    if (result) {
      console.log('✅ iNaturalist test successful:', result);
      return NextResponse.json({
        success: true,
        result,
        message: 'iNaturalist API is working correctly!'
      });
    } else {
      console.log('❌ iNaturalist test failed - no result');
      return NextResponse.json({
        success: false,
        message: 'iNaturalist API returned no results'
      });
    }

  } catch (error) {
    console.error('❌ iNaturalist test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'iNaturalist API test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'iNaturalist API test endpoint',
    usage: 'POST with image file to test iNaturalist identification'
  });
}
