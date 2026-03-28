from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DamageLevel(str, Enum):
    HEALTHY = "healthy"
    MINOR_DAMAGE = "minor_damage"
    SEVERE_DAMAGE = "severe_damage"


# Sensor Data Schemas
class SensorDataInput(BaseModel):
    accel_x: float
    accel_y: float
    accel_z: float
    strain: float
    temperature: float
    building_name: Optional[str] = None
    location: Optional[str] = None


class SensorPredictionResponse(BaseModel):
    id: Optional[int] = None
    damage_level: DamageLevel
    confidence: float
    timestamp: datetime
    recommendations: List[str]
    input_data: SensorDataInput


# Image Analysis Schemas
class ImageAnalysisResponse(BaseModel):
    id: Optional[int] = None
    damage_detected: bool
    damage_type: Optional[str] = None
    confidence: float
    timestamp: datetime
    image_path: str
    recommendations: List[str]


# Report Schemas
class ReportCreate(BaseModel):
    building_name: str
    location: str
    inspector_name: str
    description: Optional[str] = None
    sensor_prediction_id: Optional[int] = None
    image_analysis_id: Optional[int] = None


class ReportResponse(BaseModel):
    id: int
    building_name: str
    location: str
    inspector_name: str
    description: Optional[str]
    sensor_prediction_id: Optional[int]
    image_analysis_id: Optional[int]
    overall_status: DamageLevel
    created_at: datetime
    updated_at: datetime


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int


# Dashboard Statistics
class DashboardStats(BaseModel):
    total_reports: int
    total_sensor_analyses: int
    total_image_analyses: int
    healthy_count: int
    minor_damage_count: int
    severe_damage_count: int
    recent_analyses: List[dict]
