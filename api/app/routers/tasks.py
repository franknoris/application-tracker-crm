from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import Task, User
from ..schemas.task import TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _get_owned_task(db: Session, task_id: int, user_id: int) -> Task:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("", response_model=list[TaskRead])
def list_tasks(
    done: bool | None = None,
    application_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Task]:
    stmt = select(Task).where(Task.user_id == user.id)
    if done is not None:
        stmt = stmt.where(Task.done.is_(done))
    if application_id is not None:
        stmt = stmt.where(Task.application_id == application_id)
    stmt = stmt.order_by(Task.due_date).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/due", response_model=list[TaskRead])
def due_tasks(
    within_days: int = 7,
    overdue: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Task]:
    today = date.today()
    stmt = select(Task).where(Task.user_id == user.id).where(Task.done.is_(False))
    if overdue:
        stmt = stmt.where(Task.due_date < today)
    else:
        horizon = today + timedelta(days=within_days)
        stmt = stmt.where(Task.due_date >= today).where(Task.due_date <= horizon)
    stmt = stmt.order_by(Task.due_date)
    return list(db.scalars(stmt).all())


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Task:
    task = Task(user_id=user.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Task:
    task = _get_owned_task(db, task_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    task = _get_owned_task(db, task_id, user.id)
    db.delete(task)
    db.commit()
