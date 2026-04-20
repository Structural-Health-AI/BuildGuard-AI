"""
Quick Model Retraining Script
Trains PyTorch damage detection model from training data
"""
import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from pathlib import Path
import json

def main():
    # Set seeds
    torch.manual_seed(42)
    import numpy as np
    np.random.seed(42)

    # Configuration
    CONFIG = {
        'image_size': 160,
        'batch_size': 64,
        'epochs': 30,
        'learning_rate': 0.001,
        'device': 'cuda' if torch.cuda.is_available() else 'cpu',
        'train_dir': str(Path(__file__).parent.parent / 'data/images/train'),
        'val_dir': str(Path(__file__).parent.parent / 'data/images/validation'),
        'model_save_path': str(Path(__file__).parent / 'saved_models/damage_detector_pytorch.pth'),
        'model_info_path': str(Path(__file__).parent / 'saved_models/damage_detector_pytorch_info.json'),
    }

    print(f"Device: {CONFIG['device']}")
    print(f"Train dir: {CONFIG['train_dir']}")
    print(f"Train dir exists: {os.path.exists(CONFIG['train_dir'])}")

    # Data transforms
    transform_train = transforms.Compose([
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.Resize((CONFIG['image_size'], CONFIG['image_size'])),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225])
    ])

    transform_val = transforms.Compose([
        transforms.Resize((CONFIG['image_size'], CONFIG['image_size'])),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225])
    ])

    # Load datasets
    print("\nLoading datasets...")
    train_dataset = datasets.ImageFolder(CONFIG['train_dir'], transform=transform_train)
    val_dataset = datasets.ImageFolder(CONFIG['val_dir'], transform=transform_val)

    train_loader = DataLoader(train_dataset, batch_size=CONFIG['batch_size'], shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=CONFIG['batch_size'], shuffle=False, num_workers=0)

    print(f"✓ Train samples: {len(train_dataset)}")
    print(f"✓ Val samples: {len(val_dataset)}")

    # Create model
    print("\nCreating model...")
    model = models.resnet50(pretrained=True)
    for param in model.parameters():
        param.requires_grad = False

    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, 2)
    )

    device = torch.device(CONFIG['device'])
    model = model.to(device)

    # Training setup
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=CONFIG['learning_rate'])
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)

    # Training loop
    best_val_acc = 0
    best_model_state = None

    print(f"\nTraining for {CONFIG['epochs']} epochs...\n")

    for epoch in range(CONFIG['epochs']):
        # Train
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
        
        train_loss /= len(train_loader)
        train_acc = 100 * train_correct / train_total
        
        # Validate
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_loss /= len(val_loader)
        val_acc = 100 * val_correct / val_total
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = model.state_dict().copy()
            status = "✓ BEST"
        else:
            status = ""
        
        print(f"Epoch {epoch+1}/{CONFIG['epochs']} | Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% {status}")
        
        scheduler.step(val_loss)

    # Save best model
    if best_model_state is not None:
        model.load_state_dict(best_model_state)

    print(f"\n✓ Saving model to {CONFIG['model_save_path']}")
    os.makedirs(os.path.dirname(CONFIG['model_save_path']), exist_ok=True)
    torch.save(model.state_dict(), CONFIG['model_save_path'])

    # Save model info
    info = {
        'accuracy': best_val_acc,
        'image_size': CONFIG['image_size'],
        'classes': ['damage', 'no_damage'],
        'trained_on': str(Path(CONFIG['train_dir']).parent)
    }
    with open(CONFIG['model_info_path'], 'w') as f:
        json.dump(info, f, indent=2)

    print(f"✓ Model info saved to {CONFIG['model_info_path']}")
    print(f"\n✅ Training complete! Best validation accuracy: {best_val_acc:.2f}%")

if __name__ == '__main__':
    main()
