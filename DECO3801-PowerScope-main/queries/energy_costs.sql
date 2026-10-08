SELECT
    time_bucket('1 day', measurement_date) AS ts,
    SUM(cost) AS total_cost,
    SUM(energy_mwh * 1000) AS total_energy_kwh,
    AVG(price_per_mwh / 1000) AS avg_price_per_kwh,
    TO_CHAR(time_bucket('1 day', measurement_date), 'DD Mon YYYY') AS period_label
FROM energy_costs
WHERE measurement_date >= :start_date
  AND measurement_date <= :end_date
GROUP BY ts
ORDER BY ts;