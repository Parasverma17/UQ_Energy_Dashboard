from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from pathlib import Path
from fastapi_app.db.session import get_session

router = APIRouter(tags=["dashboard"])

# SQL directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
SQL_DIR = PROJECT_ROOT / "queries"

# Models
class OverlayPoint(BaseModel):
    timestamp: datetime
    total_cost: float
    total_energy_kwh: float
    avg_price_per_kwh: float
    avg_temp_c: Optional[float]
    avg_humidity: Optional[float]

class PublicOverlayPoint(BaseModel):
    timestamp: datetime
    total_energy_kwh: float
    avg_temp_c: Optional[float]
    avg_humidity: Optional[float]

class MetricPoint(BaseModel):
    timestamp: datetime
    total_cost: float
    total_energy_kwh: float
    avg_price_per_kwh: float
    period_label: str
    avg_temp_c: Optional[float]
    avg_humidity: Optional[float]

class PublicMetricPoint(BaseModel):
    timestamp: datetime
    total_energy_kwh: float
    period_label: str
    avg_temp_c: Optional[float]
    avg_humidity: Optional[float]

class SummaryStats(BaseModel):
    total_cost: float
    total_energy_kwh: float
    avg_price_per_kwh: float
    date_range: dict

class PublicSummaryStats(BaseModel):
    total_energy_kwh: float
    date_range: dict

# Index
@router.get("", summary="List Dashboard Endpoints")
async def index():
    return {
        "endpoints": {
            "GET /dashboard/overlay": "Hourly overlay data (energy + weather + cost)",
            "GET /dashboard/metrics": "Aggregated metrics (hour, day, week, month, year)",
            "GET /dashboard/summary": "Summary statistics for date range",
            "GET /dashboard/public/overlay": "Public hourly overlay data (energy + weather, no cost)",
            "GET /dashboard/public/metrics": "Public aggregated metrics (no cost)",
            "GET /dashboard/public/summary": "Public summary statistics (no cost)"
        }
    }

# Overlay Endpoint (Hourly Data)
@router.get('/overlay', response_model=List[OverlayPoint])
async def get_overlay_data(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session)
):
    row = await session.execute(text("SELECT MIN(timestamp), MAX(timestamp) FROM dashboard_overlay"))
    min_ts, max_ts = row.first()
    start_date = start_date or min_ts
    end_date = end_date or max_ts

    sql = (SQL_DIR / "overlay.sql").read_text()
    rows = await session.execute(text(sql), {"start_date": start_date, "end_date": end_date})
    results = [dict(r._mapping) for r in rows.all()]

    for r in results:
        r["total_cost"] = float(r.get("total_cost", 0))
        r["total_energy_kwh"] = float(r.get("total_energy_kwh", 0))
        r["avg_price_per_kwh"] = float(r.get("avg_price_per_kwh", 0))
        r["avg_temp_c"] = float(r.get("avg_temp_c") or 0)
        r["avg_humidity"] = float(r.get("avg_humidity") or 0)

    return results

# Metrics Endpoint (Aggregated)
@router.get('/metrics', response_model=List[MetricPoint])
async def get_metrics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    resolution: str = Query("day", description="hour, day, week, month, year"),
    session: AsyncSession = Depends(get_session)
):
    row = await session.execute(text("SELECT MIN(timestamp), MAX(timestamp) FROM dashboard_overlay"))
    min_ts, max_ts = row.first()
    start_date = start_date or min_ts
    end_date = end_date or max_ts

    view_map = {
        "hour": "overlay",
        "day": "overlay_daily",
        "week": "dashboard_weekly",
        "month": "dashboard_monthly",
        "year": "dashboard_yearly"
    }

    if resolution not in view_map:
        raise HTTPException(status_code=400, detail="Invalid resolution")

    sql_file = SQL_DIR / f"{view_map[resolution]}.sql"
    sql = sql_file.read_text()

    rows = await session.execute(text(sql), {"start_date": start_date, "end_date": end_date})
    results = [dict(r._mapping) for r in rows.all()]

    for r in results:
        r["total_cost"] = float(r.get("total_cost", 0))
        r["total_energy_kwh"] = float(r.get("total_energy_kwh", 0))
        r["avg_price_per_kwh"] = float(r.get("avg_price_per_kwh", 0))
        r["period_label"] = str(r.get("period_label") or r.get("timestamp"))
        r["avg_temp_c"] = float(r.get("avg_temp_c") or 0)
        r["avg_humidity"] = float(r.get("avg_humidity") or 0)

    return results

# Summary Statistics Endpoint
@router.get('/summary', response_model=SummaryStats)
async def get_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session)
):
    row = await session.execute(text("SELECT MIN(timestamp), MAX(timestamp) FROM dashboard_overlay"))
    min_ts, max_ts = row.first()
    start_date = start_date or min_ts
    end_date = end_date or max_ts

    sql = """
        SELECT 
            SUM(total_cost) as total_cost,
            SUM(total_energy_kwh) as total_energy_kwh,
            AVG(avg_price_per_kwh) as avg_price_per_kwh
        FROM dashboard_overlay
        WHERE timestamp >= :start_date
          AND timestamp <= :end_date
    """
    row = (await session.execute(text(sql), {"start_date": start_date, "end_date": end_date})).first()

    return {
        "total_cost": float(row[0] or 0),
        "total_energy_kwh": float(row[1] or 0),
        "avg_price_per_kwh": float(row[2] or 0),
        "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()}
    }

