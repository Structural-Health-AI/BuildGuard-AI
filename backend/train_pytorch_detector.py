"""
PyTorch-based Crack Detection Model Training
Trains a ResNet50 model to detect structural damage from images
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from torchvision.datasets import ImageFolder
from pathlib import Path
import json
import argparse
from tqdm import tqdm
import numpy as np

# Settings
IMG_SIZE = 160
BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 0.001
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

print(f"Using device: {DEVICE}")


def prepare_data(positive_dir, negative_dir):
    """Prepare training data in proper directory structure"""
    # Create temp directory structure
    temp_dir = "temp_data"
    os.makedirs(os.path.join(temp_dir, 'train', 'damage'), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, 'train', 'no_damage'), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, 'val', 'damage'), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, 'val', 'no_damage'), exist_ok=True)
    
    # Copy images (80/20 train/val split)
    import shutil
    
    positive_images = list(Path(positive_dir).glob('*.jpg')) + \
                     list(Path(positive_dir).glob('*.jpeg')) + \
                     list(Path(positive_dir).glob('*.png'))
    negative_images = list(Path(negative_dir).glob('*.jpg')) + \
                     list(Path(negative_dir).glob('*.jpeg')) + \
                     list(Path(negative_dir).glob('*.png'))
    
    print(f"Found {len(positive_images)} positive (damage) images")
    print(f"Found {len(negative_images)} negative (no_damage) images")
    
    # Split 80/20
    split_idx_pos = int(0.8 * len(positive_images))
    split_idx_neg = int(0.8 * len(negative_images))
    
    train_positive = positive_images[:split_idx_pos]
    val_positive = positive_images[split_idx_pos:]
    train_negative = negative_images[:split_idx_neg]
    val_negative = negative_images[split_idx_neg:]
    
    # Copy files
    for img in train_positive:
        shutil.copy(img, os.path.join(temp_dir, 'train', 'damage', img.name))
    for img in val_positive:
        shutil.copy(img, os.path.join(temp_dir, 'val', 'damage', img.name))
    for img in train_negative:
        shutil.copy(img, os.path.join(temp_dir, 'train', 'no_damage', img.name))
    for img in val_negative:
        shutil.copy(img, os.path.join(temp_dir, 'val', 'no_damage', img.name))
    
    print(f"\nTraining samples: {len(train_positive)} damage, {len(train_negative)} no_damage")
    print(f"Validation samples: {len(val_positive)} damage, {len(val_negative)} no_damage")
    
    return temp_dir


def create_model():
    """Create ResNet50 model for binary classification"""
    model = models.resnet50(pretrained=True)
    
    # Freeze early layers
    for param in list(model.parameters())[:-20]:
        param.requires_grad = False
    
    # Replace final layer for binary classification
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, 2)  # 2 classes: damage, no_damage
    )
    
    return model.to(DEVICE)


def get_transforms():
    """Data augmentation and preprocessing"""
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomRotation(10),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    return train_transform, val_transform


def train_epoch(model, train_loader, criterion, optimizer):
    """Train for one epoch"""
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    
    pbar = tqdm(train_loader, desc="Training")
    for images, labels in pbar:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        _, predicted = torch.max(outputs.data, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()
        
        pbar.set_postfix({'loss': loss.item(), 'acc': 100*correct/total})
    
    return total_loss / len(train_loader), 100 * correct / total


def validate(model, val_loader, criterion):
    """Validate model"""
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for images, labels in tqdm(val_loader, desc="Validating"):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
    
    return total_loss / len(val_loader), 100 * correct / total


def main():
    parser = argparse.ArgumentParser(description='Train PyTorch crack detector')
    parser.add_argument('--positive-dir', required=True, help='Directory with damage images')
    parser.add_argument('--negative-dir', required=True, help='Directory with no-damage images')
    parser.add_argument('--output-dir', default='backend/saved_models', help='Output directory')
    args = parser.parse_args()
    
    # Prepare data
    print("Preparing data...")
    data_dir = prepare_data(args.positive_dir, args.negative_dir)
    
    # Create data loaders
    train_transform, val_transform = get_transforms()
    train_dataset = ImageFolder(os.path.join(data_dir, 'train'), transform=train_transform)
    val_dataset = ImageFolder(os.path.join(data_dir, 'val'), transform=val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4)
    
    # Create model
    print("Creating model...")
    model = create_model()
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', factor=0.5, patience=2)
    
    # Training loop
    best_val_loss = float('inf')
    best_accuracy = 0
    
    print(f"\nStarting training for {EPOCHS} epochs...")
    for epoch in range(EPOCHS):
        print(f"\nEpoch {epoch+1}/{EPOCHS}")
        
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = validate(model, val_loader, criterion)
        
        scheduler.step(val_loss)
        
        print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
        print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_accuracy:
            best_accuracy = val_acc
            best_val_loss = val_loss
            
            os.makedirs(args.output_dir, exist_ok=True)
            model_path = os.path.join(args.output_dir, 'damage_detector_pytorch.pth')
            torch.save(model.state_dict(), model_path)
            print(f"✓ Best model saved: {model_path} (Accuracy: {val_acc:.2f}%)")
            
            # Save metadata
            info = {
                'accuracy': val_acc,
                'image_size': IMG_SIZE,
                'epoch': epoch + 1,
                'architecture': 'ResNet50',
                'classes': ['damage', 'no_damage']
            }
            info_path = os.path.join(args.output_dir, 'damage_detector_pytorch_info.json')
            with open(info_path, 'w') as f:
                json.dump(info, f, indent=2)
    
    print(f"\n✓ Training complete!")
    print(f"Best Validation Accuracy: {best_accuracy:.2f}%")
    
    # Cleanup
    import shutil
    shutil.rmtree(data_dir)
    print(f"Cleaned up temporary data directory")


if __name__ == '__main__':
    main()
