from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.config import get_settings

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API para GymTracker - Gestión de perfiles de entrenamiento",
    version="1.0.0",
)

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    if settings.AUTO_INIT_DB:
        init_db()


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Import and include routers
from app.api import auth, profiles, training_days, training_days_seed, sessions, weight, recovery, analytics

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(training_days.router, prefix="/api/profiles", tags=["training_days"])
app.include_router(training_days_seed.router, prefix="/api/profiles", tags=["training_days"])
app.include_router(sessions.router, prefix="/api/profiles", tags=["sessions"])
app.include_router(weight.router, prefix="/api/weight", tags=["weight"])
app.include_router(recovery.router, prefix="/api", tags=["recovery"])
app.include_router(analytics.router, prefix="/api/profiles", tags=["analytics"])
