# Setup Guide

## Local Development Environment

Complete setup instructions for BuildGuard-AI development.

## Prerequisites

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 13+** or Supabase account - [Supabase](https://supabase.com)
- **Git** - [Download](https://git-scm.com/)
- **Docker** (optional) - [Download](https://docker.com/)

---

## Step 1: Clone Repository

```bash
git clone https://github.com/Structural-Health-AI/BuildGuard-AI.git
cd BuildGuard-AI
```

---

## Step 2: Backend Setup

### Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create `backend/.env`:

```bash
# Database Configuration
# Option 1: Local PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/buildguard_db

# Option 2: Supabase (recommended for shared development)
DATABASE_URL=postgresql://postgres.project_id:password@db.supabase.co:5432/postgres

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development

# Email (optional, for password reset)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password

# Logging
LOG_LEVEL=DEBUG
```

### Setup Database

```bash
# Run migrations (if using SQLAlchemy)
python migrate_db.py

# Or using Alembic (if configured)
alembic upgrade head

# Test connection
python test_db.py
```

### Run Backend Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode (for local testing)
uvicorn main:app --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`

**API Documentation** (interactive): `http://localhost:8000/docs`

---

## Step 3: Frontend Setup

### Install Dependencies

```bash
cd ../frontend
npm install
```

### Configure Environment Variables

Create `frontend/.env`:

```bash
# API URL pointing to backend
VITE_API_URL=http://localhost:8000/api

# Environment
VITE_ENV=development

# Optional: API timeout (milliseconds)
VITE_API_TIMEOUT=30000
```

### Run Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## Step 4: Database Setup

### Option A: Local PostgreSQL

#### Install PostgreSQL

- **Windows**: [PostgreSQL Download](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE buildguard_db;
CREATE USER buildguard_user WITH PASSWORD 'your_password';
ALTER ROLE buildguard_user SET client_encoding TO 'utf8';
ALTER ROLE buildguard_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE buildguard_user SET default_transaction_deferrable TO on;
ALTER ROLE buildguard_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE buildguard_db TO buildguard_user;
\q
```

#### Update DATABASE_URL

```bash
DATABASE_URL=postgresql://buildguard_user:your_password@localhost:5432/buildguard_db
```

### Option B: Supabase (Cloud PostgreSQL)

1. Sign up at [Supabase](https://supabase.com)
2. Create new project
3. Copy connection string from **Settings > Database**
4. Update `DATABASE_URL` in backend/.env:

```bash
DATABASE_URL=postgresql://postgres.project_id:password@db.supabase.co:5432/postgres
```

**Advantages**:
- No local setup required
- Shared across team
- Built-in backups
- Real-time features available

---

## Step 5: Model Training (Optional)

### PyTorch Damage Detector

```bash
cd backend
python train_pytorch_detector.py

# Or with custom parameters
python train_pytorch_detector.py --epochs 50 --batch-size 32 --learning-rate 0.001
```

**Output**: `saved_models/damage_detector_pytorch.pth`

### Sensor Anomaly Detector

```bash
python train_crack_detector.py
```

---

## Step 6: Pre-commit Hooks (Optional but Recommended)

Automatically run checks before committing code.

### Install Pre-commit

```bash
pip install pre-commit
pre-commit install
```

### Configured Checks

- Python formatting (Black)
- Linting (Flake8)
- Type checking (Mypy)
- Security scanning (Bandit)

---

## Step 7: Run Tests

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=api --cov=models --cov=core

# Run specific test file
pytest test_db.py -v
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run end-to-end tests (Cypress)
npm run test:e2e
```

---

## Step 8: Docker Setup (Optional)

### Build Docker Images

```bash
# Build backend
docker build -t buildguard-backend:latest -f Dockerfile .

# Build frontend
docker build -t buildguard-frontend:latest -f Dockerfile.frontend .
```

### Run with Docker Compose

```bash
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Common Issues & Solutions

### Issue: ModuleNotFoundError

```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Database Connection Error

```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
python -c "import psycopg2; psycopg2.connect('YOUR_DATABASE_URL')"

# For Supabase, ensure using correct endpoint
# Should be: db.supabase.co (not db-xxx.supabase.co)
```

### Issue: Port Already in Use

```bash
# Find process using port 8000 (backend)
lsof -i :8000

# Find process using port 5173 (frontend)
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different port
uvicorn main:app --port 8001
```

### Issue: CORS Errors

```bash
# Ensure frontend URL is in ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Restart backend after updating .env
```

### Issue: Dependencies Conflict

```bash
# Clear pip cache
pip cache purge

# Create fresh environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

```bash
# Backend changes
cd backend
# Edit files...

# Frontend changes
cd frontend
# Edit files...
```

### 3. Run Tests

```bash
# Backend
pytest

# Frontend
npm run test
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: your feature description"
```

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
# Open PR on GitHub
```

---

## Useful Commands

### Backend

```bash
# Run backend
uvicorn main:app --reload

# Database migration
python migrate_db.py

# Train model
python train_pytorch_detector.py

# Test database
python test_db.py

# Check code quality
flake8 api models core
black --check api models core
mypy api models core
```

### Frontend

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Linting
npm run lint

# Format code
npm run format
```

---

## IDE Setup

### VS Code

Recommended extensions:
- **Python**: ms-python.python
- **Pylance**: ms-python.vscode-pylance
- **ESLint**: dbaeumer.vscode-eslint
- **Prettier**: esbenp.prettier-vscode
- **Thunder Client**: rangav.vscode-thunder-client (API testing)

### PyCharm

- File > Settings > Project > Python Interpreter > Add Interpreter
- Select existing environment at `backend/venv`

---

## Project Structure

```
BuildGuard-AI/
├── backend/                 # FastAPI application
│   ├── api/                # Route handlers
│   ├── models/             # Data models
│   ├── core/               # Config, security, email
│   ├── schemas/            # Request/response schemas
│   ├── main.py            # Application entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # Business logic
│   │   └── App.jsx        # Main app component
│   └── package.json       # Node dependencies
├── data/                   # Training datasets
├── docs/                   # Documentation
├── scripts/                # Helper scripts
└── docker-compose.yml     # Container orchestration
```

---

## Next Steps

1. **Read the Architecture Guide**: [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Review API Documentation**: [API.md](./API.md)
3. **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Check the Main README**: [../README.md](../README.md)

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Questions?** Open an issue on GitHub or check troubleshooting section
