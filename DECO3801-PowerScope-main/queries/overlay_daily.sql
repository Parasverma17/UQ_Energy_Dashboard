-- overlay_daily.sql
SELECT
    date_trunc('day', timestamp) AS timestamp,
    SUM(total_cost) AS total_cost,
    SUM(total_energy_kwh) AS total_energy_kwh,
    AVG(avg_price_per_kwh) AS avg_price_per_kwh,
    AVG(avg_temp_c) AS avg_temp_c,
    AVG(avg_humidity) AS avg_humidity,
    to_char(date_trunc('day', timestamp), 'YYYY-MM-DD') AS period_label
FROM dashboard_overlay
WHERE timestamp >= :start_date
  AND timestamp <= :end_date
GROUP BY date_trunc('day', timestamp)
ORDER BY timestamp;