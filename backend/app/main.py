"""CatalystAI — FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, catalysts, reactions, discovery, experiments, knowledge_graph

# Create all tables on startup (simple approach for dev / small deployments)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CatalystAI API",
    description="Backend API for the CatalystAI scientific discovery platform",
    version="1.0.0",
)

# CORS — allow the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(catalysts.router)
app.include_router(reactions.router)
app.include_router(discovery.router)
app.include_router(experiments.router)
app.include_router(knowledge_graph.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "catalystai-backend"}
