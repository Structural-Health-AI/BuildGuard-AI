"""
Image Analysis API Routes
Endpoints for image-based structural damage detection
"""
import os
import sqlite3
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from schemas.schemas import ImageAnalysisResponse
from models.image_model import predict_image_damage

router = APIRouter()
DATABASE_PATH = "buildguard.db"
UPLOAD_DIR = "uploads"
limiter = Limiter(key_func=get_remote_address)


@router.post("/analyze", response_model=ImageAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_image(request: Request, file: UploadFile = File(...)):
    """
    Analyze an uploaded image for structural damage

    Upload an image of a building/structure to detect:
    - Cracks
    - Spalling
    - Corrosion
    - Structural deformation
    
    **Rate Limit:** 10 requests per minute per IP
    **Max File Size:** 10MB
    """
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

        # Get prediction
        damage_detected, damage_type, confidence, recommendations = predict_image_damage(contents)

        # Save to database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO image_analyses
            (image_path, damage_detected, damage_type, confidence, recommendations)
            VALUES (?, ?, ?, ?, ?)
        """, (
            file_path,
            1 if damage_detected else 0,
            damage_type,
            confidence,
            json.dumps(recommendations)
        ))

        analysis_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return ImageAnalysisResponse(
            id=analysis_id,
            damage_detected=damage_detected,
            damage_type=damage_type,
            confidence=confidence,
            timestamp=datetime.now(),
            image_path=f"/uploads/{unique_filename}",
            recommendations=recommendations
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/history", response_model=List[dict])
async def get_image_history(limit: int = 50):
    """Get history of image analyses"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, image_path, damage_detected, damage_type, confidence,
               recommendations, created_at
        FROM image_analyses
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        item = dict(row)
        item['damage_detected'] = bool(item['damage_detected'])
        item['recommendations'] = json.loads(item['recommendations']) if item['recommendations'] else []
        results.append(item)

    return results


@router.get("/{analysis_id}")
async def get_image_analysis(analysis_id: int):
    """Get a specific image analysis by ID"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM image_analyses WHERE id = ?", (analysis_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")

    result = dict(row)
    result['damage_detected'] = bool(result['damage_detected'])
    result['recommendations'] = json.loads(result['recommendations']) if result['recommendations'] else []

    return result


@router.delete("/{analysis_id}")
async def delete_image_analysis(analysis_id: int):
    """Delete an image analysis and its associated file"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get file path first
    cursor.execute("SELECT image_path FROM image_analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Delete file if exists
    if row['image_path'] and os.path.exists(row['image_path']):
        try:
            os.remove(row['image_path'])
        except OSError:
            pass  # Ignore file deletion errors

    # Delete from database
    cursor.execute("DELETE FROM image_analyses WHERE id = ?", (analysis_id,))
    conn.commit()
    conn.close()

    return {"message": "Analysis deleted successfully"}
