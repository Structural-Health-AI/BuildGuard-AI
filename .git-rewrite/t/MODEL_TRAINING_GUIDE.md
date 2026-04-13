# Crack Detection Model Training Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Train the Model

Using your local datasets:
```bash
python train_crack_detector.py \
  --positive-dir "C:/Users/dipen/Downloads/Positive" \
  --negative-dir "C:/Users/dipen/Downloads/Negative"
```

The script will:
- Load all images from both directories
- Split into train (70%) / validation (15%) / test (15%)
- Train using MobileNetV2 transfer learning (50 epochs max with early stopping)
- Evaluate on test set
- Save model to `backend/saved_models/damage_detector.h5`
- Create training history plot

### 3. Test the Trained Model

Once trained, the image analysis endpoint will automatically use the trained model:

```bash
# Start backend server
python main.py
```

Then upload an image via the API:
```bash
curl -X POST "http://localhost:8001/api/image/analyze" \
  -H "Authorization: Bearer <your_access_token>" \
  -F "file=@test_crack_image.jpg"
```

## Training Details

### Model Architecture
- **Base**: MobileNetV2 (pre-trained on ImageNet)
- **Custom head**: GlobalAveragePooling2D → Dense(128, relu) → Dropout(0.3) → Dense(2, softmax)
- **Input size**: 224×224 RGB images
- **Output classes**: 2 (no_damage, crack)

### Hyperparameters
- **Batch size**: 32
- **Learning rate**: 0.001
- **Max epochs**: 50 (with early stopping if no improvement for 5 epochs)
- **Optimizer**: Adam
- **Loss function**: Categorical crossentropy

### Dataset Requirements
- **Positive folder**: Images with cracks/damage
- **Negative folder**: Images without damage
- **Format**: .jpg, .jpeg, or .png
- **Recommended**: 50+ images per class for good results

### Output

After training, you'll get:
```
backend/saved_models/
  ├── damage_detector.h5          # Trained model (binary classifier)
  └── damage_detector_history.png # Training history plot
```

## Predictions

The trained model will predict:
- **Class 0 (no_damage)**: No visible damage
- **Class 1 (crack)**: Damage/cracks detected

With confidence scores (0-1) for each prediction.

## Tips for Better Results

1. **More data**: Collect more representative images (100+ per class)
2. **Balance**: Keep positive/negative samples balanced
3. **Variety**: Ensure images cover different angles, lighting, and damage types
4. **Quality**: Remove blurry or corrupted images
5. **Fine-tuning**: After initial training, unfreeze some base model layers and train longer for better accuracy

## Troubleshooting

### Out of Memory Error
- Reduce BATCH_SIZE in the training script
- Use a GPU if available (CUDA)

### Poor Accuracy
- Check image quality
- Ensure clear damage/no-damage distinction
- Collect more training data
- Increase epochs

### Model Not Loading
- Check the model file exists: `backend/saved_models/damage_detector.h5`
- Ensure TensorFlow is installed: `pip install tensorflow==2.15.0`
