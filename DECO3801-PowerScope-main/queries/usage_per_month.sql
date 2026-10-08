SELECT year_date, month_date, imported_total FROM (


SELECT EXTRACT(YEAR from  measurement_date) as year_date, EXTRACT(MONTH from  measurement_date) AS month_num, 
            TO_CHAR(measurement_date, 'Mon') as month_date, 
            SUM(ea_imp_interval)/1000 as imported_total

FROM public.NMI_5MIN_POWER
GROUP BY year_date, month_num, month_date
ORDER BY year_date, month_num

) t 

ORDER BY year_date, month_num;
