SELECT 
    TO_CHAR(measurement_date, 'Dy') as day_of_week,
    AVG(ea_imp_interval) AS imported

FROM NMI_5MIN_POWER
GROUP BY EXTRACT(DOW from measurement_date), day_of_week
ORDER BY EXTRACT(DOW from measurement_date);
