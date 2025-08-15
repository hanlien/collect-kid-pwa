import { Canonical } from '@/types/recognition';

export async function getKnowledgeGraphResults(queries: string[]): Promise<{ results: Canonical[]; processingTime: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/kg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries })
    });

    if (!response.ok) {
      throw new Error(`Knowledge Graph API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      results: data.results || data.canonicalResults || [],
      processingTime
    };
  } catch (error) {
    console.error('Knowledge Graph API error:', error);
    return {
      results: [],
      processingTime: Date.now() - startTime
    };
  }
}
