from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from app.config import get_settings

settings = get_settings()

# Engine - NullPool for serverless/Oracle
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,  # Better for Oracle Cloud free tier
    echo=settings.DEBUG,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base for models
Base = declarative_base()


def get_db():
    """Dependency for getting DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables."""
    Base.metadata.create_all(bind=engine)

    # Lightweight migration: ensure profiles.image exists for avatar support
    try:
      inspector = inspect(engine)
      columns = [col.get("name") for col in inspector.get_columns("profiles")]
      if "image" not in columns:
          with engine.begin() as conn:
              conn.execute(text("ALTER TABLE profiles ADD COLUMN image VARCHAR(500)"))
    except Exception:
      # Do not block startup if migration check fails
      pass
