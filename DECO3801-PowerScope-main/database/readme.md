Must have Docker Desktop app installed on PC 

To run the docker container open up powershell and naviagte to database folder

in the DATABASE folder run docker compose up --build

open a new powershell and navigate to database folder

run docker exec -it timescaledb psql -U postgres -d postgres 


