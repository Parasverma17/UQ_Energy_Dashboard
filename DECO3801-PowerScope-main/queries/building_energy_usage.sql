------ Energy BreakDown (most utilised buildigns what buildings use what percent of power)

WITH 
bounds AS (
    SELECT date_trunc('year', max(measurement_date)) AS cur_start, 
        date_trunc('day', max(measurement_date)) + interval '1 day' as cur_end

    FROM building_metrics
),
T2 AS(
SELECT bi.building,  SUM(ea_imp_interval) / 1000 as kwh 
FROM building_metrics b
JOIN building_ids bi ON bi.meter_id = b.device_code 
JOIN bounds d ON TRUE 

WHERE b.measurement_date >= d.cur_start AND b.measurement_date < d.cur_end
GROUP BY bi.building)

select building, kwh, ROUND( (100.0 * kwh / NULLIF(SUM(kwh) OVER (), 0))::numeric, 2 ) as energy_share
FROM T2
GROUP BY building, kwh
ORDER BY energy_share;