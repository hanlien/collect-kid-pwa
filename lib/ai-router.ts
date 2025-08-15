import logger from './logger';

// AI Model Configuration
export interface AIModel {
  name: string;
  provider: 'openai' | 'google' | 'anthropic' | 'local';
  capabilities: ('vision' | 'text' | 'fast' | 'accurate' | 'cheap' | 'kidFriendly')[];
  costPerToken: number; // Cost per 1K tokens
  maxTokens: number;
  avgResponseTime: number; // milliseconds
  visionSupport: boolean;
  kidFriendly: boolean; // Optimized for children's content
}

// Available AI Models
export const AI_MODELS: AIModel[] = [
  {
    name: 'gpt-4-vision-preview',
    provider: 'openai',
    capabilities: ['vision', 'text', 'accurate', 'kidFriendly'],
    costPerToken: 0.01, // $0.01 per 1K tokens
    maxTokens: 4096,
    avgResponseTime: 3000,
    visionSupport: true,
    kidFriendly: true
  },
  {
    name: 'gpt-4o',
    provider: 'openai',
    capabilities: ['vision', 'text', 'fast', 'accurate'],
    costPerToken: 0.005, // $0.005 per 1K tokens
    maxTokens: 4096,
    avgResponseTime: 2000,
    visionSupport: true,
    kidFriendly: true
  },
  {
    name: 'gemini-1.5-pro',
    provider: 'google',
    capabilities: ['vision', 'text', 'fast', 'cheap'],
    costPerToken: 0.00375, // $0.00375 per 1K tokens
    maxTokens: 8192,
    avgResponseTime: 1500,
    visionSupport: true,
    kidFriendly: true
  },
  {
    name: 'gemini-1.5-flash',
    provider: 'google',
    capabilities: ['vision', 'text', 'fast', 'cheap'],
    costPerToken: 0.00075, // $0.00075 per 1K tokens
    maxTokens: 8192,
    avgResponseTime: 800,
    visionSupport: true,
    kidFriendly: false
  },
  // Anthropic models temporarily disabled - add when needed
  // {
  //   name: 'claude-3-sonnet-20240229',
  //   provider: 'anthropic',
  //   capabilities: ['vision', 'text', 'accurate', 'kidFriendly'],
  //   costPerToken: 0.008, // $0.008 per 1K tokens
  //   maxTokens: 4096,
  //   avgResponseTime: 2500,
  //   visionSupport: true,
  //   kidFriendly: true
  // },
  // {
  //   name: 'claude-3-haiku-20240307',
  //   provider: 'anthropic',
  //   capabilities: ['vision', 'text', 'fast', 'cheap'],
  //   costPerToken: 0.00025, // $0.00025 per 1K tokens
  //   maxTokens: 4096,
  //   avgResponseTime: 1000,
  //   visionSupport: true,
  //   kidFriendly: false
  // }
];

// LLM Request Parameters
export interface LLMParams {
  image?: string; // base64 encoded image
  prompt: string;
  budget: number; // Maximum cost in USD
  priority: 'speed' | 'accuracy' | 'cost';
  requiredCapabilities: ('vision' | 'text' | 'fast' | 'accurate' | 'cheap' | 'kidFriendly')[];
  maxTokens?: number;
  temperature?: number;
  recognitionId?: string;
}

// LLM Response
export interface LLMResult {
  content: string;
  model: string;
  provider: string;
  cost: number;
  responseTime: number;
  tokens: number;
  confidence?: number;
  error?: string;
}

