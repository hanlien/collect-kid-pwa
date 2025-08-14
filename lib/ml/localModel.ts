import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

export interface LocalModelResult {
  labelId: string;
  probs: number[];
  topK: Array<{ labelId: string; prob: number }>;
  inferenceTime: number;
}

export interface ModelConfig {
  version: string;
  tau: number;
  margin: number;
  inputSize: [number, number];
  numClasses: number;
}

class LocalModel {
  private model: tf.GraphModel | null = null;
  private config: ModelConfig | null = null;
  private labelMap: any = null;
  private _isLoaded = false;
  private isLoading = false;

  async load(): Promise<void> {
    if (this._isLoaded || this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Load model configuration
      const configResponse = await fetch('/models/model.json');
      this.config = await configResponse.json();
      
      // Load label map
      const labelMapResponse = await fetch('/ml/label_map.json');
      this.labelMap = await labelMapResponse.json();
      
      // Load TFLite model
      this.model = await tf.loadGraphModel('/models/local_model_v001.tflite');
      
      // Warm up the model
      if (this.config && this.config.inputSize) {
        const dummyInput = tf.zeros([1, ...this.config.inputSize, 3]);
        await this.model.predict(dummyInput);
        dummyInput.dispose();
      }
      
      this._isLoaded = true;
      console.log('✅ Local model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load local model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async infer(imageData: ImageData | HTMLImageElement): Promise<LocalModelResult> {
    if (!this._isLoaded || !this.model || !this.config || !this.config.inputSize) {
      throw new Error('Model not loaded or config invalid');
    }

    const startTime = performance.now();

    try {
      // Preprocess image
      let tensor: tf.Tensor3D;
      
      if (imageData instanceof ImageData) {
        tensor = tf.browser.fromPixels(imageData);
      } else {
        tensor = tf.browser.fromPixels(imageData);
      }

      // Resize to model input size
      const resized = tf.image.resizeBilinear(tensor, this.config.inputSize);
      
      // Normalize to [0, 1]
      const normalized = resized.div(255.0);
      
      // Add batch dimension
      const batched = normalized.expandDims(0);
      
      // Run inference
      const predictions = this.model!.predict(batched) as tf.Tensor;
      const probs = await predictions.data();
      
      // Get top K predictions
      const topK = this.getTopK(probs, 5);
      
      // Cleanup tensors
      tensor.dispose();
      resized.dispose();
      normalized.dispose();
      batched.dispose();
      predictions.dispose();
      
      const inferenceTime = performance.now() - startTime;
      
      return {
        labelId: topK[0]?.labelId || '',
        probs: Array.from(probs),
        topK,
        inferenceTime
      };
    } catch (error) {
      console.error('❌ Inference failed:', error);
      throw error;
    }
  }

  private getTopK(probs: Float32Array | Uint8Array | Int32Array, k: number): Array<{ labelId: string; prob: number }> {
    const floatProbs = Array.from(probs).map(p => typeof p === 'number' ? p : 0);
    const indexed = floatProbs.map((prob, index) => ({ prob, index }));
    indexed.sort((a, b) => b.prob - a.prob);
    
    return indexed.slice(0, k).map(({ prob, index }) => ({
      labelId: this.labelMap?.classes?.[index]?.id || 'unknown',
      prob
    }));
  }

  isConfident(result: LocalModelResult): boolean {
    if (!this.config) return false;
    
    const { tau, margin } = this.config;
    const [p1, p2] = result.topK.slice(0, 2).map(r => r.prob);
    
    return (p1 || 0) >= tau && ((p1 || 0) - (p2 || 0)) >= margin;
  }

  getCategory(labelId: string): string {
    const classInfo = this.labelMap.classes.find((c: any) => c.id === labelId);
    return classInfo?.category || 'unknown';
  }

  getLabelInfo(labelId: string) {
    return this.labelMap.classes.find((c: any) => c.id === labelId);
  }

  isLoaded(): boolean {
    return this._isLoaded;
  }
}

// Singleton instance
export const localModel = new LocalModel();
