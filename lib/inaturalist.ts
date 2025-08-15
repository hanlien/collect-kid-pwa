import { ProviderHit } from '@/types/recognition';

export async function getINaturalistResults(queries: string[]): Promise<{ results: ProviderHit[]; processingTime: number }> {
  const startTime = Date.now();
  
  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/inat/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries })
    });

    if (!response.ok) {
      throw new Error(`iNaturalist API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      results: data.results || [],
      processingTime
    };
  } catch (error) {
    console.error('iNaturalist API error:', error);
    return {
      results: [],
      processingTime: Date.now() - startTime
    };
  }
}
