# CatalystAI

CatalystAI is a platform for discovering and optimizing catalytic and synthetic biology pathways. This repository contains both the React/Vite frontend and the Python/FastAPI backend.

## Project Structure

- `/` (Root): React frontend powered by Vite and Tailwind CSS.
- `/backend`: FastAPI backend with a SQLite database.

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup

The backend uses Python and FastAPI. It is recommended to use Python 3.12 (as pinned in `backend/.python-version`).

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database with initial mock data (catalysts, realistic reactions, knowledge graph):
   ```bash
   python seed.py
   ```
5. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will now be running at `http://localhost:8000`.*

### 2. Frontend Setup

1. Open a new terminal and stay in the project root folder.
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

> **Note:** If you are testing the backend locally, ensure your API config points to `http://localhost:8000`. By default, it will fall back to the deployed backend URL if `VITE_API_URL` is not set.

---

## 🌍 Deployment

### Frontend (Vercel)
The frontend is optimized for deployment on Vercel. 
- It includes a `vercel.json` file for SPA routing (to prevent 404 errors on page reloads).
- **Build command:** `npm run build`
- **Output directory:** `dist`

### Backend (Render)
The backend can be easily deployed to Render as a Web Service.
- **Root Directory:** `backend`
- **Environment:** Python 3
- **Build Command:** `pip install -r requirements.txt && python seed.py`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
