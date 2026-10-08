WITH timeframe AS (
  SELECT date_trunc('year', CURRENT_DATE)::timestamptz AS start_this,
    (CURRENT_DATE + INTERVAL '1 day')::timestamptz AS end_this_todate,
    (date_trunc('year', CURRENT_DATE) - INTERVAL '1 year')::timestamptz AS start_last,
    (CURRENT_DATE - INTERVAL '1 year' + INTERVAL '1 day')::timestamptz  AS end_last_todate
),
agg AS (
  SELECT SUM( (COALESCE(ea_imp_interval,0) - COALESCE(ea_exp_interval,0)) / 1000.0 )
      FILTER (WHERE measurement_date >= tf.start_this
              AND   measurement_date <  tf.end_this_todate) AS current_year,
    SUM( (COALESCE(ea_imp_interval,0) - COALESCE(ea_exp_interval,0)) / 1000.0 )
      FILTER (WHERE measurement_date >= tf.start_last
              AND   measurement_date <  tf.end_last_todate) AS previous_year
  FROM nmi_5min_power p
  CROSS JOIN timeframe tf
)
SELECT COALESCE(previous_year, 0) AS previous_year,
  COALESCE(current_year, 0) AS current_year,
  COALESCE(current_year, 0) - COALESCE(previous_year, 0) AS difference_in_usage,
  CASE
    WHEN COALESCE(previous_year,0) = 0 THEN NULL
    ELSE 100.0 * (COALESCE(current_year,0) - COALESCE(previous_year,0)) / previous_year
  END AS percent_change
FROM agg;
