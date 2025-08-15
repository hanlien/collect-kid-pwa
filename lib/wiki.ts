import { WikiCard } from '@/types/recognition';

export async function getWikipediaSummary(title: string): Promise<WikiCard | null> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/wiki/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = await response.json();
    return data.summary || data.wikiCard || data;
  } catch (error) {
    console.error('Wikipedia API error:', error);
    return null;
  }
}
