# Vertex AutoML Training Pipeline

This document describes how to train and deploy custom image classification models using Google Cloud Vertex AI AutoML.

## Prerequisites

1. **Google Cloud Project** with Vertex AI API enabled
2. **Service Account** with Vertex AI permissions
3. **Google Cloud Storage** bucket for dataset storage
4. **gcloud CLI** configured with your project

## Dataset Preparation

### 1. Prepare Dataset Structure

```bash
# Create dataset directory structure
mkdir -p ml/dataset/images
cd ml/dataset

# Your manifest.csv should be in ml/dataset/manifest.csv
# Images should be in ml/dataset/images/
```

### 2. Run Data Preparation Scripts

```bash
# Install Python dependencies
pip install pandas pillow imagehash

# Run deduplication
python ml/scripts/dedupe_hashes.py

# Prepare Vertex CSV
python ml/scripts/prepare_vertex_csv.py
```

### 3. Upload to Google Cloud Storage

```bash
# Set your bucket name
export GCS_BUCKET="your-project-dataset-bucket"

# Create bucket if it doesn't exist
gsutil mb gs://$GCS_BUCKET

# Upload images
gsutil -m cp ml/dataset/images/* gs://$GCS_BUCKET/images/

# Upload CSV
gsutil cp ml/dataset/vertex_dataset.csv gs://$GCS_BUCKET/
```

## Training with Vertex AutoML

### 1. Create Dataset

```bash
# Create dataset
gcloud ai datasets create \
  --display-name="collect-kid-species-v001" \
  --metadata-schema-uri="gs://google-cloud-aiplatform/schema/dataset/metadata/image_1.0.0.yaml"

# Get dataset ID
export DATASET_ID=$(gcloud ai datasets list --filter="display_name=collect-kid-species-v001" --format="value(name)")

# Import data
gcloud ai datasets import \
  --dataset=$DATASET_ID \
  --gcs-source-uris="gs://$GCS_BUCKET/vertex_dataset.csv" \
  --import-schema-uri="gs://google-cloud-aiplatform/schema/dataset/metadata/image_1.0.0.yaml"
```

### 2. Train Model

```bash
# Create training job
gcloud ai custom-jobs create \
  --display-name="collect-kid-species-training-v001" \
  --region="us-central1" \
  --worker-pool-spec="machine-type=n1-standard-4,replica-count=1,container-image-uri=gcr.io/cloud-aiplatform/training/tf-cpu.2-8:latest" \
  --args="--dataset-id=$DATASET_ID,--model-dir=gs://$GCS_BUCKET/models/v001"
```

### 3. Monitor Training

```bash
# Check training status
gcloud ai custom-jobs list --filter="display_name=collect-kid-species-training-v001"

# View logs
gcloud ai custom-jobs describe JOB_ID
```

## Model Export

### 1. Export TFLite Model

```bash
# Export model
gcloud ai models export \
  --model=MODEL_ID \
  --export-format=tflite \
  --output-dir=gs://$GCS_BUCKET/exports/v001
```

### 2. Download and Deploy

```bash
# Download TFLite model
gsutil cp gs://$GCS_BUCKET/exports/v001/model.tflite public/models/local_model_v001.tflite

# Update model.json
# Update version, thresholds, and performance metrics
```

## Evaluation

### 1. Run Evaluation

```bash
# Run evaluation script
python ml/scripts/eval_calibration.py \
  --model-path=public/models/local_model_v001.tflite \
  --test-data=ml/dataset/test_images/ \
  --output=ml/metrics/metrics_v001.json
```

### 2. Review Metrics

Check `ml/metrics/metrics_v001.json` for:
- Top-1 accuracy
- Top-3 accuracy  
- Expected Calibration Error (ECE)
- Per-class performance

## Deployment

### 1. Update Model Registry

```sql
-- Insert new model version
INSERT INTO model_registry (version, tflite_url, labels_sha256, metrics) 
VALUES (
  'v002', 
  '/models/local_model_v002.tflite',
  'new-sha256-hash',
  '{"top1": 0.87, "top3": 0.94, "ece": 0.06}'
);
```

### 2. Update Application

```bash
# Update model.json with new version
# Deploy new TFLite model to public/models/
# Update label_map.json if needed
```

## Rollback

If a new model version has issues:

```bash
# Revert model.json to previous version
git checkout HEAD~1 public/models/model.json

# Revert TFLite model
git checkout HEAD~1 public/models/local_model_v001.tflite

# Deploy rollback
git push origin main
```

## Troubleshooting

### Common Issues

1. **Out of Memory**: Reduce batch size or use smaller model
2. **Poor Accuracy**: Check class balance, add more training data
3. **Slow Inference**: Optimize model size, use quantization
4. **Export Failures**: Check model format compatibility

### Performance Tuning

1. **Threshold Tuning**: Adjust `tau` and `margin` in model.json
2. **Class Balance**: Ensure equal samples per class
3. **Data Quality**: Remove blurry, mislabeled images
4. **Model Size**: Balance accuracy vs. inference speed

## Cost Optimization

1. **Use Spot Instances** for training
2. **Schedule Training** during off-peak hours
3. **Monitor Usage** with Cloud Monitoring
4. **Set Budget Alerts** to avoid surprises

## Security

1. **Service Account Permissions**: Use least privilege
2. **Data Encryption**: Enable at-rest and in-transit
3. **Access Control**: Limit who can trigger training
4. **Audit Logs**: Monitor all operations
