WITH 
bounds AS (
    SELECT date_trunc('day', max(measurement_date)) -  interval '30 days' AS cur_start, 
        date_trunc('day', max(measurement_date)) + interval '1 day' as cur_end

    FROM building_metrics
),

filtered AS (
	SELECT bi.building, (b.measurement_date AT TIME ZONE 'Australia/Brisbane') as date,
	COALESCE(b.ea_imp_interval,0) / 1000 as kwh_5min

	FROM building_metrics b
	JOIN building_ids bi ON bi.meter_id = b.device_code
	JOIN bounds d on TRUE
	WHERE b.measurement_date >= d.cur_start AND b.measurement_date < d.cur_end
	AND bi.building = COALESCE(NULLIF(:building,''),'0051')
--	AND bi.building = '0051'

),

hourly AS (
	SELECT building, date_trunc('day', date) as day_date, date_trunc('hour', date) as hour_date, 
	SUM(GREATEST(kwh_5min,0)) as kwh 
	FROM filtered
	GROUP BY building, date_trunc('day', date), date_trunc('hour',date)


),

avg_hourly AS (
	SELECT
	building, EXTRACT(HOUR FROM hour_date)::int as hour_of_day, 
		ROUND(AVG(kwh)::numeric, 2) AS avg_kwh
	FROM hourly
	GROUP BY building, EXTRACT(HOUR FROM hour_date)
),

hours AS (
	SELECT generate_series(0,23) AS hour_of_day
)

SELECT h.hour_of_day, COALESCE(a.avg_kwh,0) AS avg_kwh
	FROM hours h 
LEFT JOIN avg_hourly a ON a.hour_of_day = h.hour_of_day
ORDER BY h.hour_of_day;