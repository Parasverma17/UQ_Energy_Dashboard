from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from fastapi_app.db.session import get_session
from fastapi_app.db.query_loader import load_query
from pathlib import Path
import os
import traceback

router = APIRouter(tags=["analytics"])
QUERY_DIR = Path(os.getenv("QUERY_DIR",'/app/queries'))
'''
Index URL for /analytics
'''
@router.get("", summary="List Analytics Endpoint")
async def index():
    return {
        "endpoints": {
            "GET /api/analytics/avg_per_day_of_week": {
                "description": "Average daily electricity usage for each day of the week",
                "params": ["dow", "kwh"]
            },
            "GET /api/analytics/usage_per_month": {
                "description": "Average monthly electricity usage",
                "params": ["year", "month", "total_energy_usage"]
            },
            "GET /api/analytics/hourly_device_usage": {
                "description": "Hourly electricity usage measured by different metric devices on campus",
                "params": ["device_code", "date-from", "date-to"]
            },
            "GET /api/analytics/uq_ytd_overall_comparison": {
                "description": "UQ-wide campus comparison "
                "current year vs previous year",
                "params": []
            },
            "GET /api/analytics/uq_month_overall_comparison": {
                "description": "Building Level comparison "
                "(current month, current year) vs (current month, prev year)",
                "params": ["label", "kwh"]
            },
            "GET /api/analytics/uq_total_emissions": {
                "description": "UQ-wide total energy emissions comparisons",
                "params": ["cur_eng", "prev_eng", "cur_emissions", 
                           "prev_emissions", "emissions_change"]
            },

            "GET /api/analytics/uq_overlook": {
               "description": "Overlook of data from NMI values",
               "params": ["current_kwh", "previous_kwh", "current_tco2e", "previous_tco2e", "current_cost", "prev_cost"] 
            }
        }
    }

'''
Average Daily Usage by Day of Week
'''
class DowUsage(BaseModel):
    dow: str
    avg_kwh: float

@router.get('/avg_per_day_of_week',
            response_model = List[DowUsage])
async def average_per_dow(
        device_code: str = Query(None, description = "No Device Code"),
        session: AsyncSession = Depends(get_session)):
    sql = load_query("average_per_dow")

    if device_code:
        rows = (await session.execute(text(sql), {"device_code": device_code})).all()
    else:
        rows = (await session.execute(text(sql))).all()
    return [{"dow": r[0], "avg_kwh": float(r[1])} for r in rows]

'''
Monthly Aggregated Averages
'''
class MonthlyUsage(BaseModel):
    year: int
    month: str
    total_energy_usage: float

@router.get("/usage_per_month",
             response_model=List[MonthlyUsage])
async def usage_per_month(
        device_code: str = Query(None, description = "No Device Code"),
        session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("usage_per_month")
        if device_code:
            rows = await session.execute(text(sql), {"device_code": device_code})
        else:
            rows = await session.execute(text(sql))

        results = rows.mappings().all()
        return [{
            "year": int(r["year_date"]),
            "month": r["month_date"], 
            "total_energy_usage": float(r["imported_total"])
            } 
                for r in results
            ]
    except Exception as e:
        print(f"Error in usage_per_month endpoint: {e}")
        traceback.print_exc()
        return []


'''
Device Usage per Hour (Time-bucketed)
'''
class HourlyUsage(BaseModel):
    ts: str
    kwh: float

@router.get("/hourly_device_usage",
            response_model = List[HourlyUsage])
async def hourly_device_usage(
    device_code: str = Query(None, description="Meter/device code"),
    date_from: str = Query(None, description="No from-date found"),
    date_to: str = Query(None, description="No to-date found"),
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("hourly_device_usage")
        rows = (await session.execute(
            text(sql),
            {"device_code": device_code, "date_from": date_from, "date_to": date_to}
        )).all()
        return [
            {"ts": r[0], "kwh": float(r[1])} for r in rows]
    
    except Exception as e:
        print(f"Error in hourly_device_usage endpoint: {e}")
        traceback.print_exc()
        return []

'''
Overall UQ-Wide Energy Consumption
UQ Ytd for 2024 vs 2025
'''
class ComparisonModel(BaseModel):
    previous_year: float
    current_year: float
    difference_in_usage: float
    percent_change: float

@router.get("/uq_ytd_overall_comparison", response_model=List[ComparisonModel])
async def uq_ytd_comparison(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("uq_ytd_compare_overall")
        results = await session.execute(text(sql))
        rows = results.fetchall()
        return [
            {"previous_year": float(r[0]), "current_year": float(r[1]),
             "difference_in_usage": float(r[2]), "percent_change": float(r[3])}
            for r in rows
        ]

    except Exception as e:
        print(f"Error in uq_ytd_overall comparison endpoint: {e}")
        traceback.print_exc()
        return []


'''
Overall UQ-Wide Energy Consumption
Current month 2024 vs Current Month 2025
'''
@router.get("/uq_month_overall_comparison", response_model = List[ComparisonModel])
async def uq_monthly_comparison(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("uq_month_compare_overall")
        results = await session.execute(text(sql))
        rows = results.fetchall()
        return [
            {"previous_year": float(r[0]), "current_year": float(r[1]),
             "difference_in_usage": float(r[2]), "percent_change": float(r[3])}
            for r in rows
        ]
    except Exception as e:
        print(f"Error in uq_overall_month_comparison endpoint: {e}")
        traceback.print_exc()
        return []


'''
UQ-wide total energy emissions comparisons
'''
@router.get("/uq_total_emissions")
async def total_emissions(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("uq_total_emissions")
        results = await session.execute(text(sql))
        rows = results.fetchall()

        return [{"cur_eng": r.cur_eng, "prev_eng": r.prev_eng,
                "cur_emissions": r.cur_emissions, 
                "prev_emissions": r.prev_emissions, 
                "emissions_change": r.emissions_change}
                for r in rows]
    except Exception as e:
        print(f"Error in uq_total_emissions endpoint: {e}")
        traceback.print_exc()
        return []


'''
UQ energy Overlook
'''
@router.get("/uq_overlook")
async def total_emissions(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("campus_data_overlook")
        results = await session.execute(text(sql))
        rows = results.fetchall()
        return [{"current_kwh":r.current_kwh, "previous_kwh":r.previous_kwh, 
                 "current_tco2e":r.current_tco2e, "previous_tco2e":r.previous_tco2e, "current_cost":r.current_cost
                 , "prev_cost":r.prev_cost} for r in rows] 
    except Exception as e:
        print(f"Error in uq_overlook endpoint: {e}")
        traceback.print_exc()
        return []
