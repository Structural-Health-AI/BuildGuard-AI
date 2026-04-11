# BuildGuard-AI

AI-powered Structural Health Monitoring and Damage Detection System with secure authentication and real-time analysis.

## Features

### Core Analysis
- **Sensor Data Analysis**: Classify structural health from accelerometer, strain, and temperature data
- **Image-based Damage Detection**: Detect cracks and damage from photographs using trained CNN
- **Report Management**: Create, manage, and track structural inspection reports
- **Real-time Dashboard**: Monitor analysis statistics and inspection history

### Security & Authentication
- **User Authentication**: Secure JWT-based login with refresh tokens
- **Password Reset**: Secure password reset with time-limited tokens
- **Rate Limiting**: Protect against brute force attacks (5 failed attempts per 15 min)
- **Protected Endpoints**: All API endpoints require authentication
- **Data Security**: Bcrypt password hashing + parameterized SQL queries

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python) |
| Frontend | React + Vite + TailwindCSS |
| ML Models | PyTorch + Scikit-learn |
| GPU Support | CUDA 11.8+ (optional) |
| Database | SQLite |

## Project Structure

```
BuildGuard-AI/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   ├── train_crack_detector.py # Model training script
│   ├── core/
│   │   ├── config.py           # Configuration settings
│   │   └── security.py         # JWT, hashing utilities
│   ├── models/
│   │   ├── image_model.py      # Image damage detector
│   │   └── sensor_model.py     # Sensor classifier
│   ├── api/
│   │   ├── auth_routes.py      # Authentication endpoints
│   │   ├── sensor_routes.py    # Sensor analysis endpoints
│   │   ├── image_routes.py     # Image analysis endpoints
│   │   ├── report_routes.py    # Report management endpoints
│   │   └── dependencies.py     # JWT dependency injection
│   ├── schemas/                # Pydantic request/response schemas
│   └── saved_models/           # Trained ML models (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VerifyEmailPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── services/           # API clients
│   │   │   └── authService.js
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   └── App.jsx
│   └── package.json
│
├── notebooks/                  # Jupyter notebooks for exploration
├── MODEL_TRAINING_GUIDE.md     # Model training documentation
├── SECURITY_AUDIT.md           # Security audit report
├── TESTING_GUIDE.md            # Comprehensive test cases
├── IMPLEMENTATION_SUMMARY.md   # Implementation overview
└── README.md                   # This file
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip and npm

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add:
# - SECRET_KEY (auto-generated in example)
# - FRONTEND_URL

# Run the server
python main.py
```

Backend will be available at http://localhost:8001
API docs at http://localhost:8001/docs

### Model Setup

**Important**: The PyTorch damage detection model (94.49 MB) is not included in the repository due to GitHub's file size limits.

#### Option 1: Download from GitHub Releases (Recommended)

```bash
# Download the model
wget https://github.com/Structural-Health-AI/BuildGuard-AI/releases/download/v1.0/damage_detector_pytorch.pth -O backend/saved_models/damage_detector_pytorch.pth

# On Windows, use:
# Invoke-WebRequest -Uri "https://github.com/Structural-Health-AI/BuildGuard-AI/releases/download/v1.0/damage_detector_pytorch.pth" -OutFile "backend/saved_models/damage_detector_pytorch.pth"
```

#### Option 2: Train Your Own Model

```bash
cd backend
python train_crack_detector.py
```

