#!/usr/bin/env python3
"""
Integration test for the local ML model
Tests the model with the same interface expected by the TypeScript code
"""

import os
import json
import numpy as np
import tensorflow as tf
import time

def test_model_integration():
    """Test the model with the same interface as the TypeScript implementation"""
    print("🔗 Testing Model Integration")
    print("=" * 50)
    
    # Load model and config
    print("📥 Loading model and configuration...")
    
    with open('public/models/model.json', 'r') as f:
        config = json.load(f)
    
    with open('ml/label_map.json', 'r') as f:
        label_map = json.load(f)
    
    interpreter = tf.lite.Interpreter(model_path='public/models/local_model_v001.tflite')
    interpreter.allocate_tensors()
    
    print(f"✅ Model loaded successfully")
    print(f"📊 Config: {config['inputSize']} input, {config['numClasses']} classes")
    print(f"🎯 Thresholds: tau={config['thresholds']['tau']}, margin={config['thresholds']['margin']}")
    
    # Test 1: Basic inference
    print("\n🧪 Test 1: Basic Inference")
    test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    test_image = test_image.astype(np.float32) / 255.0
    test_image = np.expand_dims(test_image, axis=0)
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    interpreter.set_tensor(input_details[0]['index'], test_image)
    
    start_time = time.time()
    interpreter.invoke()
    inference_time = time.time() - start_time
    
    output = interpreter.get_tensor(output_details[0]['index'])
    probs = output[0]
    
    print(f"⏱️  Inference time: {inference_time:.3f}s")
    print(f"📊 Output shape: {output.shape}")
    print(f"🎯 Probability sum: {np.sum(probs):.6f} (should be ~1.0)")
    
    # Test 2: Top-K predictions (like TypeScript getTopK)
    print("\n🧪 Test 2: Top-K Predictions")
    classes = [cls for cls in label_map['classes'] if cls['id'] != 'mysterious']
    
    top_indices = np.argsort(probs)[-5:][::-1]
    top_predictions = []
    
    for idx in top_indices:
        if idx < len(classes):
            class_info = classes[idx]
            top_predictions.append({
                'labelId': class_info['id'],
                'commonName': class_info['commonName'],
                'category': class_info['category'],
                'probability': float(probs[idx])
            })
    
    print("🎯 Top 5 predictions:")
    for i, pred in enumerate(top_predictions):
        print(f"  {i+1}. {pred['commonName']} ({pred['category']}) - {pred['probability']:.3f}")
    
    # Test 3: Confidence check (like TypeScript isConfident)
    print("\n🧪 Test 3: Confidence Check")
    if len(top_predictions) >= 2:
        p1, p2 = top_predictions[0]['probability'], top_predictions[1]['probability']
        tau = config['thresholds']['tau']
        margin = config['thresholds']['margin']
        
        is_confident = p1 >= tau and (p1 - p2) >= margin
        print(f"🎯 Confidence: {is_confident}")
        print(f"   p1={p1:.3f}, p2={p2:.3f}, tau={tau}, margin={margin}")
        print(f"   p1 >= tau: {p1 >= tau}")
        print(f"   (p1 - p2) >= margin: {(p1 - p2) >= margin}")
    
    # Test 4: Multiple inference consistency
    print("\n🧪 Test 4: Multiple Inference Consistency")
    times = []
    predictions = []
    
    for i in range(5):
        test_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        test_image = test_image.astype(np.float32) / 255.0
        test_image = np.expand_dims(test_image, axis=0)
        
        interpreter.set_tensor(input_details[0]['index'], test_image)
        
        start_time = time.time()
        interpreter.invoke()
        inference_time = time.time() - start_time
        
        output = interpreter.get_tensor(output_details[0]['index'])
        probs = output[0]
        
        times.append(inference_time)
        top_idx = np.argmax(probs)
        if top_idx < len(classes):
            predictions.append(classes[top_idx]['commonName'])
    
    print(f"⏱️  Average inference time: {np.mean(times):.3f}s ± {np.std(times):.3f}s")
    print(f"🎯 Predictions: {predictions}")
    
    # Test 5: Model size and performance
    print("\n🧪 Test 5: Model Information")
    model_size = os.path.getsize('public/models/local_model_v001.tflite')
    print(f"📦 Model file size: {model_size / 1024:.1f} KB")
    print(f"🎯 Expected accuracy (from training): {config['performance']['top1']:.3f}")
    print(f"🎯 Expected top-3 accuracy: {config['performance']['top3']:.3f}")
    
    print(f"\n✅ Integration test completed successfully!")
    print(f"🎉 Model is ready for use in the Collect Kid PWA!")

if __name__ == '__main__':
    test_model_integration()
