"""
Report Management API Routes
Endpoints for creating and managing structural health reports
"""
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from schemas.schemas import ReportCreate, ReportResponse, ReportListResponse, DamageLevel
from models.user_model import User, Report, SensorPrediction, ImageAnalysis
from core.config import get_settings
from database import get_db
from api.dependencies import get_current_user, get_current_user_optional

router = APIRouter()
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)


def determine_overall_status(sensor_prediction_id: int = None, image_analysis_id: int = None, db: Session = None) -> str:
    """Determine overall status based on sensor and image analysis results"""
    if db is None:
        return "healthy"  # Default if no database session
    
    statuses = []

    if sensor_prediction_id:
        sensor = db.query(SensorPrediction).filter(
            SensorPrediction.id == sensor_prediction_id
        ).first()
        if sensor:
            statuses.append(sensor.damage_level)

    if image_analysis_id:
        image = db.query(ImageAnalysis).filter(
            ImageAnalysis.id == image_analysis_id
        ).first()
        if image:
            if image.damage_detected:
                damage_type = image.damage_type
                if damage_type == "structural_deformation":
                    statuses.append("severe_damage")
                elif damage_type in ["crack", "spalling", "corrosion"]:
                    statuses.append("minor_damage")
            else:
                statuses.append("healthy")

    # Return worst status
    if "severe_damage" in statuses:
        return "severe_damage"
    elif "minor_damage" in statuses:
        return "minor_damage"
    elif statuses:
        return "healthy"
    else:
        return "healthy"  # Default if no analysis linked


