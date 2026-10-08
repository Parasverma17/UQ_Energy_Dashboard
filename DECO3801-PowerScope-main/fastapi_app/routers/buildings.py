from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from fastapi_app.db.session import get_session
from fastapi_app.db.query_loader import load_query
from fastapi.encoders import jsonable_encoder

import traceback

router = APIRouter(tags=["buildings"])

'''
Index URL for /buildings
'''
@router.get("", summary="List Buildings Endpoint")
async def index():
    return {
        "endpoints": {
            "GET api/buildings/sankey": {
                "description": "Sankey chart used to display building energy flow and"
                "consumption", 
                "params":["source", "end_point", "kwh"]
            }, 

            "GET /facilities": {
                "description": "",
                "params": []
            },
            "GET api/buildings/ytd_meter_comparison": {
                "description": "Building-level energy consumption "
                    "comparison via meter device readings (2024 vs 2025)",
                "params": ["meter_id", "load_description", "current_energy", 
                           "past_energy","energy_change"]
            },
            "GET api/buildings/ytd_overall_comparison": {
                "description": "UQ campus-wide energy consumption "
                    "comparison for 2024 vs 2025", 
                "params": ["label", "kwh"]
            }, 
            "GET api/building/building_emissions": {
                "description": "Building Energy Emissions (2024 vs 2025)",
                "params": ["building", "cur_emissions", "past_energy", 
                           "prev_emissions", "emissions_change"]
            },
            "GET api/building/energy_usage": {
                "description": "Energy BreakDown - most utilised buildings "
                "and the percentage of energy used by the buildings",
                "params": ["building", "kwh", "energy_share"]
            }
        }
    }

'''
Building energy flow readings to be used for 
dashboard's sankey chart.
'''
@router.get("/sankey", summary="sankey chart data")
async def building_energy_flow(
    building: str | None = Query(None),
    session: AsyncSession = Depends(get_session)
):
    try:
        query = load_query("sankey")
        res = await session.execute(text(query), {'building': building or None})
        rows = res.fetchall()
        links = [
            {
                "source": r.source, 
                "end_point": r.end_point, 
                "kwh": r.kwh
            }
            for r in rows
        ]
        return links
    except Exception as e:
        print(f"Error in sankey endpoint: {e}")
        traceback.print_exc()
        return []


@router.get("/facilities", summary = "facility data for buildings")
async def facilities_data(
    session: AsyncSession = Depends(get_session)
):
    
    try:
        query = load_query('facilities_api')
        res = await session.execute(text(query))
        rows = res.mappings().all()
        data = jsonable_encoder(rows)
        if not data:
            return []
        return data
    
    except Exception as e:
        print(f"Error in facilites endpoint: {e}")
        traceback.print_exc()
        return []
    

'''
UQ Building Level YTD Energy Consumption
Comparisons for 2024 vs 2025
Measured by Different Meter Devices in the Building
'''
@router.get("/ytd_meter_comparison", 
            summary = "YTD Building Energy Consumption by Meter Device")
async def ytd_building_meter_comparison(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("building_ytd_compare")
        results = await session.execute(text(sql))
        rows = results.fetchall()

        return [{"meter_id": r.meter_id, "load_description": r.load_description,
                "current_energy": r.current_energy, "past_energy": r.past_energy,
                "energy_change": r.energy_change}
                for r in rows]
    
    except Exception as e:
        print(f"Error in ytd_meter_comparison endpoint: {e}")
        traceback.print_exc()
        return []

'''
Overall Building Energy Consumption
Obtained by Aggregating all Meter Device Readings
2024 vs 2025
'''
@router.get("/ytd_overall_comparison", 
            summary = "ytd Building Overall Energy Consumption 2024 vs 2025")
async def ytd_building_comparison(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("building_ytd_compare_overall")
        res = await session.execute(text(sql))
        rows = res.fetchall()

        return [{"previous_year": float(r[0]), "current_year": float(r[1]),
             "difference_in_usage": float(r[2]), "percent_change": float(r[3])}
                for r in rows]

    except Exception as e:
        print(f"Error in ytd_overall_comparison endpoint: {e}")
        traceback.print_exc()
        return []


'''
Building Energy Emissions
'''
@router.get("/building_emissions")
async def building_emissions(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("building_emissions")
        results = await session.execute(text(sql))
        rows = results.fetchall()

        return [{"building": r.building, "cur_emissions": r.cur_emissions,
                "past_energy": r.past_energy, "prev_emissions": r.prev_emissions,
                "emissions_change": r.emissions_change}
                for r in rows]

    except Exception as e:
        print(f"Error in building_emissions endpoint: {e}")
        traceback.print_exc()
        return []


'''
Energy BreakDown
Most utilised buildings and the percentage of energy
used by the buildings
'''
@router.get("/energy_usage")
async def energy_usage(
    session: AsyncSession = Depends(get_session)
):
    try:
        sql = load_query("building_energy_usage")
        results = await session.execute(text(sql))
        rows = results.fetchall()

        return [{"building": r.building, "kwh": r.kwh,
                "energy_share": r.energy_share}
                for r in rows]

    except Exception as e:
        print(f"Error in building_energy_usage endpoint: {e}")
        traceback.print_exc()
        return []


@router.get("/hourly_usage", summary="hourly_usage")
async def building_energy_flow(
    building: str | None = Query(None),
    session: AsyncSession = Depends(get_session)
):
    try:
        query = load_query("avg_hour_usage_building")
        res = await session.execute(text(query), {'building': building or None})
        rows = res.fetchall()
        links = [
            {
                "hour_of_day": r.hour_of_day,  
                "avg_kwh": r.avg_kwh
            }
            for r in rows
        ]
        return links
    except Exception as e:
        print(f"Error in hourly_usage endpoint: {e}")
        traceback.print_exc()
        return []