# PUBLIC ENDPOINTS (No Cost Data)
@router.get('/public/overlay', response_model=List[PublicOverlayPoint])
async def get_public_overlay_data(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session)
):
    """Public overlay endpoint - returns energy and weather data without cost information"""
    row = await session.execute(text("SELECT MIN(timestamp), MAX(timestamp) FROM dashboard_overlay"))
    min_ts, max_ts = row.first()
    start_date = start_date or min_ts
    end_date = end_date or max_ts

    sql = """
        SELECT 
            timestamp,
            total_energy_kwh,
            avg_temp_c,
            avg_humidity
        FROM dashboard_overlay
        WHERE timestamp >= :start_date
          AND timestamp <= :end_date
        ORDER BY timestamp
    """
    rows = await session.execute(text(sql), {"start_date": start_date, "end_date": end_date})
    results = [dict(r._mapping) for r in rows.all()]

    for r in results:
        r["total_energy_kwh"] = float(r.get("total_energy_kwh", 0))
        r["avg_temp_c"] = float(r.get("avg_temp_c") or 0)
        r["avg_humidity"] = float(r.get("avg_humidity") or 0)

    return results

@router.get('/public/metrics', response_model=List[PublicMetricPoint])
async def get_public_metrics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    resolution: str = Query("day", description="hour, day, week, month, year"),
    session: AsyncSession = Depends(get_session)
):
    """Public metrics endpoint - returns aggregated energy and weather data without cost information"""
    row = await session.execute(text("SELECT MIN(timestamp), MAX(timestamp) FROM dashboard_overlay"))
    min_ts, max_ts = row.first()
    start_date = start_date or min_ts
    end_date = end_date or max_ts

    # Define resolution-specific queries
    resolution_queries = {
        "hour": """
            SELECT 
                timestamp,
                total_energy_kwh,
                avg_temp_c,
                avg_humidity,
                timestamp::text as period_label
            FROM dashboard_overlay
            WHERE timestamp >= :start_date
              AND timestamp <= :end_date
            ORDER BY timestamp
        """,
        "day": """
            SELECT 
                time_bucket('1 day', timestamp) as timestamp,
                SUM(total_energy_kwh) as total_energy_kwh,
                AVG(avg_temp_c) as avg_temp_c,
                AVG(avg_humidity) as avg_humidity,
                to_char(time_bucket('1 day', timestamp), 'YYYY-MM-DD') as period_label
            FROM dashboard_overlay
            WHERE timestamp >= :start_date
              AND timestamp <= :end_date
            GROUP BY time_bucket('1 day', timestamp)
            ORDER BY timestamp
        """,
        "week": """
            SELECT 
                date_trunc('week', timestamp) AS timestamp,
                SUM(total_energy_kwh) AS total_energy_kwh,
                AVG(avg_temp_c) AS avg_temp_c,
                AVG(avg_humidity) AS avg_humidity,
                to_char(date_trunc('week', timestamp), 'YYYY-MM-DD') AS period_label
            FROM dashboard_overlay
            WHERE timestamp >= :start_date AND timestamp <= :end_date
            GROUP BY date_trunc('week', timestamp)
            ORDER BY timestamp;
        """,
        "month": """
            SELECT 
                date_trunc('month', timestamp) AS timestamp,
                SUM(total_energy_kwh) AS total_energy_kwh,
                AVG(avg_temp_c) AS avg_temp_c,
                AVG(avg_humidity) AS avg_humidity,
                to_char(date_trunc('month', timestamp), 'YYYY-MM') AS period_label
            FROM dashboard_overlay
            WHERE timestamp >= :start_date AND timestamp <= :end_date
            GROUP BY date_trunc('month', timestamp)
            ORDER BY timestamp;
        """,
        "year": """
            SELECT 
                ts as timestamp,
                total_energy_kwh,
                NULL as avg_temp_c,
                NULL as avg_humidity,
                ts::text as period_label
            FROM dashboard_yearly
            WHERE ts >= :start_date
              AND ts <= :end_date
            ORDER BY ts
        """
    }

    if resolution not in resolution_queries:
        raise HTTPException(status_code=400, detail="Invalid resolution")

    sql = resolution_queries[resolution]
    rows = await session.execute(text(sql), {"start_date": start_date, "end_date": end_date})
    results = [dict(r._mapping) for r in rows.all()]

    for r in results:
        r["total_energy_kwh"] = float(r.get("total_energy_kwh", 0))
        r["period_label"] = str(r.get("period_label") or r.get("timestamp"))
        r["avg_temp_c"] = float(r.get("avg_temp_c") or 0) if r.get("avg_temp_c") is not None else None
        r["avg_humidity"] = float(r.get("avg_humidity") or 0) if r.get("avg_humidity") is not None else None

    return results

@router.get('/public/summary', response_model=PublicSummaryStats)
async def get_public_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session)
):
    """Public summary endpoint - returns total energy without cost information"""
    row = await session.execute(text("SELECT MIN(timestamp), MAX(timestamp) FROM dashboard_overlay"))
    min_ts, max_ts = row.first()
    start_date = start_date or min_ts
    end_date = end_date or max_ts

    sql = """
        SELECT 
            SUM(total_energy_kwh) as total_energy_kwh
        FROM dashboard_overlay
        WHERE timestamp >= :start_date
          AND timestamp <= :end_date
    """
    row = (await session.execute(text(sql), {"start_date": start_date, "end_date": end_date})).first()

    return {
        "total_energy_kwh": float(row[0] or 0),
        "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()}
    }