# BuildGuard-AI

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-brightblue.svg)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-orange.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev/)

Structural health monitoring and damage detection system for building inspections. Uses sensor data analysis and deep learning image recognition to detect structural damage and assess building health in real-time.

## Features

- 🏗️ **Structural Health Monitoring**: Analyze sensor data for building integrity assessment
- 🔍 **Damage Detection**: Deep learning-based image classification for crack/damage detection
- 📊 **Real-time Dashboard**: Interactive visualization of inspection data and metrics
- 👤 **User Management**: Role-based access control with JWT authentication
- 📋 **Report Generation**: Automated inspection reports with findings and recommendations
- 🔒 **Enterprise Security**: Encrypted credentials, audit logging, CORS protection
- 🚀 **Production Ready**: Containerized, deployed on DigitalOcean with SSL/TLS

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python 3.10+) |
| Frontend | React 18 + Vite + TailwindCSS |
| Database | PostgreSQL (Supabase with connection pooling) |
| ML/AI | PyTorch, scikit-learn |
| Deployment | Docker, Nginx, PM2 |
| Cloud | DigitalOcean VPS |

## Quick Start

### Prerequisites

- Python 3.10+ and pip
- Node.js 18+ and npm
- Docker & Docker Compose (optional)
- PostgreSQL 13+ (or Supabase account)

### Local Development

**1. Clone repository**
```bash
git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git
cd BuildGuard-AI
```

**2. Backend setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env  # Configure environment variables
python main.py  # Runs on http://localhost:8000
```

**3. Frontend setup**
```bash
cd ../frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

**4. Database migration (optional)**
```bash
cd ../backend
python migrate_db.py  # Migrate schema
```

### Docker Deployment

```bash
docker-compose up -d  # Starts all services
# Frontend: http://localhost:8000
# API: http://localhost:8000/api
```

## Project Structure

```
BuildGuard-AI/
├── backend/                   # FastAPI application
│   ├── api/                  # Route handlers
│   │   ├── auth_routes.py
│   │   ├── image_routes.py
│   │   ├── sensor_routes.py
│   │   └── report_routes.py
│   ├── core/                 # Config & utilities
│   │   ├── config.py
│   │   ├── security.py
│   │   └── email.py
│   ├── models/               # ML inference
│   │   ├── image_model.py
│   │   └── sensor_model.py
│   ├── schemas/              # Pydantic models
│   ├── saved_models/         # Trained ML models (gitignored)
│   ├── main.py               # FastAPI entry point
│   ├── database.py           # DB initialization
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API clients
│   │   ├── context/         # React Context
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── data/                     # Datasets (gitignored)
│   ├── sensor/
│   └── images/
│
├── notebooks/               # Jupyter notebooks (gitignored)
│
├── scripts/                 # Utilities
│   ├── deployment/
│   │   ├── docker-compose.yml
│   │   └── nginx.conf
│   └── database/
│       └── migrate_db.py
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .github/                 # GitHub workflows (optional)
│
├── .gitignore
├── .dockerignore
├── Dockerfile
├── Dockerfile.frontend
├── docker-compose.yml
├── package.json
├── package-lock.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login with JWT |
| POST | `/api/auth/verify-email` | Verify email address |
| POST | `/api/auth/forgot-password` | Request password reset |
| GET | `/api/health` | Health check endpoint |
| POST | `/api/images/upload` | Upload and analyze damage image |
| POST | `/api/sensors/analyze` | Analyze sensor data |
| GET | `/api/reports` | List inspection reports |
| GET | `/api/reports/{id}` | Get specific report |
| DELETE | `/api/reports/{id}` | Delete report |

See [docs/API.md](docs/API.md) for full API documentation.

## Configuration

Create `backend/.env`:
```env
# Database (Supabase Shared Pooler recommended)
DATABASE_URL=postgresql://postgres.xxxx:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# Security
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
ALLOWED_ORIGINS=https://www.build-guard.app,http://localhost:5173,http://localhost:8000
ENVIRONMENT=production

