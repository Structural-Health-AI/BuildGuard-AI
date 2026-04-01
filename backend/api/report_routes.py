"""
Report Management API Routes
Endpoints for creating and managing structural health reports
"""
import sqlite3
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from schemas.schemas import ReportCreate, ReportResponse, ReportListResponse, DamageLevel
from models.user_model import User
from api.dependencies import get_current_user

router = APIRouter()
DATABASE_PATH = "buildguard.db"


def determine_overall_status(sensor_prediction_id: int = None, image_analysis_id: int = None) -> str:
    """Determine overall status based on sensor and image analysis results"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    statuses = []

    if sensor_prediction_id:
        cursor.execute(
            "SELECT damage_level FROM sensor_predictions WHERE id = ?",
            (sensor_prediction_id,)
        )
        row = cursor.fetchone()
        if row:
            statuses.append(row[0])

    if image_analysis_id:
        cursor.execute(
            "SELECT damage_detected, damage_type FROM image_analyses WHERE id = ?",
            (image_analysis_id,)
        )
        row = cursor.fetchone()
        if row:
            if row[0]:  # damage_detected
                damage_type = row[1]
                if damage_type == "structural_deformation":
                    statuses.append("severe_damage")
                elif damage_type in ["crack", "spalling", "corrosion"]:
                    statuses.append("minor_damage")
            else:
                statuses.append("healthy")

    conn.close()

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
async def create_report(report: ReportCreate, current_user: User = Depends(get_current_user)):
    """
    Create a new structural health report

    Link sensor predictions and/or image analyses to create a comprehensive report.
    """
    try:
        # Determine overall status from linked analyses
        overall_status = determine_overall_status(
            report.sensor_prediction_id,
            report.image_analysis_id
        )

        now = datetime.now().isoformat()

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO reports
            (building_name, location, inspector_name, description,
             sensor_prediction_id, image_analysis_id, overall_status,
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report.building_name,
            report.location,
            report.inspector_name,
            report.description,
            report.sensor_prediction_id,
            report.image_analysis_id,
            overall_status,
            now,
            now
        ))

        report_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return ReportResponse(
            id=report_id,
            building_name=report.building_name,
            location=report.location,
            inspector_name=report.inspector_name,
            description=report.description,
            sensor_prediction_id=report.sensor_prediction_id,
            image_analysis_id=report.image_analysis_id,
            overall_status=DamageLevel(overall_status),
            created_at=datetime.fromisoformat(now),
            updated_at=datetime.fromisoformat(now)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")


@router.get("/", response_model=ReportListResponse)
async def list_reports(skip: int = 0, limit: int = 50, current_user: User = Depends(get_current_user)):
    """Get all reports with pagination"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get total count
    cursor.execute("SELECT COUNT(*) FROM reports")
    total = cursor.fetchone()[0]

    # Get paginated results
    cursor.execute("""
        SELECT * FROM reports
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """, (limit, skip))

    rows = cursor.fetchall()
    conn.close()

    reports = []
    for row in rows:
        reports.append(ReportResponse(
            id=row['id'],
            building_name=row['building_name'],
            location=row['location'],
            inspector_name=row['inspector_name'],
            description=row['description'],
            sensor_prediction_id=row['sensor_prediction_id'],
            image_analysis_id=row['image_analysis_id'],
            overall_status=DamageLevel(row['overall_status']),
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        ))

    return ReportListResponse(reports=reports, total=total)


@router.get("/{report_id}", response_model=dict)
async def get_report(report_id: int, current_user: User = Depends(get_current_user)):
    """Get a specific report with all linked analyses"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    report = dict(row)

    # Get linked sensor prediction
    if report['sensor_prediction_id']:
        cursor.execute(
            "SELECT * FROM sensor_predictions WHERE id = ?",
            (report['sensor_prediction_id'],)
        )
        sensor_row = cursor.fetchone()
        if sensor_row:
            sensor_data = dict(sensor_row)
            sensor_data['recommendations'] = json.loads(sensor_data['recommendations']) if sensor_data['recommendations'] else []
            report['sensor_prediction'] = sensor_data

    # Get linked image analysis
    if report['image_analysis_id']:
        cursor.execute(
            "SELECT * FROM image_analyses WHERE id = ?",
            (report['image_analysis_id'],)
        )
        image_row = cursor.fetchone()
        if image_row:
            image_data = dict(image_row)
            image_data['damage_detected'] = bool(image_data['damage_detected'])
            image_data['recommendations'] = json.loads(image_data['recommendations']) if image_data['recommendations'] else []
            report['image_analysis'] = image_data

    conn.close()

    return report


@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(report_id: int, report: ReportCreate, current_user: User = Depends(get_current_user)):
    """Update an existing report"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Check if report exists
    cursor.execute("SELECT id FROM reports WHERE id = ?", (report_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    # Determine new overall status
    overall_status = determine_overall_status(
        report.sensor_prediction_id,
        report.image_analysis_id
    )

    now = datetime.now().isoformat()

    cursor.execute("""
        UPDATE reports
        SET building_name = ?, location = ?, inspector_name = ?, description = ?,
            sensor_prediction_id = ?, image_analysis_id = ?, overall_status = ?,
            updated_at = ?
        WHERE id = ?
    """, (
        report.building_name,
        report.location,
        report.inspector_name,
        report.description,
        report.sensor_prediction_id,
        report.image_analysis_id,
        overall_status,
        now,
        report_id
    ))

    conn.commit()

    # Fetch updated report
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()

    return ReportResponse(
        id=row['id'],
        building_name=row['building_name'],
        location=row['location'],
        inspector_name=row['inspector_name'],
        description=row['description'],
        sensor_prediction_id=row['sensor_prediction_id'],
        image_analysis_id=row['image_analysis_id'],
        overall_status=DamageLevel(row['overall_status']),
        created_at=datetime.fromisoformat(row['created_at']),
        updated_at=datetime.fromisoformat(row['updated_at'])
    )


@router.delete("/{report_id}")
async def delete_report(report_id: int, current_user: User = Depends(get_current_user)):
    """Delete a report"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    conn.commit()
    conn.close()

    return {"message": "Report deleted successfully"}
