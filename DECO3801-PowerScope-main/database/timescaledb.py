import psycopg2
import os
from datetime import datetime, timedelta
from dateutil.parser import isoparse
import requests
import pandas as pd
from psycopg2.extras import execute_values
import time 
from psycopg2 import OperationalError


for i in range(20):
    try:
        conn = psycopg2.connect(    
            # host="localhost",
            # database="postgres",
            # user="postgres",
            # password="Powerscope",
            # port="5424"

            host=os.getenv("DB_HOST","localhost"),
            database=os.getenv("DB_NAME","postgres"),
            user=os.getenv("POSTGRES_USER",os.getenv("DB_USER","postgres")),
            password=os.getenv("POSTGRES_PASSWORD", os.getenv("DB_PASSWORD","postgres")),
            port=os.getenv("DB_PORT", "5432")
        )
        break
    except  OperationalError as e:
        time.sleep(10)


building_paths = ["/data/room51_2024.csv","/data/room51_2025.csv"]
building_id = "/data/Meter IDs and Description.xlsx"

cur = conn.cursor()

cur.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")



cur.execute(""" 
CREATE TABLE IF NOT EXISTS NMI_5MIN_POWER (
    measurement_date   TIMESTAMPTZ,
    device_code        TEXT,
    P                  DOUBLE PRECISION,
    Q                  DOUBLE PRECISION,
    S                  DOUBLE PRECISION,
    PF                 DOUBLE PRECISION,
    quality            INTEGER,
    received_date      TIMESTAMPTZ,
    Ea_Exp_Interval    DOUBLE PRECISION,
    Ea_Imp_Interval    DOUBLE PRECISION,
    Er_Exp_Interval    DOUBLE PRECISION,
    Er_Imp_Interval    DOUBLE PRECISION,
    Es_Exp_Interval    DOUBLE PRECISION,
    Es_Imp_Interval    DOUBLE PRECISION,
    nem12QualityCode   TEXT
            
);


""")

cur.execute("""SELECT create_hypertable('NMI_5MIN_POWER', 'measurement_date', if_not_exists => TRUE);""")

conn.commit()

path = os.getenv("CSV_PATH", "data1.csv")

copy_sql = """
COPY NMI_5MIN_POWER (
    measurement_date, device_code, P, Q, S, PF, quality, received_date,
    Ea_Exp_Interval, Ea_Imp_Interval, Er_Exp_Interval, Er_Imp_Interval,
    Es_Exp_Interval, Es_Imp_Interval, nem12QualityCode
)
FROM STDIN WITH (FORMAT CSV, HEADER TRUE)

"""

with open(path, 'r',  encoding="utf-8") as f:
    cur.copy_expert(copy_sql,f)

conn.commit()



#Buildings data meter readings (we are doing for building 51)

# --- Meter and Building ID 
cur.execute("""
        CREATE TABLE IF NOT EXISTS building_ids(
                            meter_id TEXT PRIMARY KEY, 
                            load_description TEXT,
                            building TEXT);
""")

sheets = pd.read_excel(building_id, sheet_name=None)

dfs = []
for sheet_name, df in sheets.items():
    df = df.rename(columns={"Meter ID": "meter_id", "Load Description": "load_description"})
    df["building"] = str(sheet_name)

    dfs.append(df[["meter_id","load_description","building"]])

all_ids = pd.concat(dfs, ignore_index=True)


row_tuples = list(all_ids.itertuples(index=False, name=None))


execute_values(cur,"INSERT INTO building_ids (meter_id, load_description, building) VALUES %s ON CONFLICT (meter_id) DO NOTHING", row_tuples)

conn.commit()



cur.execute("""
    CREATE UNLOGGED TABLE IF NOT EXISTS building_metrics_staging (
            measurement_date    TIMESTAMPTZ,
            device_code     TEXT,
            metrics_json    jsonb
            );

""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS building_metrics (
            measurement_date    TIMESTAMPTZ,
            device_code     TEXT,
            Ea_Imp_Interval double precision,
            Ea_Exp_Interval double precision, 
            P    double precision,
            PF   double precision
            );

""")


cur.execute("""SELECT create_hypertable('building_metrics', 'measurement_date', if_not_exists => TRUE);""")

conn.commit()

for paths in building_paths:
    with open(paths, "r", encoding="utf-8") as f:
        cur.copy_expert("""
            COPY building_metrics_staging(measurement_date, device_code, metrics_json) FROM STDIN with (FORMAT CSV, HEADER TRUE) """,f ) 
        