# Email (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@build-guard.app

# ML Models
MODEL_PATH=./saved_models/damage_detector_pytorch.pth
```

Create `frontend/.env`:
```env
VITE_API_URL=https://www.build-guard.app/api
VITE_ENV=production
```

## ML Model Training

To train custom damage detection models:

```bash
cd backend
python train_pytorch_detector.py \
  --data-path ../data/images/ \
  --epochs 50 \
  --batch-size 32 \
  --learning-rate 0.001
```

## Testing

```bash
# Backend tests
cd backend
pytest test_*.py -v

# Frontend tests
cd ../frontend
npm test

# Integration tests
cd ../backend
pytest tests/integration/ -v
```

## Deployment

### DigitalOcean VPS (Production)

```bash
# SSH into server
ssh root@your_server_ip

# Clone & setup
git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git
cd BuildGuard-AI

# Install dependencies
docker-compose up -d

# Setup SSL with Let's Encrypt
certbot certonly --standalone -d www.build-guard.app

# Restart with updated config
docker-compose restart
```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security

- ✅ JWT token authentication with expiration
- ✅ Password hashing with bcrypt (salt rounds: 12)
- ✅ CORS protection with allowed origins
- ✅ SQL injection prevention via Pydantic models
- ✅ XSS protection with Content-Security-Policy headers
- ✅ HTTPS/TLS encryption in production
- ✅ Secrets stored in environment variables (never committed)
- ✅ Audit logging for sensitive operations
- ✅ Rate limiting on authentication endpoints
- ✅ Database connection pooling for performance

Security audit details: [backend/SECURITY.md](backend/SECURITY.md)

## Performance

| Metric | Target | Status |
|--------|--------|--------|
| API response time (p95) | < 500ms | ✓ |
| Image inference | 2-3 seconds | ✓ |
| Dashboard load | < 2 seconds | ✓ |
| Database queries | < 100ms | ✓ (with pooling) |
| Uptime | 99.5% | ✓ |

## Troubleshooting

**Backend won't start?**
```bash
# Check database connection
cd backend
python -c "from core.config import settings; print(settings.database_url)"
```

**CORS errors on frontend?**
```bash
# Verify ALLOWED_ORIGINS includes your domain
ssh root@your_server "cat /root/BuildGuard-AI/backend/.env | grep ALLOWED_ORIGINS"
```

**Port already in use?**
```bash
# Find & kill process (Linux/Mac)
lsof -i :8000 | grep -v PID | awk '{print $2}' | xargs kill -9

# Or (Windows)
netstat -ano | findstr :8000 | awk '{print $5}' | xargs taskkill /PID /F
```

**Database connection issues?**
```bash
# Test connection string
python -c "import psycopg2; psycopg2.connect('${DATABASE_URL}')"
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test locally
4. Commit with clear messages: `git commit -m "Add: detailed description"`
5. Push to branch: `git push origin feature/your-feature`
6. Open a pull request with description

### Code Style

- **Python**: Follow PEP 8 with Black formatter
- **JavaScript**: Follow ESLint config in `frontend/`
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard with ML predictions
- [ ] Multi-model ensemble for improved damage detection
- [ ] Export reports as PDF with charts
- [ ] Integration with third-party inspection management systems
- [ ] Real-time notifications for critical findings
- [ ] Multi-language support

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Contact

- **Issues & Bug Reports**: [GitHub Issues](https://github.com/Structural-Health-AI/BuildGuard-AI/issues)
- **Email**: support@build-guard.app
- **Documentation**: [docs/](docs/)
- **Live Site**: [www.build-guard.app](https://www.build-guard.app)

## Authors & Contributors

**Project Lead**
- Development Team

**Contributors**
- [Add contributors here]

---

**Status**: ✅ Production Ready  
**Last Updated**: April 2026  
**Version**: 1.0.0

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