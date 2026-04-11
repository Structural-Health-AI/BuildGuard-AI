"""
PyTorch-based Image Classification Model Training
Binary Classification: Damage vs No Damage
Uses ResNet50 with transfer learning and early stopping
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import confusion_matrix, accuracy_score, classification_report
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import json
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================
CONFIG = {
    'image_size': 160,
    'batch_size': 64,
    'epochs': 30,
    'learning_rate': 0.001,
    'early_stopping_patience': 5,
    'train_dir': 'data/images/train',
    'val_dir': 'data/images/validation',
    'model_save_path': 'backend/saved_models/damage_detector_pytorch.pth',
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',
}

print("=" * 70)
print("PyTorch Image Classification Training")
print("=" * 70)
print(f"\nConfiguration:")
print(f"  Image Size: {CONFIG['image_size']}×{CONFIG['image_size']}")
print(f"  Batch Size: {CONFIG['batch_size']}")
print(f"  Epochs: {CONFIG['epochs']}")
print(f"  Learning Rate: {CONFIG['learning_rate']}")
print(f"  Early Stopping Patience: {CONFIG['early_stopping_patience']}")
print(f"  Device: {CONFIG['device'].upper()}")
print(f"  Model Save Path: {CONFIG['model_save_path']}")
print("=" * 70 + "\n")

# ============================================================================
# DATA LOADING AND PREPROCESSING
# ============================================================================
def get_data_loaders():
    """Load training and validation data with augmentation"""
    
    # Training transformations (with augmentation)
    train_transforms = transforms.Compose([
        transforms.Resize((CONFIG['image_size'], CONFIG['image_size'])),
        transforms.RandomRotation(20),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])
    
    # Validation transformations (no augmentation)
    val_transforms = transforms.Compose([
        transforms.Resize((CONFIG['image_size'], CONFIG['image_size'])),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])
    
    # Load datasets
    train_dataset = datasets.ImageFolder(
        root=CONFIG['train_dir'],
        transform=train_transforms
    )
    
    val_dataset = datasets.ImageFolder(
        root=CONFIG['val_dir'],
        transform=val_transforms
    )
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=CONFIG['batch_size'],
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=CONFIG['batch_size'],
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )
    
    return train_loader, val_loader, train_dataset.classes


# ============================================================================
# MODEL SETUP
# ============================================================================
def create_model(num_classes=2):
    """Create ResNet50 with custom classifier head"""
    
    # Load pretrained ResNet50
    model = models.resnet50(pretrained=True)
    
    # Freeze backbone layers
    for param in model.parameters():
        param.requires_grad = False
    
    # Replace classification head
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes)
    )
    
    # Unfreeze last layer of backbone for fine-tuning
    for param in model.layer4.parameters():
        param.requires_grad = True
    
    return model


# ============================================================================
# TRAINING LOOP
# ============================================================================
class EarlyStopping:
    """Early stopping to prevent overfitting"""
    
    def __init__(self, patience=5):
        self.patience = patience
        self.counter = 0
        self.best_loss = None
        self.best_epoch = 0
    
    def __call__(self, val_loss, epoch):
        if self.best_loss is None:
            self.best_loss = val_loss
            self.best_epoch = epoch
        elif val_loss < self.best_loss:
            self.best_loss = val_loss
            self.counter = 0
            self.best_epoch = epoch
        else:
            self.counter += 1
        
        return self.counter >= self.patience


def train_one_epoch(model, train_loader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for batch_idx, (images, labels) in enumerate(train_loader):
        images = images.to(device)
        labels = labels.to(device)
        
        # Forward pass
        outputs = model(images)
        loss = criterion(outputs, labels)
        
        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        # Statistics
        running_loss += loss.item()
        _, predicted = torch.max(outputs.data, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()
        
        if (batch_idx + 1) % 10 == 0:
            print(f"  Batch {batch_idx + 1}/{len(train_loader)}: "
                  f"Loss = {loss.item():.4f}")
    
    epoch_loss = running_loss / len(train_loader)
    epoch_acc = 100 * correct / total
    
    return epoch_loss, epoch_acc


def validate(model, val_loader, criterion, device):
    """Validate model on validation set"""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    epoch_loss = running_loss / len(val_loader)
    epoch_acc = 100 * correct / total
    
    return epoch_loss, epoch_acc, all_preds, all_labels


def train_model(model, train_loader, val_loader, num_epochs=30):
    """Main training loop"""
    
    device = torch.device(CONFIG['device'])
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=CONFIG['learning_rate']
    )
    
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode='min',
        factor=0.5,
        patience=3,
        verbose=True
    )
    
    early_stopping = EarlyStopping(patience=CONFIG['early_stopping_patience'])
    
    # Storage for history
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': [],
    }
    
    best_model_state = None
    best_val_acc = 0
    
    print("Starting training...\n")
    
    for epoch in range(num_epochs):
        print(f"Epoch {epoch + 1}/{num_epochs}")
        print("-" * 50)
        
        # Train
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device
        )
        
        # Validate
        val_loss, val_acc, _, _ = validate(
            model, val_loader, criterion, device
        )
        
        # Store history
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.2f}%")
        print()
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = model.state_dict().copy()
            print(f"✓ Best model saved (Val Acc: {val_acc:.2f}%)\n")
        
        # Learning rate scheduling
        scheduler.step(val_loss)
        
        # Early stopping
        if early_stopping(val_loss, epoch):
            print(f"\n✓ Early stopping triggered at epoch {epoch + 1}")
            print(f"  Best epoch: {early_stopping.best_epoch + 1}")
            break
    
    # Restore best model
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
    
    return model, history


# ============================================================================
# EVALUATION AND VISUALIZATION
# ============================================================================
def evaluate_model(model, val_loader, classes):
    """Evaluate model and generate metrics"""
    
    device = torch.device(CONFIG['device'])
    model = model.to(device)
    model.eval()
    
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    # Metrics
    accuracy = accuracy_score(all_labels, all_preds)
    cm = confusion_matrix(all_labels, all_preds)
    
    print("\n" + "=" * 70)
    print("EVALUATION RESULTS")
    print("=" * 70)
    print(f"\nOverall Accuracy: {accuracy*100:.2f}%\n")
    
    print("Confusion Matrix:")
    print(cm)
    print()
    
    print("Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=classes))
    
    return accuracy, cm, all_labels, all_preds


def plot_training_history(history):
    """Plot training history"""
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Loss plot
    axes[0].plot(history['train_loss'], label='Training Loss')
    axes[0].plot(history['val_loss'], label='Validation Loss')
    axes[0].set_title('Model Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].legend()
    axes[0].grid(True)
    
    # Accuracy plot
    axes[1].plot(history['train_acc'], label='Training Accuracy')
    axes[1].plot(history['val_acc'], label='Validation Accuracy')
    axes[1].set_title('Model Accuracy')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Accuracy (%)')
    axes[1].legend()
    axes[1].grid(True)
    
    plt.tight_layout()
    plt.savefig('training_history_pytorch.png', dpi=100)
    print("\n✓ Training history plot saved as 'training_history_pytorch.png'")
    plt.show()


def plot_confusion_matrix(cm, classes):
    """Plot confusion matrix"""
    
    fig, ax = plt.subplots(figsize=(8, 6))
    
    im = ax.imshow(cm, cmap='Blues')
    
    # Set ticks and labels
    ax.set_xticks(np.arange(len(classes)))
    ax.set_yticks(np.arange(len(classes)))
    ax.set_xticklabels(classes)
    ax.set_yticklabels(classes)
    
    # Rotate the tick labels
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    
    # Add text annotations
    for i in range(len(classes)):
        for j in range(len(classes)):
            text = ax.text(j, i, cm[i, j], ha="center", va="center", 
                         color="white" if cm[i, j] > cm.max() / 2 else "black")
    
    ax.set_ylabel('True Label')
    ax.set_xlabel('Predicted Label')
    ax.set_title('Confusion Matrix')
    
    plt.tight_layout()
    plt.savefig('confusion_matrix_pytorch.png', dpi=100)
    print("✓ Confusion matrix saved as 'confusion_matrix_pytorch.png'")
    plt.show()


# ============================================================================
# MAIN
# ============================================================================
def main():
    """Main training pipeline"""
    
    # Create directories
    os.makedirs(os.path.dirname(CONFIG['model_save_path']), exist_ok=True)
    
    # Load data
    print("Loading datasets...")
    train_loader, val_loader, classes = get_data_loaders()
    print(f"Classes: {classes}")
    print(f"Training samples: {len(train_loader.dataset)}")
    print(f"Validation samples: {len(val_loader.dataset)}\n")
    
    # Create model
    print("Creating model...")
    model = create_model(num_classes=len(classes))
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}\n")
    
    # Train model
    model, history = train_model(
        model,
        train_loader,
        val_loader,
        num_epochs=CONFIG['epochs']
    )
    
    # Save model
    torch.save(model.state_dict(), CONFIG['model_save_path'])
    print(f"✓ Model saved to: {CONFIG['model_save_path']}")
    
    # Evaluate
    accuracy, cm, labels, preds = evaluate_model(model, val_loader, classes)
    
    # Plot results
    plot_training_history(history)
    plot_confusion_matrix(cm, classes)
    
    # Save config
    config_save_path = CONFIG['model_save_path'].replace('.pth', '_config.json')
    with open(config_save_path, 'w') as f:
        json.dump({
            'classes': classes,
            'image_size': CONFIG['image_size'],
            'accuracy': float(accuracy),
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    print(f"✓ Config saved to: {config_save_path}")
    
    print("\n" + "=" * 70)
    print("Training Complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
