WITH 
bounds AS (
    SELECT date_trunc('year', max(measurement_date)) AS anchor_year_start, 
    max(measurement_date)AS anchor_max_ts,
    extract(doy FROM max(measurement_date))::int as days_into_year
    FROM building_metrics
),


current_ytd AS(
SELECT bi.meter_id, bi.load_description, SUM(b.ea_imp_interval) / 1000 as current_energy
FROM building_metrics b
JOIN building_ids bi ON bi.meter_id = b.device_code
JOIN bounds d ON TRUE
WHERE b.measurement_date >= d.anchor_year_start
    AND b.measurement_date < d.anchor_year_start + (d.days_into_year * interval '1 day')
GROUP BY bi.meter_id, bi.load_description
),


prev_ytd AS (
SELECT bi.meter_id, bi.load_description, SUM(b.ea_imp_interval) / 1000 as past_energy
FROM building_metrics b
JOIN building_ids bi ON bi.meter_id = b.device_code
JOIN bounds d ON TRUE
WHERE b.measurement_date >= (d.anchor_year_start - interval '1 year')
    AND b.measurement_date < (d.anchor_max_ts - interval '1 year' +  interval '1 day')
GROUP BY bi.meter_id, bi.load_description

)

SELECT 
    m.meter_id, m.load_description, m.current_energy, p.past_energy,
    (((m.current_energy - p.past_energy) / NULLIF(p.past_energy,0)) * 100) AS energy_change
    FROM current_ytd m
    LEFT JOIN prev_ytd p USING (meter_id, load_description)
    ORDER BY m.current_energy DESC;