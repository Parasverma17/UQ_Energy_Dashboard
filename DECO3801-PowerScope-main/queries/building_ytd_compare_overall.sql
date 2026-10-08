WITH timeframe AS (
  SELECT date_trunc('year', CURRENT_DATE) AS start_this,
    CURRENT_DATE AS end_this,
    (date_trunc('year', CURRENT_DATE) - INTERVAL '1 year') AS start_last,
    (CURRENT_DATE - INTERVAL '1 year') AS end_last
),
agg AS (
  -- Last year (YTD up to today's date-of-year)
  SELECT SUM( (COALESCE(bm.ea_imp_interval,0) - COALESCE(bm.ea_exp_interval,0)) / 1000.0 )
      FILTER (WHERE bm.measurement_date >= tf.start_last
              AND   bm.measurement_date <  (tf.end_last + INTERVAL '1 day')) AS previous_year,

    -- Current year (YTD up to today)
    SUM( (COALESCE(bm.ea_imp_interval,0) - COALESCE(bm.ea_exp_interval,0)) / 1000.0 )
      FILTER (WHERE bm.measurement_date >= tf.start_this
              AND   bm.measurement_date <  (tf.end_this + INTERVAL '1 day')) AS current_year
  FROM building_metrics bm
  JOIN building_ids bid ON bm.device_code = bid.meter_id
  CROSS JOIN timeframe tf
  WHERE bid.building = '0051'
)
SELECT
  COALESCE(previous_year, 0) AS previous_year,
  COALESCE(current_year, 0) AS current_year,
  COALESCE(current_year, 0) - COALESCE(previous_year, 0) AS difference_in_usage,
  CASE
    WHEN COALESCE(previous_year, 0) = 0 THEN NULL
    ELSE 100.0 * (COALESCE(current_year, 0) - COALESCE(previous_year, 0)) / previous_year
  END  
  AS percent_change
FROM agg;