// AI Router Class
export class AIRouter {
  private static instance: AIRouter;
  private models: AIModel[] = AI_MODELS;

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  async invokeLLM(params: LLMParams): Promise<LLMResult> {
    const startTime = Date.now();
    
    try {
      // 1. Select the best model based on requirements
      let selectedModel = this.selectModel(params);
      
      if (!selectedModel) {
        throw new Error(`No suitable model found for budget $${params.budget} and capabilities: ${params.requiredCapabilities.join(', ')}`);
      }

      logger.recognitionStep('ai_router_model_selected', {
        model: selectedModel.name,
        provider: selectedModel.provider,
        budget: params.budget,
        priority: params.priority,
        estimatedCost: this.estimateCost(selectedModel, params.prompt)
      }, { recognitionId: params.recognitionId });

      // 2. Try to call the selected model
      try {
        const result = await this.callModel(selectedModel, params);
        
        // 3. Calculate actual cost and response time
        const responseTime = Date.now() - startTime;
        const cost = this.calculateActualCost(selectedModel, result.tokens);
        
        logger.recognitionStep('ai_router_complete', {
          model: selectedModel.name,
          provider: selectedModel.provider,
          actualCost: cost,
          responseTime,
          tokens: result.tokens
        }, { recognitionId: params.recognitionId });

        return {
          ...result,
          model: selectedModel.name,
          provider: selectedModel.provider,
          cost,
          responseTime
        };

      } catch (modelError) {
        // If OpenAI fails with quota error, try Google models
        if (selectedModel.provider === 'openai' && 
            modelError instanceof Error && 
            modelError.message.includes('insufficient_quota')) {
          
          logger.recognitionStep('ai_router_fallback', {
            originalModel: selectedModel.name,
            reason: 'OpenAI quota exceeded, trying Google models'
          }, { recognitionId: params.recognitionId });

          // Try to find a Google model
          const googleModels = this.models.filter(m => m.provider === 'google' && 
            params.requiredCapabilities.every(cap => m.capabilities.includes(cap)));
          
          if (googleModels.length > 0) {
            const fallbackModel = googleModels[0]; // Use first available Google model
            if (!fallbackModel) {
              throw new Error('No fallback model available');
            }
            
            logger.recognitionStep('ai_router_model_selected', {
              model: fallbackModel.name,
              provider: fallbackModel.provider,
              budget: params.budget,
              priority: params.priority,
              estimatedCost: this.estimateCost(fallbackModel, params.prompt),
              fallback: true
            }, { recognitionId: params.recognitionId });

            const result = await this.callModel(fallbackModel, params);
            const responseTime = Date.now() - startTime;
            const cost = this.calculateActualCost(fallbackModel, result.tokens);
            
            logger.recognitionStep('ai_router_complete', {
              model: fallbackModel.name,
              provider: fallbackModel.provider,
              actualCost: cost,
              responseTime,
              tokens: result.tokens,
              fallback: true
            }, { recognitionId: params.recognitionId });

            return {
              ...result,
              model: fallbackModel.name,
              provider: fallbackModel.provider,
              cost,
              responseTime
            };
          }
        }
        
        // If fallback failed or not applicable, throw the original error
        throw modelError;
      }

    } catch (error) {
      logger.recognitionStep('ai_router_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budget: params.budget,
        priority: params.priority
      }, { recognitionId: params.recognitionId });

      throw error;
    }
  }

  private selectModel(params: LLMParams): AIModel | null {
    // Filter models by required capabilities
    let candidates = this.models.filter(model => 
      params.requiredCapabilities.every(cap => model.capabilities.includes(cap))
    );

    // Filter by budget
    candidates = candidates.filter(model => {
      const estimatedCost = this.estimateCost(model, params.prompt);
      return estimatedCost <= params.budget;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Sort by priority
    switch (params.priority) {
      case 'speed':
        return candidates.sort((a, b) => a.avgResponseTime - b.avgResponseTime)[0] || null;
      
      case 'accuracy':
        return candidates.sort((a, b) => {
          // Prefer models with 'accurate' capability
          const aAccurate = a.capabilities.includes('accurate') ? 1 : 0;
          const bAccurate = b.capabilities.includes('accurate') ? 1 : 0;
          if (aAccurate !== bAccurate) return bAccurate - aAccurate;
          // Then by cost (cheaper is better for accuracy)
          return a.costPerToken - b.costPerToken;
        })[0] || null;
      
      case 'cost':
        return candidates.sort((a, b) => a.costPerToken - b.costPerToken)[0] || null;
      
      default:
        return candidates[0] || null;
    }
  }

  private async callModel(model: AIModel, params: LLMParams): Promise<Omit<LLMResult, 'model' | 'provider' | 'cost' | 'responseTime'>> {
    switch (model.provider) {
      case 'openai':
        return await this.callOpenAI(model.name, params);
      case 'google':
        return await this.callGoogle(model.name, params);
      case 'anthropic':
        return await this.callAnthropic(model.name, params);
      default:
        throw new Error(`Unknown provider: ${model.provider}`);
    }
  }

  private async callOpenAI(model: string, params: LLMParams) {
    const messages: any[] = [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: params.prompt }
        ]
      }
    ];

    // Add image if provided
    if (params.image && messages[0]) {
      messages[0].content.push({
        type: 'image_url' as const,
        image_url: {
          url: `data:image/jpeg;base64,${params.image}`
        }
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: params.maxTokens || 1000,
        temperature: params.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || 0;

    return {
      content,
      tokens,
      confidence: this.extractConfidence(content)
    };
  }

  private async callGoogle(model: string, params: LLMParams) {
    const contents: any[] = [{
      parts: [
        { text: params.prompt }
      ]
    }];

    // Add image if provided
    if (params.image && contents[0]) {
      contents[0].parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: params.image
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: params.maxTokens || 1000,
          temperature: params.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokens = data.usageMetadata?.totalTokenCount || 0;

    return {
      content,
      tokens,
      confidence: this.extractConfidence(content)
    };
  }

  private async callAnthropic(model: string, params: LLMParams) {
    const messages: any[] = [{
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: params.prompt }
      ]
    }];

    // Add image if provided
    if (params.image && messages[0]) {
      messages[0].content.push({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg',
          data: params.image
        }
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens || 1000,
        temperature: params.temperature || 0.7,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const tokens = data.usage?.input_tokens + data.usage?.output_tokens || 0;

    return {
      content,
      tokens,
      confidence: this.extractConfidence(content)
    };
  }

  private estimateCost(model: AIModel, prompt: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    const estimatedTokens = Math.ceil(prompt.length / 4) + 1000; // Add buffer for response
    return (estimatedTokens / 1000) * model.costPerToken;
  }

  private calculateActualCost(model: AIModel, tokens: number): number {
    return (tokens / 1000) * model.costPerToken;
  }

  private extractConfidence(content: string): number {
    // Try to extract confidence from JSON responses
    try {
      const jsonMatch = content.match(/"confidence"\s*:\s*([0-9.]+)/);
      if (jsonMatch && jsonMatch[1]) {
        return parseFloat(jsonMatch[1]);
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }

    // Default confidence based on content quality
    if (content.length > 100 && content.includes('"')) {
      return 0.8; // Likely structured response
    } else if (content.length > 50) {
      return 0.6; // Basic response
    } else {
      return 0.3; // Short response
    }
  }
}

// Export singleton instance
export const aiRouter = AIRouter.getInstance();
