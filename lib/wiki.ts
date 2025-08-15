import { WikiCard } from '@/types/recognition';

export async function getWikipediaSummary(title: string): Promise<WikiCard | null> {
  try {
    const response = await fetch('/api/wiki/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Wikipedia API error:', error);
    return null;
  }
}
