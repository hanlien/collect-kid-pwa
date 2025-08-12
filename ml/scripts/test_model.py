#!/usr/bin/env python3
"""
Test script for the trained local ML model
"""

import os
import json
import numpy as np
import tensorflow as tf
from PIL import Image
import time

def load_model_and_config():
    """Load the trained model and configuration"""
    print("🔍 Loading model and configuration...")
    
    # Load model configuration
    with open('public/models/model.json', 'r') as f:
        config = json.load(f)
    
    # Load label map
    with open('ml/label_map.json', 'r') as f:
        label_map = json.load(f)
    
    # Load the TFLite model
    interpreter = tf.lite.Interpreter(model_path='public/models/local_model_v001.tflite')
    interpreter.allocate_tensors()
    
    print(f"✅ Model loaded successfully")
    print(f"📊 Input size: {config['inputSize']}")
    print(f"🎯 Number of classes: {config['numClasses']}")
    
    return interpreter, config, label_map

def create_test_image(size=(224, 224), category='flower'):
    """Create a synthetic test image"""
    if category == 'flower':
        # Create a colorful flower-like image
        img = np.random.randint(100, 255, (size[0], size[1], 3), dtype=np.uint8)
        # Add some green in the center (like a flower center)
        center_x, center_y = size[0] // 2, size[1] // 2
        img[center_x-20:center_x+20, center_y-20:center_y+20] = [50, 150, 50]
    elif category == 'bug':
        # Create a darker bug-like image
        img = np.random.randint(0, 150, (size[0], size[1], 3), dtype=np.uint8)
    elif category == 'animal':
        # Create a brownish animal-like image
        img = np.random.randint(50, 200, (size[0], size[1], 3), dtype=np.uint8)
    else:
        # Random image
        img = np.random.randint(0, 255, (size[0], size[1], 3), dtype=np.uint8)
    
    return img

def preprocess_image(image, input_size):
    """Preprocess image for model input"""
    # Convert to float32 and normalize to [0, 1]
    image = image.astype(np.float32) / 255.0
    
    # Add batch dimension
    image = np.expand_dims(image, axis=0)
    
    return image

def run_inference(interpreter, image):
    """Run inference on the model"""
    # Get input and output details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Set input tensor
    interpreter.set_tensor(input_details[0]['index'], image)
    
    # Run inference
    start_time = time.time()
    interpreter.invoke()
    inference_time = time.time() - start_time
    
    # Get output
    output = interpreter.get_tensor(output_details[0]['index'])
    
    return output[0], inference_time

def get_top_predictions(probs, label_map, top_k=5):
    """Get top K predictions"""
    # Get classes excluding 'unknown'
    classes = [cls for cls in label_map['classes'] if cls['id'] != 'unknown']
    
    # Get top K indices
    top_indices = np.argsort(probs)[-top_k:][::-1]
    
    results = []
    for idx in top_indices:
        if idx < len(classes):
            class_info = classes[idx]
            results.append({
                'labelId': class_info['id'],
                'commonName': class_info['commonName'],
                'category': class_info['category'],
                'probability': float(probs[idx])
            })
    
    return results

def test_model():
    """Main test function"""
    print("🧪 Testing Local ML Model")
    print("=" * 50)
    
    # Load model and config
    interpreter, config, label_map = load_model_and_config()
    
    # Test with different categories
    test_categories = ['flower', 'bug', 'animal']
    
    for category in test_categories:
        print(f"\n🌺 Testing with {category} category...")
        
        # Create test image
        test_image = create_test_image(config['inputSize'], category)
        
        # Preprocess image
        processed_image = preprocess_image(test_image, config['inputSize'])
        
        # Run inference
        predictions, inference_time = run_inference(interpreter, processed_image)
        
        # Get top predictions
        top_predictions = get_top_predictions(predictions, label_map, 5)
        
        print(f"⏱️  Inference time: {inference_time:.3f}s")
        print(f"🎯 Top predictions:")
        
        for i, pred in enumerate(top_predictions):
            print(f"  {i+1}. {pred['commonName']} ({pred['category']}) - {pred['probability']:.3f}")
        
        # Check confidence
        if len(top_predictions) >= 2:
            p1, p2 = top_predictions[0]['probability'], top_predictions[1]['probability']
            tau = config['thresholds']['tau']
            margin = config['thresholds']['margin']
            
            is_confident = p1 >= tau and (p1 - p2) >= margin
            print(f"🎯 Confidence check: {is_confident} (p1={p1:.3f}, p2={p2:.3f}, tau={tau}, margin={margin})")
    
    print(f"\n✅ Model testing completed!")
    print(f"📊 Model performance from training:")
    print(f"  - Top-1 Accuracy: {config['performance']['top1']:.3f}")
    print(f"  - Top-3 Accuracy: {config['performance']['top3']:.3f}")

if __name__ == '__main__':
    test_model()
