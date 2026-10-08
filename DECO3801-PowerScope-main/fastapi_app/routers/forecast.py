from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from fastapi_app.db.session import get_session
from datetime import date

router = APIRouter(tags=["forecast"])

class Prediction(BaseModel):
    horizon_day: int
    forecast_energy: float
    forecast_date: date

class PredictionResponse(BaseModel):
    predictions: List[Prediction]
    total_forecasts: int

@router.get("", summary="Get next 7 days predictions", response_model=PredictionResponse)
async def get_predictions(session: AsyncSession = Depends(get_session)):
    try:
        # Direct SQL query
        query = """
            SELECT
                horizon_day,
                forecast_energy,
                forecast_date
            FROM predictions
            ORDER BY forecast_date ASC, horizon_day ASC;
        """

        res = await session.execute(text(query))
        rows = res.mappings().all()  # async-safe, dict-like access

        predictions = [
            Prediction(
                horizon_day=r["horizon_day"],
                forecast_energy=r["forecast_energy"],
                forecast_date=r["forecast_date"]
            )
            for r in rows
        ]

        return PredictionResponse(predictions=predictions, total_forecasts=len(predictions))

    except Exception as e:
        print(f"Error in predictions endpoint: {e}")
        import traceback
        traceback.print_exc()
        return PredictionResponse(predictions=[], total_forecasts=0)