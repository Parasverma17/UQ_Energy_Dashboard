---Building emissions compared

WITH 
bounds AS (
    SELECT date_trunc('year', max(measurement_date)) AS cur_start, 
        date_trunc('day', max(measurement_date)) + interval '1 day' as cur_end

    FROM building_metrics
),


current_ytd AS(
SELECT bi.building, SUM(b.ea_imp_interval) / 1000 as current_energy, SUM(b.ea_imp_interval) / 1000 * 0.67 AS  cur_emissions
FROM building_metrics b
JOIN building_ids bi ON bi.meter_id = b.device_code
JOIN bounds d ON TRUE
WHERE b.measurement_date >= d.cur_start
    AND b.measurement_date < d.cur_end
GROUP BY bi.building
),


prev_ytd AS (
SELECT bi.building, SUM(b.ea_imp_interval) / 1000 as past_energy, SUM(b.ea_imp_interval) / 1000 * 0.67 AS  prev_emissions
FROM building_metrics b
JOIN building_ids bi ON bi.meter_id = b.device_code
JOIN bounds d ON TRUE
WHERE b.measurement_date >= d.cur_start - interval '1 year'
    AND b.measurement_date <  d.cur_end - interval '1 year'
GROUP BY bi.building

)

SELECT c.building, c.current_energy, c.cur_emissions, p.past_energy, p.prev_emissions,
    ((c.cur_emissions - p.prev_emissions) / p.prev_emissions * 100) AS emissions_change
FROM current_ytd c
JOIN prev_ytd p USING(building)
ORDER BY emissions_change;