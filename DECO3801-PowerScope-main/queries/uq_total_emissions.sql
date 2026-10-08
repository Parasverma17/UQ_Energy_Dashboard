----------- UQ emissions total compared
WITH 
bounds AS (
    SELECT date_trunc('year', max(measurement_date)) AS cur_start, 
        date_trunc('day', max(measurement_date)) + interval '1 day' as cur_end

    FROM nmi_5min_power
),

T2 AS (

SELECT 
    SUM(CASE WHEN  b.measurement_date >= d.cur_start  AND b.measurement_date <  d.cur_end THEN b.ea_imp_interval END) / 1000 as cur_eng, 
    SUM(CASE WHEN  b.measurement_date >= d.cur_start - interval '1 year'  AND b.measurement_date <  d.cur_end - interval '1 year' THEN b.ea_imp_interval END) / 1000 as prev_eng, 
    SUM(CASE WHEN  b.measurement_date >= d.cur_start  AND b.measurement_date <  d.cur_end THEN b.ea_imp_interval END) / 1000 * 0.67 as cur_emissions, 
    SUM(CASE WHEN  b.measurement_date >= d.cur_start - interval '1 year'  AND b.measurement_date <  d.cur_end - interval '1 year' THEN b.ea_imp_interval END) / 1000 * 0.67 as prev_emissions

FROM nmi_5min_power b

JOIN bounds d ON TRUE
)

SELECT * ,  (cur_emissions - prev_emissions) / prev_emissions * 100 as emissions_change  FROM T2;