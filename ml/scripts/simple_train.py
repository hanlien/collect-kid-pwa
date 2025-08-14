#!/usr/bin/env python3
"""
Simplified Training Script for Collect Kid PWA
This script trains a basic image classifier using local resources.
"""

import os
import json
import argparse
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
import pandas as pd

def load_label_map():
    """Load the label map from JSON file"""
    with open('ml/label_map.json', 'r') as f:
        return json.load(f)

def create_synthetic_dataset(label_map, num_samples_per_class=50):
    """Create a synthetic dataset for training"""
    print("🎨 Creating synthetic dataset...")
    
    classes = [cls for cls in label_map['classes'] if cls['id'] != 'mysterious']
    num_classes = len(classes)
    
    # Create synthetic images (colored rectangles with text)
    images = []
    labels = []
    
    for i, cls in enumerate(classes):
        print(f"  Creating {num_samples_per_class} samples for {cls['commonName']}")
        
        for j in range(num_samples_per_class):
            # Create a synthetic image (224x224 colored rectangle)
            img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
            
            # Add some variation
            if cls['category'] == 'flower':
                # Flowers are more colorful
                img = np.random.randint(100, 255, (224, 224, 3), dtype=np.uint8)
            elif cls['category'] == 'bug':
                # Bugs are darker
                img = np.random.randint(0, 150, (224, 224, 3), dtype=np.uint8)
            else:
                # Animals are brownish
                img = np.random.randint(50, 200, (224, 224, 3), dtype=np.uint8)
            
            images.append(img)
            labels.append(i)
    
    return np.array(images), np.array(labels), classes

def build_model(num_classes, input_shape=(224, 224, 3)):
    """Build a simple CNN model"""
    print("🏗️ Building model...")
    
    model = keras.Sequential([
        # Input layer
        layers.Input(shape=input_shape),
        
        # Convolutional layers
        layers.Conv2D(32, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(2),
        layers.BatchNormalization(),
        
        layers.Conv2D(64, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(2),
        layers.BatchNormalization(),
        
        layers.Conv2D(128, 3, activation='relu', padding='same'),
        layers.MaxPooling2D(2),
        layers.BatchNormalization(),
        
        layers.Conv2D(256, 3, activation='relu', padding='same'),
        layers.GlobalAveragePooling2D(),
        
        # Dense layers
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model

def train_model(model, train_images, train_labels, val_images, val_labels, epochs=10):
    """Train the model"""
    print("🚀 Starting training...")
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Add callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2),
        keras.callbacks.ModelCheckpoint(
            'ml/models/best_model.h5',
            save_best_only=True,
            monitor='val_accuracy'
        )
    ]
    
    # Train
    history = model.fit(
        train_images, train_labels,
        validation_data=(val_images, val_labels),
        epochs=epochs,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )
    
    return history

def convert_to_tflite(model, output_path):
    """Convert model to TFLite format"""
    print("📱 Converting to TFLite...")
    
    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    
    tflite_model = converter.convert()
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(tflite_model)
    
    print(f"✅ TFLite model saved to {output_path}")

def evaluate_model(model, test_images, test_labels, classes):
    """Evaluate the model"""
    print("📊 Evaluating model...")
    
    # Predictions
    predictions = model.predict(test_images)
    predicted_labels = np.argmax(predictions, axis=1)
    
    # Calculate metrics
    accuracy = np.mean(predicted_labels == test_labels)
    
    # Top-3 accuracy
    top3_accuracy = 0
    for i in range(len(test_labels)):
        top3_preds = np.argsort(predictions[i])[-3:]
        if test_labels[i] in top3_preds:
            top3_accuracy += 1
    top3_accuracy /= len(test_labels)
    
    print(f"📈 Top-1 Accuracy: {accuracy:.3f}")
    print(f"📈 Top-3 Accuracy: {top3_accuracy:.3f}")
    
    # Per-class accuracy
    print("\n📋 Per-class accuracy:")
    for i, cls in enumerate(classes):
        class_mask = test_labels == i
        if np.sum(class_mask) > 0:
            class_acc = np.mean(predicted_labels[class_mask] == test_labels[class_mask])
            print(f"  {cls['commonName']}: {class_acc:.3f}")
    
    return {
        'top1': float(accuracy),
        'top3': float(top3_accuracy),
        'ece': 0.08  # Placeholder
    }

def update_model_json(metrics, version='v001'):
    """Update model.json with new metrics"""
    print("📝 Updating model configuration...")
    
    model_config = {
        "version": version,
        "updated": "2024-01-15",
        "labelsSha256": "placeholder-sha256-hash",
        "thresholds": {
            "tau": 0.62,
            "margin": 0.08
        },
        "inputSize": [224, 224],
        "numClasses": 25,
        "provider": "local-training",
        "exportFormat": "tflite-fp16",
        "performance": metrics
    }
    
    with open('public/models/model.json', 'w') as f:
        json.dump(model_config, f, indent=2)
    
    print("✅ Model configuration updated")

def main():
    parser = argparse.ArgumentParser(description='Train Collect Kid species classifier')
    parser.add_argument('--epochs', type=int, default=10, help='Number of training epochs')
    parser.add_argument('--samples-per-class', type=int, default=50, help='Samples per class')
    parser.add_argument('--version', type=str, default='v001', help='Model version')
    
    args = parser.parse_args()
    
    print("🎯 Collect Kid - Simplified Training Pipeline")
    print("=" * 50)
    
    # Load label map
    label_map = load_label_map()
    print(f"📚 Loaded {len(label_map['classes'])} classes")
    
    # Create synthetic dataset
    images, labels, classes = create_synthetic_dataset(label_map, args.samples_per_class)
    
    # Split dataset
    train_images, temp_images, train_labels, temp_labels = train_test_split(
        images, labels, test_size=0.3, random_state=42, stratify=labels
    )
    val_images, test_images, val_labels, test_labels = train_test_split(
        temp_images, temp_labels, test_size=0.5, random_state=42, stratify=temp_labels
    )
    
    print(f"📊 Dataset split: {len(train_images)} train, {len(val_images)} val, {len(test_images)} test")
    
    # Build model
    model = build_model(len(classes))
    model.summary()
    
    # Train model
    history = train_model(model, train_images, train_labels, val_images, val_labels, args.epochs)
    
    # Evaluate model
    metrics = evaluate_model(model, test_images, test_labels, classes)
    
    # Convert to TFLite
    tflite_path = f'public/models/local_model_{args.version}.tflite'
    convert_to_tflite(model, tflite_path)
    
    # Update model configuration
    update_model_json(metrics, args.version)
    
    print("\n🎉 Training completed successfully!")
    print(f"📱 TFLite model: {tflite_path}")
    print(f"📊 Performance: Top-1 {metrics['top1']:.3f}, Top-3 {metrics['top3']:.3f}")

if __name__ == '__main__':
    main()
