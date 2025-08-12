import { Category, SpeciesResult } from '@/types/species';

// Image processing utilities
export function downscaleImage(file: File, maxSize: number = 1024): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      const ratio = Math.min(maxSize / width, maxSize / height);
      
      if (ratio < 1) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      } else {
        canvas.width = width;
        canvas.height = height;
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// Badge subtype mapping
export function getBadgeSubtype(labels: string[], category: Category): string {
  const lowerLabels = labels.map(l => l.toLowerCase());
  
  if (category === 'flower') {
    if (lowerLabels.some(l => l.includes('rose'))) return 'rose';
    if (lowerLabels.some(l => l.includes('daisy'))) return 'daisy';
    if (lowerLabels.some(l => l.includes('tulip'))) return 'tulip';
    if (lowerLabels.some(l => l.includes('sunflower'))) return 'sunflower';
    return 'flower';
  }
  
  if (category === 'bug') {
    if (lowerLabels.some(l => l.includes('butterfly'))) return 'butterfly';
    if (lowerLabels.some(l => l.includes('bee'))) return 'bee';
    if (lowerLabels.some(l => l.includes('ladybug'))) return 'ladybug';
    if (lowerLabels.some(l => l.includes('dragonfly'))) return 'dragonfly';
    return 'bug';
  }
  
  if (category === 'animal') {
    if (lowerLabels.some(l => l.includes('bird'))) return 'bird';
    if (lowerLabels.some(l => l.includes('dog'))) return 'dog';
    if (lowerLabels.some(l => l.includes('cat'))) return 'cat';
    if (lowerLabels.some(l => l.includes('squirrel'))) return 'squirrel';
    return 'animal';
  }
  
  return 'unknown';
}

// Badge level calculation
export function getBadgeLevel(count: number): number {
  if (count >= 7) return 3;
  if (count >= 3) return 2;
  return 1;
}

// Color name to hex mapping
export function colorNameToHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
    brown: '#a16207',
    black: '#000000',
    white: '#ffffff',
    gray: '#6b7280',
  };
  
  return colorMap[colorName.toLowerCase()] || '#6b7280';
}

// Safety check for dangerous species
export function isDangerousSpecies(result: SpeciesResult): boolean {
  const dangerousKeywords = ['wasp', 'hornet', 'spider', 'snake', 'poisonous', 'venomous'];
  const name = (result.commonName || result.canonicalName).toLowerCase();
  return dangerousKeywords.some(keyword => name.includes(keyword));
}

// Generate fun facts from summary
export function generateFunFacts(summary: string): string[] {
  const sentences = summary.split('. ').filter(s => s.length > 20);
  const facts = sentences.slice(0, 3).map(s => {
    // Remove technical jargon and make kid-friendly
    return s
      .replace(/scientific name/gi, 'name')
      .replace(/species/gi, 'type')
      .replace(/genus/gi, 'family')
      .replace(/family/gi, 'group')
      .replace(/taxonomy/gi, 'grouping')
      .replace(/morphology/gi, 'looks')
      .replace(/habitat/gi, 'home')
      .replace(/distribution/gi, 'where they live');
  });
  
  return facts.filter(f => f.length > 10 && f.length < 200);
}

// Format confidence for display
export function formatConfidence(confidence: number): string {
  if (confidence >= 0.9) return 'Very sure!';
  if (confidence >= 0.7) return 'Pretty sure!';
  if (confidence >= 0.5) return 'Maybe...';
  return 'Not sure';
}
