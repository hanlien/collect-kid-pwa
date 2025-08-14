import { RecognitionResult, Species, TrainingFeedback, Capture, ApiResponse } from '../domain/types';

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// API client with error handling
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  // Recognition API
  async recognize(imageData: string): Promise<ApiResponse<RecognitionResult>> {
    return this.request<RecognitionResult>('/recognize', {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  }

  // Training feedback API
  async submitTrainingFeedback(feedback: Omit<TrainingFeedback, 'id' | 'submittedAt'>): Promise<ApiResponse<TrainingFeedback>> {
    return this.request<TrainingFeedback>('/training-feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  // Collection API
  async collectSpecies(speciesId: string, imageUrl: string): Promise<ApiResponse<Capture>> {
    return this.request<Capture>('/collect', {
      method: 'POST',
      body: JSON.stringify({ speciesId, imageUrl }),
    });
  }

  // Facts API
  async getSpeciesFacts(speciesId: string): Promise<ApiResponse<Species>> {
    return this.request<Species>(`/facts/${speciesId}`);
  }

  // Active learning API
  async submitActiveLearning(data: any): Promise<ApiResponse<void>> {
    return this.request<void>('/active-learning', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Export training data
  async exportTrainingData(): Promise<ApiResponse<any>> {
    return this.request<any>('/export-training-data');
  }

  // Test database connection
  async testDatabase(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/test-db');
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Query keys for TanStack Query
export const queryKeys = {
  recognition: ['recognition'] as const,
  species: (id: string) => ['species', id] as const,
  facts: (id: string) => ['facts', id] as const,
  captures: ['captures'] as const,
  user: ['user'] as const,
  badges: ['badges'] as const,
  trainingFeedback: ['training-feedback'] as const,
  activeLearning: ['active-learning'] as const,
} as const;

// Mutation keys
export const mutationKeys = {
  recognize: ['recognize'] as const,
  collect: ['collect'] as const,
  submitFeedback: ['submit-feedback'] as const,
  submitActiveLearning: ['submit-active-learning'] as const,
} as const;

// Custom hooks for API operations
export const useRecognition = () => {
  return {
    recognize: async (imageData: string): Promise<RecognitionResult> => {
      const response = await apiClient.recognize(imageData);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Recognition failed');
      }
      return response.data;
    },
  };
};

export const useTrainingFeedback = () => {
  return {
    submit: async (feedback: Omit<TrainingFeedback, 'id' | 'submittedAt'>): Promise<TrainingFeedback> => {
      const response = await apiClient.submitTrainingFeedback(feedback);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to submit feedback');
      }
      return response.data;
    },
  };
};

export const useCollection = () => {
  return {
    collect: async (speciesId: string, imageUrl: string): Promise<Capture> => {
      const response = await apiClient.collectSpecies(speciesId, imageUrl);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to collect species');
      }
      return response.data;
    },
  };
};

export const useSpeciesFacts = () => {
  return {
    get: async (speciesId: string): Promise<Species> => {
      const response = await apiClient.getSpeciesFacts(speciesId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch species facts');
      }
      return response.data;
    },
  };
};

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new ApiError(error.message);
  }
  
  return new ApiError('An unexpected error occurred');
};

// Retry logic for network requests
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
};

// Offline support utilities
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

export const queueOfflineRequest = (request: () => Promise<void>): void => {
  if (typeof window !== 'undefined') {
    const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
    queue.push(request.toString());
    localStorage.setItem('offline-queue', JSON.stringify(queue));
  }
};

export const processOfflineQueue = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
    
    if (queue.length > 0 && isOnline()) {
      // Process queued requests
      localStorage.setItem('offline-queue', '[]');
    }
  }
};
