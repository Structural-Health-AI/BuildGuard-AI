"""
Image Analysis API Routes
Endpoints for image-based structural damage detection
"""
import os
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Request, Depends
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from schemas.schemas import ImageAnalysisResponse
from models.image_model import predict_image_damage_multiscale
from models.user_model import ImageAnalysis
from core.config import get_settings
from database import get_db

router = APIRouter()
settings = get_settings()

UPLOAD_DIR = "uploads"
limiter = Limiter(key_func=get_remote_address)


@router.post("/analyze", response_model=ImageAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_image(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = None,
    db: Session = Depends(get_db)
):
    """
    Analyze an uploaded image for structural damage

    Upload an image of a building/structure to detect:
    - Cracks
    - Spalling
    - Corrosion
    - Structural deformation
    
    **Rate Limit:** 10 requests per minute per IP
    **Max File Size:** 10MB
    **user_id**: (Optional) User ID for user-specific analytics
    """
    # Get user_id from query parameter if not provided
    if not user_id:
        user_id = request.query_params.get("user_id")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    try:
        # Read file contents
        contents = await file.read()

        # Validate file size (max 10MB)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max 10MB allowed.")

        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Save file
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(contents)

        # Get prediction using multi-scale detection
        damage_detected, damage_type, confidence, recommendations, details = predict_image_damage_multiscale(contents)

        # Save to database using SQLAlchemy ORM
        db_analysis = ImageAnalysis(
            user_id=user_id,
            session_id=user_id,  # Keep for backward compatibility
            image_path=file_path,
            damage_detected=1 if damage_detected else 0,
            damage_type=damage_type,
            confidence=confidence,
            recommendations=recommendations
        )
        
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)

        # Prepare response with multi-scale details
        response_data = {
            "id": db_analysis.id,
            "damage_detected": damage_detected,
            "damage_type": damage_type,
            "confidence": confidence,
            "timestamp": datetime.now(),
            "image_path": f"/uploads/{unique_filename}",
            "recommendations": recommendations,
            "details": details  # Include multi-scale details (tiles, small_cracks_detected, etc)
        }
        
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/history", response_model=List[dict])
@limiter.limit("30/minute")
async def get_image_history(
    request: Request,
    limit: int = 50,
    db: Session = Depends(get_db),
    user_id: str = None
):
    """Get history of image analyses for the current user"""
    # Get user_id from query parameter if not provided
    if not user_id:
        user_id = request.query_params.get("user_id")
    
    # Filter by user_id if provided
    query = db.query(ImageAnalysis)
    if user_id:
        query = query.filter(ImageAnalysis.user_id == user_id)
    
    analyses = query.order_by(
        ImageAnalysis.created_at.desc()
    ).limit(limit).all()

    results = []
    for analysis in analyses:
        results.append({
            "id": analysis.id,
            "image_path": analysis.image_path,
            "damage_detected": bool(analysis.damage_detected),
            "damage_type": analysis.damage_type,
            "confidence": analysis.confidence,
            "recommendations": analysis.recommendations or [],
            "created_at": analysis.created_at
        })

    return results


@router.get("/{analysis_id}")
@router.get("/{analysis_id}")
async def get_image_analysis(
    analysis_id: int,
    user_id: str = None,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Get a specific image analysis by ID"""
    # Get user_id from query parameter if not provided
    if not user_id and request:
        user_id = request.query_params.get("user_id")
    
    analysis = db.query(ImageAnalysis).filter(
        ImageAnalysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check user ownership
    if user_id and analysis.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied - this analysis belongs to another user")

    return {
        "id": analysis.id,
        "image_path": analysis.image_path,
        "damage_detected": bool(analysis.damage_detected),
        "damage_type": analysis.damage_type,
        "confidence": analysis.confidence,
        "recommendations": analysis.recommendations or [],
        "created_at": analysis.created_at
    }


@router.delete("/{analysis_id}")
async def delete_image_analysis(
    analysis_id: int,
    user_id: str = None,
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Delete an image analysis and its associated file"""
    # Get user_id from query parameter if not provided
    if not user_id and request:
        user_id = request.query_params.get("user_id")
    
    analysis = db.query(ImageAnalysis).filter(
        ImageAnalysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check user ownership
    if user_id and analysis.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied - cannot delete another user's analysis")

    # Delete file if exists
    if analysis.image_path and os.path.exists(analysis.image_path):
        try:
            os.remove(analysis.image_path)
        except OSError:
            pass  # Ignore file deletion errors

    # Delete from database
    db.delete(analysis)
    db.commit()

    return {"message": "Analysis deleted successfully"}
