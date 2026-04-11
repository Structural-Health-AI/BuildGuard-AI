import tensorflow as tf
import numpy as np
from PIL import Image
from pathlib import Path

print("Loading model...")
model = tf.keras.models.load_model('backend/saved_models/damage_detector.h5')
IMG_SIZE = (224, 224)

def test_images(folder, label, count=10):
    samples = list(Path(folder).glob('*.jpg'))[:count]
    
    print(f"\n{'='*80}")
    print(f"Testing {label} images from {folder}")
    print(f"{'='*80}")
    
    damage_as_damage = 0
    damage_as_nodamage = 0
    
    for idx, img_path in enumerate(samples, 1):
        img = Image.open(img_path).convert('RGB')
        img = img.resize(IMG_SIZE)
        img_array = np.array(img) / 255.0
        img_batch = np.expand_dims(img_array, axis=0)
        
        predictions = model.predict(img_batch, verbose=0)[0]
        class_idx = np.argmax(predictions)
        
        # Apply inverting logic
        if class_idx == 0:
            predicted_label = "NO DAMAGE"
        else:
            predicted_label = "DAMAGE"
        
        confidence = predictions[class_idx]
        
        # Track correctness
        if label == "DAMAGE" and predicted_label == "DAMAGE":
            damage_as_damage += 1
            status = "[OK]"
        elif label == "NO DAMAGE" and predicted_label == "NO DAMAGE":
            damage_as_damage += 1
            status = "[OK]"
        else:
            damage_as_nodamage += 1
            status = "[XX]"
        
        print(f"{status} Image {idx:2d}: Predicted={predicted_label:10s} | "
              f"Raw scores=[damage={predictions[0]:.4f}, no_damage={predictions[1]:.4f}] | "
              f"Confidence={confidence:.4f}")
    
    accuracy = damage_as_damage / (damage_as_damage + damage_as_nodamage) * 100
    print(f"\nResults: {damage_as_damage}/{damage_as_damage + damage_as_nodamage} correct ({accuracy:.1f}%)")
    
    return accuracy

# Test both folders with 10 samples each
damage_acc = test_images('backend/Positive', 'DAMAGE', 10)
nodamage_acc = test_images('backend/Negative', 'NO DAMAGE', 10)

print(f"\n{'='*80}")
print("SUMMARY")
print(f"{'='*80}")
print(f"Damage images correctly identified: {damage_acc:.1f}%")
print(f"No-damage images correctly identified: {nodamage_acc:.1f}%")

if damage_acc < 80 or nodamage_acc < 80:
    print("\n[WARN] Model confidence is LOW - predictions might be unreliable")
    print("This suggests the model wasn't trained well or data was imbalanced")
else:
    print("\n[OK] Model predictions are reliable")
