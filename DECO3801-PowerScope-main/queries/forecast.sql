SELECT horizon_day, forecast_energy, forecast_date
FROM predictions
ORDER BY forecast_date ASC, horizon_day ASC
LIMIT 7;