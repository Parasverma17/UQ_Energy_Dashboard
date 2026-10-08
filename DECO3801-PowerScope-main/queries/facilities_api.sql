--facilities API
WITH

bounds AS (
	SELECT date_trunc('year', max(measurement_date)) AS cur_start, 
		date_trunc('day', max(measurement_date)) + interval '1 day' as cur_end
		
	FROM building_metrics
),

avg_cost AS (SELECT avg(e.rrp) as avg_cost FROM energy_prices e
	JOIN bounds d ON e.settlementdate >= cur_start AND e.settlementdate < cur_end
),

avg AS(
	SELECT
	bi.building, 
	SUM (b.ea_imp_interval) / 1000 AS energy
	FROM building_metrics b
	JOIN building_ids bi ON bi.meter_id = b.device_code
	JOIN bounds d on TRUE
	WHERE b.measurement_date >= cur_start AND b.measurement_date < cur_end
	GROUP BY bi.building

)
SELECT	
	a.building as Facility, '$' || TO_CHAR(((a.energy::numeric) * (c.avg_cost / 1000::numeric))::numeric, 'FM99,999,990.00') as cost,
	a.energy * 0.036  as energy_GJ, 
	a.energy * 0.67 / 1000 as emissions_T_CO2e,
	a.energy as consumption
FROM avg a
CROSS JOIN avg_cost c
ORDER BY cost DESC;