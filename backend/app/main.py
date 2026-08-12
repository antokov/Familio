from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import documents, events, family_members, shopping, tasks
from app.services.notifications import send_tomorrow_events_notification


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    scheduler = AsyncIOScheduler()
    scheduler.add_job(send_tomorrow_events_notification, "cron", hour=21, minute=0)
    scheduler.start()

    yield

    scheduler.shutdown()


app = FastAPI(title="Familio API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(events.router)
app.include_router(family_members.router)
app.include_router(shopping.router)
app.include_router(documents.router)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
