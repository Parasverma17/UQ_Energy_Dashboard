from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_app.db.session import get_session

router = APIRouter(tags=["readings"])
ALLOWED_BUCKETS = {"15 minutes", "1 hour", "1 day"}

'''
Index URL for /buildings
'''
@router.get("", summary="List Buildings Endpoint")
async def index():
    return {
        "No data being accessed here"
    }

class Point(BaseModel):
    '''A time-series point'''
    ts: datetime
    kwh: float

class SeriesOut(BaseModel):
    '''/series endpoints'''
    device_code: str
    bucket: str
    series: List[Point]

class SeriesParams(BaseModel):
    device_code: Optional[str] = None
    building_id: Optional[int] = None
    date_from: datetime
    date_to: datetime
    bucket: str = "1 hour"

    @field_validator("bucket")
    @classmethod
    def _bucket_ok(cls, buck:str) -> str:
        if buck not in ALLOWED_BUCKETS:
            raise ValueError(f"Bucket must be one of the {ALLOWED_BUCKETS}")
        return buck
    
# ---------- ENDPOINTS -------------------

@router.get("/series", response_model=SeriesOut)
async def series(
    device_code: Optional[str] = Query(None, description="Meter device"),
    building_id: Optional[int] = Query(None, description="Buidling ID"),
    date_from: datetime = Query(..., alias="from"),
    date_to: datetime = Query(..., alias="to"),
    bucket: str = "1 hour",
    session: AsyncSession = Depends(get_session),
):
     
     '''Return with time-bucketed kwh series for device or building'''
     params = SeriesParams(device_code=device_code, building_id=building_id,
                           date_from=date_from, date_to=date_to, bucket=bucket)
     return (f"Incomplete function ${params}")

    


