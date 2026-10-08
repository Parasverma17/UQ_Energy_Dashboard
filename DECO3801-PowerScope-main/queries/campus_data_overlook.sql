WITH 
bounds AS (
	SELECT date_trunc('year', max(measurement_date)) AS cur_start, 
		date_trunc('day', max(measurement_date)) + interval '1 day' as cur_end
		
	FROM nmi_5min_power
),
windows AS (
	SELECT 
	cur_end - interval '30 days' AS cur_30_start, 
	cur_end AS cur_30_end,
	cur_end - interval '60 days' AS prev_30_start, 
	cur_end - interval '30 days' AS prev_30_end
	FROM BOUNDS 

),

cur AS (
	SELECT sum(p.ea_imp_interval) / 1000 as imp, sum(p.ea_exp_interval) / 1000 as exp, 
		SUM(GREATEST(0,p.ea_imp_interval -p.ea_exp_interval)) /1000 as net_kwh
	
	FROM nmi_5min_power p 
	JOIN windows w ON TRUE
	WHERE p.measurement_date >= w.cur_30_start AND p.measurement_date < cur_30_end
),

prev AS (
	SELECT sum(p.ea_imp_interval) / 1000 as imp, sum(p.ea_exp_interval) / 1000 as exp, 
		SUM(GREATEST(0,p.ea_imp_interval -p.ea_exp_interval)) /1000 as net_kwh
	FROM nmi_5min_power p 
	JOIN windows w ON TRUE
	WHERE p.measurement_date >= w.prev_30_start AND p.measurement_date < prev_30_end
)

SELECT 
	c.imp as current_kwh,
	p.imp as previous_kwh, 
	
	(c.net_kwh * 0.67) / 1000 AS current_tco2e,
	(p.net_kwh * 0.67) / 1000 AS previous_tco2e,
	
	c.imp  * 0.314 AS current_cost, 
	p.imp   * 0.314 AS prev_cost

FROM cur c 
CROSS JOIN prev p;
