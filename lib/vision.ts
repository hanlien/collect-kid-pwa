import { VisionBundle } from '@/types/recognition';

export async function getVisionLabels(imageBase64: string): Promise<VisionBundle> {
  try {
    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
