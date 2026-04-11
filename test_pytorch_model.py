#!/usr/bin/env python3
"""
Test script to verify PyTorch model integration
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from models.image_model import load_model, DAMAGE_CLASSES, IMG_SIZE

def test_model_loading():
    """Test that the model loads successfully"""
    print("=" * 70)
    print("Testing PyTorch Model Integration".center(70))
    print("=" * 70)
    
    print("\n1. Checking model file...")
    model_path = os.path.join("backend", "saved_models", "damage_detector_pytorch.pth")
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"   ✓ Model found: {model_path}")
        print(f"   ✓ Size: {size_mb:.2f} MB")
    else:
        print(f"   ✗ Model not found at {model_path}")
        return False
    
    print("\n2. Loading model...")
    model = load_model()
    if model is None:
        print("   ✗ Failed to load model")
        return False
    print("   ✓ Model loaded successfully")
    print(f"   ✓ Model type: {type(model).__name__}")
    
    print("\n3. Model Configuration:")
    print(f"   - Image size: {IMG_SIZE}×{IMG_SIZE}")
    print(f"   - Classes: {DAMAGE_CLASSES}")
    print(f"   - Total parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    print("\n4. Testing prediction with dummy image...")
    try:
        from PIL import Image
        import io
        
        # Create a simple dummy image
        dummy_img = Image.new('RGB', (160, 160), color='red')
        img_bytes = io.BytesIO()
        dummy_img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        from models.image_model import predict_image_damage
        damage_detected, damage_type, confidence, recommendations = predict_image_damage(img_bytes.getvalue())
        
        print("   ✓ Prediction successful!")
        print(f"   - Damage detected: {damage_detected}")
        print(f"   - Damage type: {damage_type}")
        print(f"   - Confidence: {confidence:.4f}")
        print(f"   - Recommendations: {len(recommendations)} items")
        
    except Exception as e:
        print(f"   ✗ Prediction failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 70)
    print("✓ All tests passed! Model is ready for deployment.".center(70))
    print("=" * 70)
    return True

if __name__ == "__main__":
    success = test_model_loading()
    sys.exit(0 if success else 1)
