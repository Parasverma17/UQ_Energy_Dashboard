SELECT year_date, month_date, avg_import FROM (


SELECT EXTRACT(YEAR from  measurement_date) as year_date, EXTRACT(MONTH from  measurement_date) AS month_num, 
            TO_CHAR(measurement_date, 'Mon') as month_date, 
            AVG(ea_imp_interval) as avg_import

FROM public.NMI_5MIN_POWER
GROUP BY year_date, month_num, month_date
ORDER BY year_date, month_num

) 

ORDER BY year_date, month_num;
