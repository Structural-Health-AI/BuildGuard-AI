import tensorflow as tf
import numpy as np
from PIL import Image
from pathlib import Path

# Load model
print("Loading model...")
model = tf.keras.models.load_model('backend/saved_models/damage_detector.h5')
IMG_SIZE = (224, 224)

# Test with images from both folders
positive_sample = list(Path('backend/Positive').glob('*.jpg'))[0]
negative_sample = list(Path('backend/Negative').glob('*.jpg'))[0]

def test_image(img_path, label):
    img = Image.open(img_path).convert('RGB')
    img = img.resize(IMG_SIZE)
    img_array = np.array(img) / 255.0
    img_batch = np.expand_dims(img_array, axis=0)
    
    predictions = model.predict(img_batch, verbose=0)[0]
    class_idx = np.argmax(predictions)
    
    print(f"\n{label}: {img_path.name}")
    print(f"  Raw outputs: damage={predictions[0]:.4f}, no_damage={predictions[1]:.4f}")
    print(f"  Predicted class: {class_idx} ({'damage' if class_idx == 0 else 'no_damage'})")
    print(f"  Confidence: {predictions[class_idx]:.4f}")

print("\n" + "="*70)
print("TESTING MODEL PREDICTIONS")
print("="*70)

test_image(positive_sample, "POSITIVE FOLDER (should predict damage)")
test_image(negative_sample, "NEGATIVE FOLDER (should predict no_damage)")

print("\n" + "="*70)
print("Analysis:")
print("="*70)
print("If both predict the same class, the model is not trained properly.")
print("If Positive predicts 'damage' and Negative predicts 'no_damage', model is good.")
