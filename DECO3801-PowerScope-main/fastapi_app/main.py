from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_app.routers import readings, metrics, buildings, weather, analytics, dashboard, forecast
import re
from fastapi_app.core.config import settings

app = FastAPI(
    title="UQ Energy Lens (FastAPI Component)",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers with API prefixes
app.include_router(readings.router, prefix="/api/readings")
app.include_router(buildings.router, prefix="/api/buildings")
app.include_router(weather.router, prefix="/api/weather")
app.include_router(analytics.router, prefix="/api/analytics")
app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(forecast.router, prefix="/api/forecast")

# Utility / root endpoints
@app.get("/")
async def root():
    return {"API Access Points": "GET /api"}

@app.get("/api/")
async def index():
    return {
        "API Access": {
            "GET /api/analytics": {
                "description": "Chart-ready energy aggregates views "
                               "of analytical data to be displayed on dashboards.",
                "Endpoints": ["GET /api/analytics/avg_per_day_of_week",
                              "GET /api/analytics/usage_per_month",
                              "GET /api/analytics/hourly_device_usage"],
                "params": ["device_code", "date-from", "date-to"]
            },
            "GET /api/buildings": {
                "description": "Building metadata to be used for future filtering "
                               "(e.g. energy use per building)",
                "Endpoints": ["GET /api/buildings/sankey",
                              "GET /api/buildings/ytd_meter_comparison",
                              "GET /api/buildings/ytd_overall_comparison",
                              "GET /api/building/building_emissions",
                              "GET /api/building/energy_usage"],
                "params": ["building_id", "device_code"]
            },
            "GET /api/metrics": {
                "description": "Monitoring related to endpoint stability/security (e.g. pings)",
                "Endpoints": ["GET /api/metrics/ping"],
                "params": ["device_code", "date-from", "date-to"]
            },
            "GET /api/readings": {
                "description": "Low level access to non-aggregated timeseries readings.",
                "params": ["device_code"]
            },
            "GET /api/weather": {
                "description": "Weather-related data and aggregations (e.g. daily weather rollups)",
                "params": ["weather-related fields"]
            },
            "GET /api/forecast": {
                "description": "Forecast for next 7 days",
                "params": []
            }
        }
    }
