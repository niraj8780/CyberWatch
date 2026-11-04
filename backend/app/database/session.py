"""Async database engine and session factory for SQLAlchemy 2.0."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

engine: AsyncEngine | None = None
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None

if settings.DATABASE_URL:
    try:
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            future=True,
        )
        AsyncSessionLocal = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        # Log database connection target safely without credentials
        safe_url = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "configured"
        logger.info("database_engine_initialized", host=safe_url)
    except Exception as exc:
        logger.warning("database_engine_initialization_error", error=str(exc))
        engine = None
        AsyncSessionLocal = None
else:
    logger.info("database_url_not_set_skipping_persistence")


async def get_db() -> AsyncGenerator[AsyncSession | None, None]:
    """FastAPI dependency yielding an async database session when configured."""
    if AsyncSessionLocal is None:
        yield None
        return

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
