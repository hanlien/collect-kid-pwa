import { SpeciesResult } from '@/types/species';
import { localModel, LocalModelResult } from './localModel';
import { postprocessLocalResult } from './postprocess';

export interface RouterDecision {
  useLocal: boolean;
  usePlantId: boolean;
  useVisionFallback: boolean;
  needsReview: boolean;
  confidence: number;
  reasoning: string[];
}

export interface RouterInput {
  visionLabels: string[];
  hint: string;
  imageData?: ImageData;
  userId?: string;
}

export class MLRouter {
  private labelMap: any = null;

  async initialize(): Promise<void> {
    if (!this.labelMap) {
      const response = await fetch('/ml/label_map.json');
      this.labelMap = await response.json();
    }
  }

  async route(input: RouterInput): Promise<{
    result: SpeciesResult;
    decision: RouterDecision;
    localResult?: LocalModelResult;
  }> {
    await this.initialize();
    
    const decision: RouterDecision = {
      useLocal: false,
      usePlantId: false,
      useVisionFallback: false,
      needsReview: false,
      confidence: 0,
      reasoning: []
    };

    // Step 1: Coarse detection using Vision labels
    const category = this.detectCategory(input.visionLabels, input.hint);
    decision.reasoning.push(`Vision detected category: ${category}`);

    // Step 2: Check if we have local model coverage for this category
    const hasLocalCoverage = this.hasLocalCoverage(category);
    decision.reasoning.push(`Local coverage for ${category}: ${hasLocalCoverage}`);

    if (!hasLocalCoverage) {
      decision.useVisionFallback = true;
      decision.confidence = 0.4;
      decision.reasoning.push('No local coverage, using Vision fallback');
      
      return {
        result: this.createVisionFallbackResult(input.visionLabels, category),
        decision
      };
    }

    // Step 3: Try local model inference
    if (!input.imageData) {
      decision.useVisionFallback = true;
      decision.confidence = 0.4;
      decision.reasoning.push('No image data for local inference');
      
      return {
        result: this.createVisionFallbackResult(input.visionLabels, category),
        decision
      };
    }

    try {
      // Load local model if not loaded
      if (!localModel.isLoaded()) {
        await localModel.load();
      }

      // Run local inference
      const localResult = await localModel.infer(input.imageData);
      decision.reasoning.push(`Local inference time: ${localResult.inferenceTime.toFixed(1)}ms`);

      // Check if local model is confident
      const isConfident = localModel.isConfident(localResult);
      decision.reasoning.push(`Local confidence check: ${isConfident} (top1: ${localResult.topK[0]?.prob?.toFixed(3) || '0.000'}, margin: ${((localResult.topK[0]?.prob || 0) - (localResult.topK[1]?.prob || 0)).toFixed(3)})`);

      if (isConfident) {
        decision.useLocal = true;
        decision.confidence = localResult.topK[0]?.prob || 0;
        decision.reasoning.push('Using local model result (confident)');
        
        return {
          result: postprocessLocalResult(localResult),
          decision,
          localResult
        };
      }

      // Step 4: Local model not confident, check category-specific fallbacks
      if (category === 'flower') {
        decision.usePlantId = true;
        decision.confidence = 0.6;
        decision.reasoning.push('Local not confident for flower, using Plant.id');
        
        return {
          result: this.createPlantIdFallbackResult(input.visionLabels),
          decision,
          localResult
        };
      } else {
        // For bugs and animals, use local result even if not confident
        decision.useLocal = true;
        decision.confidence = localResult.topK[0]?.prob || 0;
        decision.needsReview = true;
        decision.reasoning.push('Using local result but needs review (low confidence)');
        
        return {
          result: postprocessLocalResult(localResult),
          decision,
          localResult
        };
      }

    } catch (error) {
      console.error('Local model inference failed:', error);
      decision.useVisionFallback = true;
      decision.confidence = 0.4;
      decision.reasoning.push('Local inference failed, using Vision fallback');
      
      return {
        result: this.createVisionFallbackResult(input.visionLabels, category),
        decision
      };
    }
  }

  private detectCategory(visionLabels: string[], hint: string): string {
    if (hint !== 'auto') return hint;

    const plantTerms = ['plant', 'flower', 'tree', 'leaf', 'petal', 'bloom', 'garden', 'flora'];
    const bugTerms = ['insect', 'bug', 'bee', 'butterfly', 'ant', 'spider', 'fly', 'mosquito', 'beetle'];
    const animalTerms = ['animal', 'mammal', 'bird', 'reptile', 'amphibian', 'fish', 'pet', 'wildlife'];

    const hasPlant = visionLabels.some(label => 
      plantTerms.some(term => label.toLowerCase().includes(term))
    );
    const hasBug = visionLabels.some(label => 
      bugTerms.some(term => label.toLowerCase().includes(term))
    );
    const hasAnimal = visionLabels.some(label => 
      animalTerms.some(term => label.toLowerCase().includes(term))
    );

    if (hasPlant) return 'flower';
    if (hasBug) return 'bug';
    if (hasAnimal) return 'animal';
    
    return 'unknown';
  }

  private hasLocalCoverage(category: string): boolean {
    if (!this.labelMap) return false;
    
    const categoryClasses = this.labelMap.categories[category];
    return categoryClasses && categoryClasses.length > 0;
  }

  private createVisionFallbackResult(visionLabels: string[], category: string): SpeciesResult {
    const topLabel = visionLabels[0] || 'Unknown';
    
    return {
      category: category as any,
      canonicalName: topLabel,
      commonName: topLabel,
      rank: 'species',
      confidence: 0.4,
      provider: 'gcv',
      meta: {
        modelVersion: 'none',
        reasoning: 'Vision fallback - no local coverage'
      }
    };
  }

  private createPlantIdFallbackResult(_visionLabels: string[]): SpeciesResult {
    return {
      category: 'flower',
      canonicalName: 'Plant',
      commonName: 'Plant',
      rank: 'kingdom',
      confidence: 0.6,
      provider: 'plantid',
      meta: {
        modelVersion: 'none',
        reasoning: 'Plant.id fallback - local not confident'
      }
    };
  }
}

export const mlRouter = new MLRouter();