@router.post("/", response_model=ReportResponse)
@limiter.limit("15/minute")
async def create_report(
    request: Request,
    report: ReportCreate,
    user_id: str | None = None,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Create a new structural health report
    
    Authentication is optional. If no user is authenticated, report is created under device session ID.

    Link sensor predictions and/or image analyses to create a comprehensive report.
    """
    try:
        # Priority: explicit query user_id -> request query param -> authenticated user -> anonymous
        effective_user_id = (
            user_id
            or request.query_params.get("user_id")
            or (str(current_user.id) if current_user else "anonymous")
        )
        
        # Determine overall status from linked analyses
        overall_status = determine_overall_status(
            report.sensor_prediction_id,
            report.image_analysis_id,
            db
        )

        # Use SQLAlchemy ORM instead of direct SQL
        from models.user_model import Report
        
        db_report = Report(
            user_id=effective_user_id,
            building_name=report.building_name,
            location=report.location,
            inspector_name=report.inspector_name,
            description=report.description,
            sensor_prediction_id=report.sensor_prediction_id,
            image_analysis_id=report.image_analysis_id,
            overall_status=overall_status
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)

        return ReportResponse(
            id=db_report.id,
            building_name=db_report.building_name,
            location=db_report.location,
            inspector_name=db_report.inspector_name,
            description=db_report.description,
            sensor_prediction_id=db_report.sensor_prediction_id,
            image_analysis_id=db_report.image_analysis_id,
            overall_status=DamageLevel(overall_status),
            created_at=db_report.created_at,
            updated_at=db_report.updated_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")


@router.get("/", response_model=ReportListResponse)
@limiter.limit("30/minute")
async def list_reports(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get all reports for the authenticated user with pagination. Authentication is optional."""
    from models.user_model import Report
    
    # Get user_id from authenticated user or query parameter
    user_id = str(current_user.id) if current_user else request.query_params.get("user_id", "anonymous")
    
    # Get total count for user
    total = db.query(Report).filter(Report.user_id == user_id).count()

    # Get paginated results for user
    db_reports = db.query(Report).filter(
        Report.user_id == user_id
    ).order_by(Report.created_at.desc()).offset(skip).limit(limit).all()

    reports = []
    for report in db_reports:
        reports.append(ReportResponse(
            id=report.id,
            building_name=report.building_name,
            location=report.location,
            inspector_name=report.inspector_name,
            description=report.description,
            sensor_prediction_id=report.sensor_prediction_id,
            image_analysis_id=report.image_analysis_id,
            overall_status=DamageLevel(report.overall_status),
            created_at=report.created_at,
            updated_at=report.updated_at
        ))

    return ReportListResponse(reports=reports, total=total)


@router.get("/{report_id}", response_model=dict)
@limiter.limit("60/minute")
async def get_report(
    request: Request,
    report_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get a specific report with all linked analyses. Authentication is optional."""
    from models.user_model import Report, SensorPrediction, ImageAnalysis
    
    user_id = str(current_user.id) if current_user else request.query_params.get("user_id", "anonymous")
    
    # Get the report and verify it belongs to the user
    db_report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == user_id
    ).first()

    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    report = {
        'id': db_report.id,
        'building_name': db_report.building_name,
        'location': db_report.location,
        'inspector_name': db_report.inspector_name,
        'description': db_report.description,
        'sensor_prediction_id': db_report.sensor_prediction_id,
        'image_analysis_id': db_report.image_analysis_id,
        'overall_status': db_report.overall_status,
        'created_at': db_report.created_at.isoformat() if db_report.created_at else None,
        'updated_at': db_report.updated_at.isoformat() if db_report.updated_at else None
    }

    # Get linked sensor prediction
    if db_report.sensor_prediction_id:
        sensor = db.query(SensorPrediction).filter(
            SensorPrediction.id == db_report.sensor_prediction_id
        ).first()
        if sensor:
            report['sensor_prediction'] = {
                'id': sensor.id,
                'damage_level': sensor.damage_level,
                'confidence': sensor.confidence,
                'recommendations': sensor.recommendations,
                'created_at': sensor.created_at.isoformat() if sensor.created_at else None
            }

    # Get linked image analysis
    if db_report.image_analysis_id:
        image = db.query(ImageAnalysis).filter(
            ImageAnalysis.id == db_report.image_analysis_id
        ).first()
        if image:
            report['image_analysis'] = {
                'id': image.id,
                'damage_detected': bool(image.damage_detected),
                'damage_type': image.damage_type,
                'confidence': image.confidence,
                'recommendations': image.recommendations,
                'created_at': image.created_at.isoformat() if image.created_at else None
            }

    return report


@router.put("/{report_id}", response_model=ReportResponse)
@limiter.limit("15/minute")
async def update_report(
    request: Request,
    report_id: int,
    report: ReportCreate,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Update an existing report. Authentication is optional."""
    from models.user_model import Report
    
    user_id = str(current_user.id) if current_user else request.query_params.get("user_id", "anonymous")
    
    # Check if report exists and belongs to the authenticated user
    db_report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == user_id
    ).first()
    
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Determine new overall status
    overall_status = determine_overall_status(
        report.sensor_prediction_id,
        report.image_analysis_id,
        db
    )

    # Update the report
    db_report.building_name = report.building_name
    db_report.location = report.location
    db_report.inspector_name = report.inspector_name
    db_report.description = report.description
    db_report.sensor_prediction_id = report.sensor_prediction_id
    db_report.image_analysis_id = report.image_analysis_id
    db_report.overall_status = overall_status
    
    db.commit()
    db.refresh(db_report)

    return ReportResponse(
        id=db_report.id,
        building_name=db_report.building_name,
        location=db_report.location,
        inspector_name=db_report.inspector_name,
        description=db_report.description,
        sensor_prediction_id=db_report.sensor_prediction_id,
        image_analysis_id=db_report.image_analysis_id,
        overall_status=DamageLevel(db_report.overall_status),
        created_at=db_report.created_at,
        updated_at=db_report.updated_at
    )


@router.delete("/{report_id}")
@limiter.limit("10/minute")
async def delete_report(
    request: Request,
    report_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Delete a report. Authentication is optional."""
    from models.user_model import Report
    
    user_id = str(current_user.id) if current_user else request.query_params.get("user_id", "anonymous")
    
    # Check if report exists and belongs to the authenticated user
    db_report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == user_id
    ).first()
    
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(db_report)
    db.commit()

    return {"message": "Report deleted successfully"}
