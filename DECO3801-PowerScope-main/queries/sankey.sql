
WITH base AS (
    SELECT bid.building, 
           bid.meter_id, 
           bid.load_description, 
           GREATEST(0.0, COALESCE(b.ea_imp_interval,0) - COALESCE(b.ea_exp_interval,0)) / 1000 as net_kwh
    
    FROM building_metrics b
    JOIN building_ids bid  ON  b.device_code = bid.meter_id
    WHERE b.measurement_date >= '2024-01-01' AND b.measurement_date < '2025-09-30' AND bid.building = COALESCE(NULLIF(:building,''),'0051')

)


SELECT building  AS source, (meter_id || '-' || load_description) as end_point, sum(net_kwh) as kwh 
FROM base
GROUP BY building, (meter_id || '-' || load_description);


