conn.commit()


# # Transform WORKING
# cur.execute("""INSERT INTO building_metrics(measurement_date, device_code, Ea_Imp_Interval, Ea_Exp_Interval, P, PF)
#             SELECT 
#                 b.measurement_date, 
#                 b.device_code, 
#                 (b.metrics_json->>'Ea_Imp_Interval')::double precision,
#                 (b.metrics_json->>'Ea_Exp_Interval')::double precision,  
#                 (b.metrics_json->>'P')::double precision,
#                 (b.metrics_json->>'PF')::double precision

#             FROM building_metrics_staging b;   
            
#             """)

# conn.commit()

#Transform New
cur.execute(""" INSERT INTO building_metrics(measurement_date, device_code, Ea_Imp_Interval, Ea_Exp_Interval, P, PF
            )
            SELECT
            b.measurement_date, 
            b.device_code,
            j."Ea_Imp_Interval",
            j."Ea_Exp_Interval",
            j."P",
            j."PF"
            FROM building_metrics_staging as b
            CROSS JOIN LATERAL jsonb_to_record(b.metrics_json) AS j(
                "Ea_Imp_Interval" double precision,
                "Ea_Exp_Interval" double precision,
                "P"   double precision,
                "PF" double precision
        
            );
            
            
            """)



#Creating the Weather table
# Store UQ (St Lucia for now) lat/long for API access
LATITUDE = -27.4931014435591
LONGITUDE = 153.00685795194352

# TimescaleDB Table Name
TABLE_NAME = "weather"


# SQL Script to create table
cur.execute(""" 
CREATE TABLE IF NOT EXISTS weather (
time        TIMESTAMPTZ       NOT NULL,
temperature DOUBLE PRECISION  NULL,
humidity    DOUBLE PRECISION  NULL,
PRIMARY KEY (time)
);
""")

#TimescaleDB Hypertable 
cur.execute("""
SELECT create_hypertable('weather', 'time', if_not_exists => TRUE);
""")

ML_TABLE = "predictions"
ml_predictions_path = os.getenv("ML_PRED_PATH", "/data/lstm_pred_long.csv")

cur.execute(f"""
CREATE TABLE IF NOT EXISTS {ML_TABLE} (
    horizon_day INTEGER,
    forecast_energy DOUBLE PRECISION,
    forecast_date DATE
);
""")

conn.commit()

ml_df = pd.read_csv(ml_predictions_path)

ml_df_agg = (
    ml_df.groupby(["horizon_day", "forecast_date"], as_index=False)
          .agg({"forecast_energy": "mean"})
)
ml_df_agg = ml_df_agg[["horizon_day", "forecast_energy", "forecast_date"]]
ml_df_agg["forecast_energy"] = ml_df_agg["forecast_energy"] / 1000
rows = list(ml_df_agg.itertuples(index=False, name=None))

execute_values(
    cur,
    """
    INSERT INTO predictions (horizon_day, forecast_energy, forecast_date)
    VALUES %s
    ON CONFLICT DO NOTHING;
    """,
    rows
)

conn.commit()

def insert_data(conn, times, temps, hums):
    """Bulk insert of data into TimescaleDB"""
    for t, temp, hum in zip(times, temps, hums):
        cur.execute(
        f"""
        INSERT INTO {TABLE_NAME} (time, temperature, humidity)
        VALUES (%s, %s, %s)
        ON CONFLICT (time) DO NOTHING;
        """,
        (isoparse(t), temp, hum)
    )
    conn.commit()
    

def historical_data():
    # Date range of 1/1/2024 to 31/08/2025 (today - 1)
    start_date = datetime(2024, 1, 1)
    end_date = datetime.now() - timedelta(days=1)
    chunk_start = start_date

    # Have to access 1 month chunks as per Open-Mateo requirements
    while chunk_start <= end_date:
        chunk_end = min(chunk_start + timedelta(days=30), end_date)
        url = (
            f"https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={LATITUDE}&longitude={LONGITUDE}"
            f"&start_date={chunk_start.date()}&end_date={chunk_end.date()}"
            "&hourly=temperature_2m,relative_humidity_2m"
        )
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json().get("hourly", {})
        times = data.get("time", [])
        temps = data.get("temperature_2m", [])
        hums = data.get("relative_humidity_2m", [])

        if times:
            insert_data(conn, times, temps, hums)
            print(f"Inserted {len(times)} rows: {chunk_start.date()} : {chunk_end.date()}")
        chunk_start = chunk_end + timedelta(days=1)

