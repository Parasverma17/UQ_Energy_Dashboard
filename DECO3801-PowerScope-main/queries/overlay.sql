SELECT 
    timestamp,
    COALESCE(total_cost, 0) AS total_cost,
    COALESCE(total_energy_kwh, 0) AS total_energy_kwh,
    COALESCE(avg_price_per_kwh, 0) AS avg_price_per_kwh,
    avg_temp_c,
    avg_humidity
FROM dashboard_overlay
WHERE timestamp >= :start_date
  AND timestamp <= :end_date
ORDER BY timestamp;