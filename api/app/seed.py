from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from .db import SessionLocal
from .models import Application, Channel, Contact, Interaction, Organization, Stage, Task, User
from .security import hash_password


def seed() -> None:
    db = SessionLocal()
    try:
        count = db.scalar(select(func.count(User.id)))
        if count:
            print("Database already has users; skipping seed.")
            return

        user = User(email="demo@example.com", password_hash=hash_password("password123"))
        db.add(user)
        db.flush()

        oist = Organization(
            user_id=user.id,
            name="OIST",
            country="Japan",
            website="https://www.oist.jp",
            type="university",
            notes="Okinawa Institute of Science and Technology",
        )
        henge = Organization(
            user_id=user.id,
            name="HENNGE",
            country="Japan",
            website="https://hennge.com",
            type="company",
        )
        db.add_all([oist, henge])
        db.flush()

        prof = Contact(
            user_id=user.id,
            organization_id=oist.id,
            name="Prof. Takahashi",
            role="Lab PI",
            email="takahashi@example.jp",
            notes="Fake data for demo only",
        )
        db.add(prof)

        now = datetime.now(timezone.utc)
        oist_app = Application(
            user_id=user.id,
            organization_id=oist.id,
            program_name="OIST Research Internship 2027",
            stage=Stage.APPLYING,
            deadline=now + timedelta(days=14),
            deadline_timezone="Asia/Tokyo",
            priority="high",
            funding_notes="Fully funded",
            notes="Spring 2027 intake",
        )
        henge_app = Application(
            user_id=user.id,
            organization_id=henge.id,
            program_name="HENNGE Global Internship",
            stage=Stage.RESEARCHING,
            deadline=now + timedelta(days=60),
            deadline_timezone="Asia/Tokyo",
            priority="medium",
        )
        db.add_all([oist_app, henge_app])
        db.flush()

        interaction = Interaction(
            user_id=user.id,
            application_id=oist_app.id,
            contact_id=prof.id,
            channel=Channel.EMAIL,
            occurred_at=now - timedelta(days=1),
            summary="Asked the PI about research fit",
        )
        db.add(interaction)

        task1 = Task(
            user_id=user.id,
            application_id=oist_app.id,
            title="Finish cover letter",
            due_date=date.today() + timedelta(days=3),
        )
        task2 = Task(
            user_id=user.id,
            title="Follow up with HENNGE recruiter",
            due_date=date.today() + timedelta(days=10),
        )
        db.add_all([task1, task2])

        db.commit()
        print("Seeded demo user (demo@example.com / password123) with sample data.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
