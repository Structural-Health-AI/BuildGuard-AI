from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DamageLevel(str, Enum):
    HEALTHY = "healthy"
    MINOR_DAMAGE = "minor_damage"
    SEVERE_DAMAGE = "severe_damage"


# Sensor Data Schemas
class SensorDataInput(BaseModel):
    accel_x: float = Field(..., ge=-10, le=10, description="X-axis acceleration")
    accel_y: float = Field(..., ge=-10, le=10, description="Y-axis acceleration")
    accel_z: float = Field(..., ge=-15, le=15, description="Z-axis acceleration")
    strain: float = Field(..., ge=0, le=1000, description="Strain gauge reading")
    temperature: float = Field(..., ge=-50, le=100, description="Temperature in Celsius")
    building_name: Optional[str] = Field(None, max_length=100, description="Building name")
    location: Optional[str] = Field(None, max_length=100, description="Location")

    @field_validator('building_name', 'location')
    @classmethod
    def sanitize_text(cls, v):
        """Remove potentially harmful characters"""
        if v is None:
            return v
        # Allow alphanumeric, spaces, hyphens, and common punctuation
        import re
        sanitized = re.sub(r'[<>\"\'%;()&+]', '', v)
        return sanitized.strip()


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
