SELECT device_code, EXTRACT(HOUR from measurement_date) AS hour_of_day, AVG(ea_imp_interval) as avg_import
FROM public.NMI_5MIN_POWER
GROUP BY device_code, hour_of_day
ORDER BY device_code, hour_of_day;