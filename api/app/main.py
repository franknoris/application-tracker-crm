from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import applications, auth, contacts, interactions, organizations, tasks

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(contacts.router)
app.include_router(applications.router)
app.include_router(interactions.router)
app.include_router(tasks.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
