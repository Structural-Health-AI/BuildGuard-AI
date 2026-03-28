# BuildGuard-AI

AI-powered Structural Health Monitoring and Damage Detection System

## Features

- **Sensor Data Analysis**: Classify structural health from accelerometer, strain, and temperature data
- **Image-based Damage Detection**: Detect cracks, spalling, corrosion, and deformation from images
- **Report Management**: Create and manage structural inspection reports
- **Real-time Dashboard**: Monitor analysis statistics and recent activities

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
├── backend/                    # FastAPI Backend
│   ├── main.py                 # API entry point
│   ├── requirements.txt        # Python dependencies
│   ├── models/                 # ML model code
│   │   ├── sensor_model.py     # Sensor data classifier
│   │   └── image_model.py      # Image damage detector
│   ├── api/                    # API routes
│   │   ├── sensor_routes.py
│   │   ├── image_routes.py
│   │   └── report_routes.py
│   └── schemas/                # Pydantic schemas
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── api/                # API client
│   │   └── App.jsx
│   └── package.json
│
├── notebooks/                  # Jupyter Notebooks
│   ├── 01_sensor_data_exploration.ipynb
│   └── 02_image_cnn_training.ipynb
│
└── data/                       # Datasets (gitignored)
    ├── sensor/
    └── images/
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

# Run the server
uvicorn main:app --reload
```

Backend will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at http://localhost:5173

## API Endpoints

### Sensor Analysis
- `POST /api/sensor/predict` - Analyze sensor data
- `GET /api/sensor/history` - Get prediction history

### Image Analysis
- `POST /api/image/analyze` - Upload and analyze image
- `GET /api/image/history` - Get analysis history

### Reports
- `POST /api/reports/` - Create new report
- `GET /api/reports/` - List all reports
- `GET /api/reports/{id}` - Get specific report

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## ML Models

### Sensor Classifier
- Algorithm: Random Forest
- Features: accel_x, accel_y, accel_z, strain, temperature
- Classes: Healthy, Minor Damage, Severe Damage

### Image Damage Detector
- Architecture: MobileNetV2 (Transfer Learning)
- Input: 224x224 RGB images
- Classes: No Damage, Crack, Spalling, Corrosion, Structural Deformation

## Training Models

Run the Jupyter notebooks to train models with your data:

```bash
cd notebooks
jupyter notebook
```

1. `01_sensor_data_exploration.ipynb` - Train sensor classifier
2. `02_image_cnn_training.ipynb` - Train image CNN

## Datasets

Download and place datasets in the `data/` folder:
- [Kaggle: Building Structural Health Sensor Dataset](https://www.kaggle.com/datasets/ziya07/building-structural-health-sensor-dataset)
- [Mendeley: Bridge Vibration Monitoring](https://data.mendeley.com/datasets/d3by55pjh7/2)

## License

MIT