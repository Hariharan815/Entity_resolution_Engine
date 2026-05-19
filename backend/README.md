# INFYNDTASK Backend

FastAPI backend scaffold for upload, resolution, review feedback, export, audit, and stats flows.

## Run

1. Create and activate a Python environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start API server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
   ```

## Database Setup

1. Install MySQL Server.
2. Create database:
   ```sql
   CREATE DATABASE entity_resolution CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Copy environment template and set credentials:
   ```bash
   copy .env.example .env
   ```
4. Start API server (tables are auto-created on startup):
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
   ```

No migrations tool is needed: `create_all_tables()` uses `CREATE TABLE IF NOT EXISTS`, so running it repeatedly is safe.

## API Routes

- `POST /upload`
- `POST /resolve`
- `GET /results`
- `POST /feedback`
- `GET /export?fmt=csv|xlsx`
- `GET /audit`
- `GET /stats`
- `GET /health`

## Data Folders

- `data/uploads` incoming files and latest upload snapshot
- `data/golden` resolved outputs and audit log
- `data/models` persisted model artifacts
- `data/labels` feedback-based ground-truth labels
