WITH timeframe AS (
  SELECT date_trunc('month', CURRENT_DATE)::timestamptz AS start_this,
    (CURRENT_DATE + INTERVAL '1 day')::timestamptz AS end_this_todate,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 year')::timestamptz AS start_last,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 year'
       + (CURRENT_DATE - date_trunc('month', CURRENT_DATE))
       + INTERVAL '1 day')::timestamptz AS end_last_todate
)

-- This year's current month to-date
SELECT 'current_year' AS year,
  COALESCE(SUM( (COALESCE(ea_imp_interval,0) - COALESCE(ea_exp_interval,0)) / 1000.0 ), 0) AS total_kwh
FROM nmi_5min_power, timeframe
WHERE measurement_date >= timeframe.start_this
  AND measurement_date <  timeframe.end_this_todate

UNION ALL

-- Last year's same month to the same day-of-month
SELECT 'previous_year' AS year,
  COALESCE(SUM( (COALESCE(ea_imp_interval,0) - COALESCE(ea_exp_interval,0)) / 1000.0 ), 0) AS total_kwh
FROM nmi_5min_power, timeframe
WHERE measurement_date >= timeframe.start_last
  AND measurement_date <  timeframe.end_last_todate;