historical_data()

cur.execute("""
CREATE TABLE IF NOT EXISTS energy_prices (
    region TEXT NOT NULL,
    settlementdate TIMESTAMPTZ NOT NULL,
    totaldemand DOUBLE PRECISION,
    rrp DOUBLE PRECISION,
    periodtype TEXT,
    primary key (settlementdate)
);
""")

cur.execute("""
SELECT create_hypertable('energy_prices', 'settlementdate', if_not_exists => TRUE);
""")

conn.commit()

price_path = os.getenv("PRICE_CSV_PATH", "/data/energy_cost.csv")

aemo_df = pd.read_csv(price_path)

aemo_df.columns = [c.strip().lower() for c in aemo_df.columns]
aemo_df["settlementdate"] = pd.to_datetime(aemo_df["settlementdate"], errors="coerce")

rows = list(aemo_df[["region", "settlementdate", "totaldemand", "rrp", "periodtype"]].itertuples(index=False, name=None))

execute_values(
    cur,
    """
    INSERT INTO energy_prices (region, settlementdate, totaldemand, rrp, periodtype)
    VALUES %s
    on conflict (settlementdate) do nothing;
    """,
    rows
)

conn.commit()

# Energy cost MV
cur.execute("""
CREATE MATERIALIZED VIEW IF NOT EXISTS energy_costs AS
WITH usage_mwh AS (
    SELECT
        n.measurement_date,
        n.device_code,
        n.Ea_Imp_Interval / 1000000.0 AS energy_mwh
    FROM NMI_5MIN_POWER n
)
SELECT
    u.measurement_date,
    u.device_code,
    u.energy_mwh,
    e.rrp AS price_per_mwh,
    u.energy_mwh * e.rrp AS cost
FROM usage_mwh u
JOIN energy_prices e
    ON u.measurement_date = e.settlementdate
WITH NO DATA;
""")
conn.commit()


cur.execute("REFRESH MATERIALIZED VIEW energy_costs;")
conn.commit()

# Create dashboard_overlay materialized view
cur.execute("""
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_overlay AS
WITH bucketed_costs AS (
    SELECT
        time_bucket('1 hour', measurement_date) AS ts,
        SUM(cost) AS total_cost,
        SUM(energy_mwh) * 1000 AS total_energy_kwh,
        AVG(price_per_mwh / 1000) AS avg_price_per_kwh
    FROM energy_costs
    GROUP BY ts
),
bucketed_weather AS (
    SELECT
        time AS ts,
        temperature AS avg_temp_c,
        humidity AS avg_humidity
    FROM weather
)
SELECT
    c.ts AS timestamp,
    c.total_cost,
    c.total_energy_kwh,
    c.avg_price_per_kwh,
    w.avg_temp_c,
    w.avg_humidity
FROM bucketed_costs c
LEFT JOIN bucketed_weather w ON c.ts = w.ts;
""")
conn.commit()

cur.execute("REFRESH MATERIALIZED VIEW dashboard_overlay;")
conn.commit()

# Weekly rollup
cur.execute(
"""
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_weekly AS
SELECT
    time_bucket('1 week', measurement_date) AS ts,
    SUM(cost) AS total_cost,
    SUM(energy_mwh) * 1000 AS total_energy_kwh,
    AVG(price_per_mwh / 1000) AS avg_price_per_kwh
FROM energy_costs
GROUP BY ts;
"""
)
conn.commit()

# Monthly rollup
cur.execute(
"""
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_monthly AS
SELECT
    time_bucket('1 month', measurement_date) AS ts,
    SUM(cost) AS total_cost,
    SUM(energy_mwh) * 1000 AS total_energy_kwh,
    AVG(price_per_mwh / 1000) AS avg_price_per_kwh
FROM energy_costs
GROUP BY ts;
"""
)
conn.commit()

# Yearly rollup
cur.execute(
"""
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_yearly AS
SELECT
    DATE_TRUNC('year', measurement_date) AS ts,
    SUM(cost) AS total_cost,
    SUM(energy_mwh) * 1000 AS total_energy_kwh,
    AVG(price_per_mwh / 1000) AS avg_price_per_kwh
FROM energy_costs
GROUP BY ts;
"""
)
conn.commit()

cur.close()