See [Training Models](#training-models) section for details.

#### Verify Model is Loaded

When you start the backend, you should see:
```
[OK] Loaded existing model from disk
✓ Model loaded successfully
  Model accuracy: 0.999675
  Image size: 160
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint (if needed)
# Edit .env and set VITE_API_URL=http://localhost:8001/api

# Run development server
npm run dev
```

Frontend will be available at http://localhost:5173

## Testing

### Manual Testing Workflow

1. **Register**: Visit http://localhost:5173/register, create account
2. **Login**: Use credentials to login
3. **Sensor Analysis**: Navigate to Sensor Analysis, enter accelerometer/strain/temperature data to test predictions
4. **Image Analysis**: Go to Image Analysis, upload structural photos to test crack detection:
   - Upload images with cracks/damage for "damage detected" predictions
   - Upload images without visible damage to test accuracy
5. **View Results**: See analysis results with confidence scores and recommendations
6. **Reports**: Create and manage inspection reports from analysis results

### API Testing

Use cURL or Postman to test endpoints. Example:

```bash
# Register
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Analyze image (use returned access_token)
curl -X POST http://localhost:8001/api/image/analyze \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@crack_image.jpg"
```

See `TESTING_GUIDE.md` for comprehensive test cases.

## API Endpoints

### Authentication (No token required)
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/refresh-token` - Refresh access token

### Sensor Analysis (Protected)
- `POST /api/sensor/predict` - Analyze sensor data
- `GET /api/sensor/history` - Get prediction history
- `GET /api/sensor/{prediction_id}` - Get specific prediction
- `DELETE /api/sensor/{prediction_id}` - Delete prediction

### Image Analysis (Protected)
- `POST /api/image/analyze` - Upload and analyze image
- `GET /api/image/history` - Get analysis history
- `GET /api/image/{analysis_id}` - Get specific analysis
- `DELETE /api/image/{analysis_id}` - Delete analysis

### Reports (Protected)
- `POST /api/reports/` - Create new report
- `GET /api/reports/` - List all reports
- `GET /api/reports/{id}` - Get specific report
- `PUT /api/reports/{id}` - Update report
- `DELETE /api/reports/{id}` - Delete report

### Dashboard (Protected)
- `GET /api/dashboard/stats` - Get dashboard statistics

## ML Models

### Sensor Classifier
- **Algorithm**: Random Forest
- **Features**: accel_x, accel_y, accel_z, strain, temperature
- **Classes**: Healthy, Minor Damage, Severe Damage
- **File**: `backend/saved_models/sensor_classifier.pkl`

### Crack Detection Model
- **Architecture**: ResNet50 Transfer Learning (pre-trained ImageNet)
- **Input**: 160×160 RGB images
- **Output**: Binary classification (damage detected / no damage)
- **Framework**: PyTorch
- **Training**: Data augmentation (rotation, flip, color jitter) + early stopping (patience=5)
- **Performance**: **99.97% validation accuracy** (trained on 80,000 images: 40K damage + 40K no-damage)
- **Parameters**: 24.6M total, ~4M trainable
- **Dataset Split**: 40K training / 40K validation
- **File**: `backend/saved_models/damage_detector_pytorch.pth` (94.49 MB)
- **Training Time**: ~45 minutes on GPU (CUDA 11.8)
- **Download**: See [Model Setup](#model-setup) section below

## Training Models

### Train Crack Detection Model (PyTorch)

To train the crack detection model using your own dataset:

```bash
cd backend

python train_crack_detector.py
```

This will:
- Load dataset from `data/images/` directory (organized by train/val and damage/no_damage)
- Train ResNet50 with transfer learning
- Save model to `backend/saved_models/damage_detector_pytorch.pth`
- Display accuracy metrics and training history visualizations

**Dataset Format**:
```
data/images/
├── train/
│   ├── damage/       # Images with damage/cracks
│   └── no_damage/    # Images without damage
└── validation/
    ├── damage/
    └── no_damage/
```

**Requirements**:
- Minimum 1,000 images per category (recommended 10,000+)
- JPG, JPEG, or PNG format
- Mixed lighting/angles for robust training

See `MODEL_TRAINING_GUIDE.md` and `notebooks/Image_Classification_PyTorch.ipynb` for detailed instructions.

## Datasets

### Sensor Data
- [Kaggle: Building Structural Health Sensor Dataset](https://www.kaggle.com/datasets/ziya07/building-structural-health-sensor-dataset)
- [Mendeley: Bridge Vibration Monitoring](https://data.mendeley.com/datasets/d3by55pjh7/2)

### Image Data (Crack Detection)
- [Kaggle: Concrete Crack Images for Classification](https://www.kaggle.com/datasets/arnavr10880/concrete-crack-images-for-classification) - 40K labeled images of concrete with/without cracks

**For training your own model**, organize images in the following structure:
```
data/images/
├── train/
│   ├── damage/       # 40,000 images with cracks/damage
│   └── no_damage/    # 40,000 images without damage
└── validation/
    ├── damage/       # 40,000 validation images with damage
    └── no_damage/    # 40,000 validation images without damage
```

Then use the Jupyter notebook (recommended) or run: `python train_crack_detector.py`

## Documentation

- **SECURITY_AUDIT.md** - Detailed security review
- **TESTING_GUIDE.md** - Manual and automated test cases
- **MODEL_TRAINING_GUIDE.md** - Model training documentation
- **IMPLEMENTATION_SUMMARY.md** - Implementation overview
- **notebooks/Image_Classification_PyTorch.ipynb** - Interactive training notebook with visualizations

## Model Performance

| Metric | Value |
|--------|-------|
| Architecture | ResNet50 Transfer Learning |
| Validation Accuracy | **99.97%** |
| Training Images | 40,000 (damage/no-damage binary) |
| Validation Images | 40,000 |
| Input Size | 160×160 pixels |
| Framework | PyTorch |
| GPU Training Time | ~45 minutes (CUDA 11.8) |
| Inference Time | ~50ms (GPU), ~200ms (CPU) |

## Model Download

The trained PyTorch model can be downloaded from:
- **GitHub Releases**: https://github.com/Structural-Health-AI/BuildGuard-AI/releases
- **Size**: 94.49 MB
- **Format**: PyTorch checkpoint (.pth)

Place in: `backend/saved_models/damage_detector_pytorch.pth`

## Contributing

Contributions are welcome! Please ensure you:
1. Train models locally and test thoroughly
2. Store large model files via GitHub Releases, not in git
3. Update model files separately using GitHub Releases
4. Document any new features in relevant markdown files
5. Test all endpoints before submitting changes

## Troubleshooting

### Model not loading
- Check if `damage_detector_pytorch.pth` exists in `backend/saved_models/`
- If missing, download from GitHub Releases or train your own model
- Ensure PyTorch is installed: `pip install torch torchvision`
- For GPU support (CUDA 11.8): `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118`
- Model will work with CPU but inference will be slower

### PyTorch import errors
- Reinstall dependencies: `pip install -r requirements.txt`
- Verify installation: `python -c "import torch; print(torch.__version__)"`

### Authentication errors
- Clear browser localStorage
- Check JWT token expiration (30 minutes default)
- Use refresh token endpoint to get new access token

## License

MIT