 # DECO3801-PowerScope

This project is a data dashboard application for energy monitoring at UQ, built with Django and optionally exposing APIs via FastAPI. The project provides three main pages:

1. **Public Dashboard** – accessible immediately when visiting the website.
2. **Login Page** – where staff and researchers can log in.
3. **Private Dashboard** – accessible only after logging in, showing more detailed data.

## Project Structure

```
DECO3801-PowerScope/
│
├─ accounts/              # User authentication (login/logout)
├─ core/                  # Public dashboard pages
├─ dashboard/             # Private dashboard pages
├─ database/              # Database code and setup files
├─ queries/               # SQL queries in TimescaleDB for dashboard
├─ UQEnergyLens/          # Django project settings and URLs
├─ FastAPI/               # FastAPI app for APIs
├─ nginx/                 # Nginx config for reverse proxy & frontend
│
├─ ml/                    # Contains ML model support
├─ .env.example           # Template env vars (copy into .env)
├─ .env                   # Real env vars (ignored in git)
├─ docker-compose.yml     # Multi-service Docker config
├─ setup.sh               # Setup script (auto creates .env & runs docker)
├─ requirements.txt
├─ manage.py
└─ README.md

```

### ENV file setup
```bash
# ----------------------------
# TimescaleDB (energy data)
# ----------------------------
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Powerscope
POSTGRES_DB=energy_db
POSTGRES_PORT=5432

DB_HOST=timescaledb
DB_PORT=5432
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}

# FastAPI
DB_DSN=postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8001
QUERY_DIR=./queries

# ----------------------------
# Django (separate Postgres)
# ----------------------------
DJANGO_DB_HOST=postgres
DJANGO_DB_PORT=5432
DJANGO_DB_NAME=django_db
DJANGO_DB_USER=django
DJANGO_DB_PASSWORD=django_password

DATABASE_URL=postgres://${DJANGO_DB_USER}:${DJANGO_DB_PASSWORD}@${DJANGO_DB_HOST}:${DJANGO_DB_PORT}/${DJANGO_DB_NAME}
DJANGO_SETTINGS_MODULE=UQEnergyLens.settings
SECRET_KEY=Powerscope

ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```


### Django Apps

* **accounts** – handles user authentication (login/logout).
* **core** – contains the public dashboard views and templates.
* **dashboard** – contains the private dashboard views and templates.

## Data Models

All models are defined in `models.py` of the respective apps. Key points:

* Each dashboard-related app defines models corresponding to the data displayed in that dashboard.
* Example model structure in `dashboard/models.py`:

```python
from django.db import models

class EnergyData(models.Model):
    timestamp = models.DateTimeField()
    energy_value = models.FloatField()
    device_id = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.device_id} - {self.energy_value} at {self.timestamp}"
```

* Each model corresponds to a table in the SQLite database (`database.db`).
* These models are used by Django ORM to fetch, filter, and display data in the dashboards.

## Installation

1. **Locally install the codebase or clone from github**

```bash
git clone <repo_url>
cd DECO3801-PowerScope
```

2. **Create and activate a virtual environment (recommended)**

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

Example dependencies included:

```
python-dotenv==1.1.1
asgiref==3.9.1
Django==5.2.5
psycopg2-binary==2.9.10
sqlparse==0.5.3
tzdata==2025.2
fastapi==0.111.0
uvicorn==0.25.0
```

4. **Set up environment variables**

Use existing `.env` file or copy and paste example `.env` file to root directory if needed.


5. **Handle frontend dependencies and build**

```bash
# From FRONTEND/
npm install

# Development
npm run dev

# Production build
npm run build
npm run preview
```

Backend API is expected at http://localhost:8080 (via Nginx). Adjust URLs if your deployment differs.

## Environment

Create FRONTEND/.env with your Mapbox token (required for the 3D map component):

```env
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here (or use the provided .env file and token)
```

## Routing (src/routes/AppRoutes.jsx)

- `/` → Public dashboard (`pages/Publicdashboard.jsx`)
- `/login` → Login page (`pages/LoginPage.jsx`)
- `/dashboard` → Private dashboard (`pages/Dashboard.jsx`)
- `/home` → Optional landing
- `/public_dashboard` → Alias for the public dashboard

## Pages

### Private dashboard (`pages/Dashboard.jsx`)
### Public dashboard (`pages/Publicdashboard.jsx`)
### Login (`pages/LoginPage.jsx`)

## Running the Project

1. Install the Docker app if not already on system
2. run docker-compose build  --> this builds the TimescaleDB and Postgres images, and builds the containers necessary for the project
3. run docker-compose up --> this reads data and starts all services relevant to the project

## Accessing the Project pages
1. The frontend is served on http://localhost:8080/ which is the public dashboard
2. From http://localhost:8080/ click the login button in the top right and enter a valid email address and any password to view the private dashboard. Alternatively, directly view the private dashboard served on http://localhost:8080/dashboard 

## Features
The project pages all include interactive features which are demonstrated in the included video.