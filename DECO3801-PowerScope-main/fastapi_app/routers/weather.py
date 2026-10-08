from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from fastapi_app.db.session import get_session
from fastapi_app.db.query_loader import load_query
from datetime import date

router = APIRouter(tags=["weather"])

'''
Index URL for /weather
'''
@router.get("", summary="List Weather Data Endpoints")
async def index():
    return {
        "endpoints": {
            "GET /api/weather/forecast": {
                "description": "Daily energy consumption predictions based on forecast.",
                "params": ["horizon_day", "forecast_energy", "forecast_date"]
            }
        }
    }    

'''
Daily energy consumption predictions based on forecast.
'''
class ForecastPredictions(BaseModel):
    horizon_day: str
    forecast_energy: float
    forecast_date: date

@router.get("/forecast",
             response_model=List[ForecastPredictions])
async def forecast(
        horizon_day: str = Query(None, description = "Day of the Week"),
        session: AsyncSession = Depends(get_session)
):
    sql = load_query("forecast")
    if horizon_day:
        rows = await session.execute(text(sql), {"horizon_day": horizon_day})
    else:
        rows = await session.execute(text(sql))

    results = rows.mappings().all()
    return [{
        "Day": int(r["horizon_day"]),
        "Energy forecast": r["forecast_energy"], 
        "Forecast Date": float(r["forecast_date"])
        } 
            for r in results
        ]