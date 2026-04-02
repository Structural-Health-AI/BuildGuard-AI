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
| ML Models | TensorFlow/Keras + Scikit-learn |
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
- **Architecture**: MobileNetV2 Transfer Learning (pre-trained ImageNet)
- **Input**: 224×224 RGB images
- **Output**: Binary classification (damage detected / no damage)
- **Training**: Uses data augmentation (rotation, shift, flip, zoom) + early stopping
- **Performance**: 99.58% validation accuracy (trained on 40,000 images: 20K damage + 20K no-damage)
- **Dataset Split**: 32K training / 8K validation
- **File**: `backend/saved_models/damage_detector.h5`
- **Training Time**: ~1 hour on standard hardware

## Training Models

### Train Crack Detection Model

To train the crack detection model on your dataset:

```bash
cd backend

python train_crack_detector.py \
  --positive-dir "/path/to/Positive" \
  --negative-dir "/path/to/Negative"
```

**Parameters**:
- `--positive-dir`: Directory containing damage/crack images
- `--negative-dir`: Directory containing images without damage
- `--output-path`: Where to save the model (default: `backend/saved_models/damage_detector.h5`)

**Dataset format**: JPG, JPEG, or PNG images
**Recommended**: 50+ images per category for good results

See `MODEL_TRAINING_GUIDE.md` for detailed training instructions.

## Datasets

### Sensor Data
- [Kaggle: Building Structural Health Sensor Dataset](https://www.kaggle.com/datasets/ziya07/building-structural-health-sensor-dataset)
- [Mendeley: Bridge Vibration Monitoring](https://data.mendeley.com/datasets/d3by55pjh7/2)

### Image Data (Crack Detection)
- [Kaggle: Concrete Crack Images for Classification](https://www.kaggle.com/datasets/arnavr10880/concrete-crack-images-for-classification) - 40K labeled images of concrete with/without cracks

**For crack detection training**, organize images in two folders:
- `Positive/` - Images with cracks/damage
- `Negative/` - Images without damage

Then run: `python train_crack_detector.py --positive-dir Positive --negative-dir Negative`

## Documentation

- **SECURITY_AUDIT.md** - Detailed security review
- **TESTING_GUIDE.md** - Manual and automated test cases
- **MODEL_TRAINING_GUIDE.md** - Model training documentation
- **IMPLEMENTATION_SUMMARY.md** - Implementation overview

## Troubleshooting

### Model not loading
- Check if `.h5` file exists in `backend/saved_models/`
- Ensure TensorFlow version matches training version: `pip install tensorflow==2.15.0`
- If model config errors occur (e.g., "quantization_config"), rebuild model from architecture
- Run training: `python train_crack_detector.py --positive-dir ... --negative-dir ...`

### Authentication errors
- Clear browser localStorage
- Check JWT token expiration (30 minutes default)
- Use refresh token endpoint to get new access token

## License

MIT