import { VisionBundle } from '@/types/recognition';

export async function getVisionLabels(imageBase64: string): Promise<VisionBundle> {
  try {
    // For server-side calls, we need to use the full URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data.visionBundle || data;
  } catch (error) {
    console.error('Vision API error:', error);
    return {
      labels: [],
      cropLabels: [],
      webBestGuess: [],
      webPageTitles: [],
      safe: {
        adult: 'UNKNOWN',
        violence: 'UNKNOWN',
        racy: 'UNKNOWN',
        medical: 'UNKNOWN'
      }
    };
  }
}
