import { Species, RecognitionResult, RecognitionError, RecognitionProvider } from './types';

// Abstract interface for recognition providers
export interface RecognitionProviderInterface {
  readonly name: RecognitionProvider;
  readonly isAvailable: boolean;
  
  recognize(imageData: string): Promise<RecognitionResult>;
  getConfidenceThreshold(): number;
  getMaxProcessingTime(): number;
}

// Base class for recognition providers
export abstract class BaseRecognitionProvider implements RecognitionProviderInterface {
  abstract readonly name: RecognitionProvider;
  abstract readonly isAvailable: boolean;
  
  abstract recognize(imageData: string): Promise<RecognitionResult>;
  
  getConfidenceThreshold(): number {
    return 0.7; // Default 70% confidence threshold
  }
  
  getMaxProcessingTime(): number {
    return 10000; // Default 10 second timeout
  }
  
  protected createRecognitionResult(
    species: Species,
    processingTime: number
  ): RecognitionResult {
    return {
      species,
      provider: this.name,
      processingTime,
      timestamp: new Date()
    };
  }
  
  protected createError(error: RecognitionError): never {
    throw error;
  }
}

// Recognition service that manages multiple providers
export class RecognitionService {
  private providers: Map<RecognitionProvider, RecognitionProviderInterface> = new Map();
  private fallbackOrder: RecognitionProvider[] = [];
  
  constructor() {
    this.fallbackOrder = ['iNaturalist', 'Plant.id', 'GoogleVision', 'LocalModel'];
  }
  
  registerProvider(provider: RecognitionProviderInterface): void {
    this.providers.set(provider.name, provider);
  }
  
  setFallbackOrder(order: RecognitionProvider[]): void {
    this.fallbackOrder = order.filter(provider => this.providers.has(provider));
  }
  
  async recognize(imageData: string): Promise<RecognitionResult> {
    const startTime = Date.now();
    
    // Try providers in fallback order
    for (const providerName of this.fallbackOrder) {
      const provider = this.providers.get(providerName);
      
      if (!provider || !provider.isAvailable) {
        continue;
      }
      
      try {
        const result = await this.executeWithTimeout(
          provider.recognize(imageData),
          provider.getMaxProcessingTime()
        );
        
        // Check confidence threshold
        if (result.species.confidence >= provider.getConfidenceThreshold()) {
          return result;
        }
        
        // If confidence is too low, try next provider
        console.warn(`Low confidence (${result.species.confidence}) from ${provider.name}, trying next provider`);
        
      } catch (error) {
        console.error(`Error with ${provider.name}:`, error);
        continue;
      }
    }
    
    // If all providers fail, throw error
    const processingTime = Date.now() - startTime;
    throw {
      type: 'NO_RESULTS',
      message: 'No recognition results from any available provider',
      processingTime
    } as RecognitionError;
  }
  
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Recognition timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
  
  getAvailableProviders(): RecognitionProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.isAvailable)
      .map(provider => provider.name);
  }
  
  getProviderStats(): Record<RecognitionProvider, { available: boolean; avgProcessingTime?: number }> {
    const stats: Record<RecognitionProvider, { available: boolean; avgProcessingTime?: number }> = {} as any;
    
    for (const [name, provider] of Array.from(this.providers.entries())) {
      stats[name] = {
        available: provider.isAvailable
        // avgProcessingTime: undefined // TODO: Implement tracking
      };
    }
    
    return stats;
  }
}

// Factory for creating recognition providers
export class RecognitionProviderFactory {
  static createProvider(type: RecognitionProvider): RecognitionProviderInterface | null {
    switch (type) {
      case 'iNaturalist':
        return new INaturalistProvider();
      case 'Plant.id':
        return new PlantIdProvider();
      case 'GoogleVision':
        return new GoogleVisionProvider();
      case 'LocalModel':
        return new LocalModelProvider();
      default:
        return null;
    }
  }
}

// Concrete provider implementations (to be implemented)
export class INaturalistProvider extends BaseRecognitionProvider {
  readonly name: RecognitionProvider = 'iNaturalist';
  readonly isAvailable: boolean = true;
  
  async recognize(_imageData: string): Promise<RecognitionResult> {
    // TODO: Implement iNaturalist API integration
    throw new Error('INaturalistProvider not implemented');
  }
}

export class PlantIdProvider extends BaseRecognitionProvider {
  readonly name: RecognitionProvider = 'Plant.id';
  readonly isAvailable: boolean = true;
  
  async recognize(_imageData: string): Promise<RecognitionResult> {
    // TODO: Implement Plant.id API integration
    throw new Error('PlantIdProvider not implemented');
  }
}

export class GoogleVisionProvider extends BaseRecognitionProvider {
  readonly name: RecognitionProvider = 'GoogleVision';
  readonly isAvailable: boolean = true;
  
  async recognize(_imageData: string): Promise<RecognitionResult> {
    // TODO: Implement Google Vision API integration
    throw new Error('GoogleVisionProvider not implemented');
  }
}

export class LocalModelProvider extends BaseRecognitionProvider {
  readonly name: RecognitionProvider = 'LocalModel';
  readonly isAvailable: boolean = false; // Disabled for now
  
  async recognize(_imageData: string): Promise<RecognitionResult> {
    // TODO: Implement local TensorFlow.js model
    throw new Error('LocalModelProvider not implemented');
  }
}
