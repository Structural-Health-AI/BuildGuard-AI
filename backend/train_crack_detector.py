"""
Train crack detection model on Positive/Negative datasets
Usage: python train_crack_detector.py --positive-dir <path> --negative-dir <path>
"""

import os
import argparse
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import shutil
from sklearn.model_selection import train_test_split

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# Settings
IMG_SIZE = 224
BATCH_SIZE = 64
EPOCHS = 20
LEARNING_RATE = 0.001

def prepare_directories(positive_dir, negative_dir, temp_dir):
    """Prepare directory structure for flow_from_directory"""

    # Convert to absolute paths
    positive_dir = os.path.abspath(positive_dir)
    negative_dir = os.path.abspath(negative_dir)
    temp_dir = os.path.abspath(temp_dir)

    # Create temp directory structure
    os.makedirs(os.path.join(temp_dir, 'train', 'damage'), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, 'train', 'no_damage'), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, 'val', 'damage'), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, 'val', 'no_damage'), exist_ok=True)

    # Get all image files
    positive_images = list(Path(positive_dir).glob('*.jpg')) + \
                     list(Path(positive_dir).glob('*.jpeg')) + \
                     list(Path(positive_dir).glob('*.png'))
    negative_images = list(Path(negative_dir).glob('*.jpg')) + \
                     list(Path(negative_dir).glob('*.jpeg')) + \
                     list(Path(negative_dir).glob('*.png'))

    print(f"Found {len(positive_images)} positive (damage) images")
    print(f"Found {len(negative_images)} negative (no damage) images")

    # Split into train/val (80/20)
    pos_train, pos_val = train_test_split(positive_images, test_size=0.2, random_state=42)
    neg_train, neg_val = train_test_split(negative_images, test_size=0.2, random_state=42)

    print(f"Train: {len(pos_train)} damage + {len(neg_train)} no_damage")
    print(f"Val: {len(pos_val)} damage + {len(neg_val)} no_damage")

    # Copy files to temp directories with validation
    print("Organizing files for training...")

    def safe_copy(img_path, dest_dir):
        """Copy file with error handling"""
        try:
            if not os.path.exists(img_path):
                print(f"  ⚠️  Skipping missing file: {img_path}")
                return False
            shutil.copy(img_path, os.path.join(dest_dir, os.path.basename(img_path)))
            return True
        except Exception as e:
            print(f"  ⚠️  Failed to copy {img_path}: {e}")
            return False

    copied = 0
    for img_path in pos_train:
        if safe_copy(img_path, os.path.join(temp_dir, 'train', 'damage')):
            copied += 1
    for img_path in pos_val:
        if safe_copy(img_path, os.path.join(temp_dir, 'val', 'damage')):
            copied += 1
    for img_path in neg_train:
        if safe_copy(img_path, os.path.join(temp_dir, 'train', 'no_damage')):
            copied += 1
    for img_path in neg_val:
        if safe_copy(img_path, os.path.join(temp_dir, 'val', 'no_damage')):
            copied += 1

    total_files = len(pos_train) + len(pos_val) + len(neg_train) + len(neg_val)
    skipped = total_files - copied
    if skipped > 0:
        print(f"✓ Copied {copied}/{total_files} files (skipped {skipped} corrupted/inaccessible)")
    else:
        print(f"✓ Copied {copied} files successfully")

    return temp_dir

def create_model(num_classes=2):
    """Create transfer learning model using MobileNetV2"""

    # Load pre-trained MobileNetV2
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )

    # Freeze base model layers
    base_model.trainable = False

    # Add custom classification head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    outputs = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=outputs)

    # Compile
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model

def train_crack_detector(positive_dir, negative_dir, output_path):
    """Train the crack detection model"""

    print("\n" + "="*60)
    print("CRACK DETECTION MODEL TRAINING")
    print("="*60)

    # Create temp directory for organized data
    temp_dir = 'training_data_temp'
    prepare_directories(positive_dir, negative_dir, temp_dir)

    # Create data generators with augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        fill_mode='nearest'
    )

    val_datagen = ImageDataGenerator(rescale=1./255)

    # Load data from directories
    print("\nCreating data generators...")
    train_generator = train_datagen.flow_from_directory(
        os.path.join(temp_dir, 'train'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    val_generator = val_datagen.flow_from_directory(
        os.path.join(temp_dir, 'val'),
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    # Create model
    print("Creating model...")
    model = create_model(num_classes=2)

    print("Model Summary:")
    model.summary()

    # Train
    print("\nTraining model...")
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=3,
            restore_best_weights=True,
            verbose=1
        ),
        ModelCheckpoint(
            output_path,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        )
    ]

    steps_per_epoch = len(train_generator)
    validation_steps = len(val_generator)

    history = model.fit(
        train_generator,
        steps_per_epoch=steps_per_epoch,
        validation_data=val_generator,
        validation_steps=validation_steps,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1
    )

    # Plot training history
    print("\nGenerating training history plot...")
    plt.figure(figsize=(12, 4))

    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.title('Model Loss')

    plt.subplot(1, 2, 2)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Val Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.title('Model Accuracy')

    plt.tight_layout()
    plot_path = output_path.replace('.h5', '_history.png')
    plt.savefig(plot_path)
    print(f"Training history saved to: {plot_path}")

    # Cleanup
    print("\nCleaning up temporary files...")
    shutil.rmtree(temp_dir, ignore_errors=True)

    print(f"\n✅ Model saved to: {output_path}")
    print("="*60 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train crack detection model')
    parser.add_argument('--positive-dir', required=True, help='Path to positive samples (damage/cracks)')
    parser.add_argument('--negative-dir', required=True, help='Path to negative samples (no damage)')
    parser.add_argument('--output-path', default='backend/saved_models/damage_detector.h5', help='Output model path')

    args = parser.parse_args()

    # Create output directory
    os.makedirs(os.path.dirname(args.output_path), exist_ok=True)

    # Train
    train_crack_detector(args.positive_dir, args.negative_dir, args.output_path)
