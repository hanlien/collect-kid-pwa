#!/bin/bash

echo "🎯 Collect Kid - Simple Model Training"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

# Install required packages
echo "📦 Installing required packages..."
pip3 install tensorflow pillow numpy scikit-learn pandas

# Create models directory
mkdir -p ml/models
mkdir -p public/models

# Run training
echo "🚀 Starting training..."
python3 ml/scripts/simple_train.py --epochs 5 --samples-per-class 30

echo ""
echo "✅ Training completed!"
echo "📱 Your model is ready at: public/models/local_model_v001.tflite"
echo ""
echo "🎮 Now you can test the app with your new local model!"
