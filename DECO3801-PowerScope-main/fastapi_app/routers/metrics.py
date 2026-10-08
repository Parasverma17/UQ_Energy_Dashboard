from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_app.db.session import get_session

router = APIRouter(tags=["metrics"])

'''
Index URL for /metrics
'''
@router.get("", summary="List Metric Endpoints")
async def index():
    return {
        "Endpoints": {
            "GET /metrics/ping": {
                "description": "Tests whether FastAPI is connected to postgreSQL database."
            }
        }
    }

# testing if FastAPI connection is alive
@router.get("/ping")
async def ping(session: AsyncSession = Depends(get_session)):
    # simple DB round-trip
    await session.execute(text("SELECT 1"))
    return {"FastAPI connection is alive": True}
