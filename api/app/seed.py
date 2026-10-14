from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from .db import SessionLocal
from .models import Application, Channel, Contact, Interaction, Organization, Stage, Task, User
from .security import hash_password


def months_ago(n: int, *, day: int = 12) -> datetime:
    now = datetime.now(timezone.utc)
    year = now.year
    month = now.month - n
    while month <= 0:
        month += 12
        year -= 1
    return datetime(year, month, day, 12, 0, tzinfo=timezone.utc)


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

        orgs = {
            "oist": Organization(
                user_id=user.id,
                name="OIST",
                country="Japan",
                website="https://www.oist.jp",
                type="university",
                notes="Okinawa Institute of Science and Technology",
            ),
            "henge": Organization(
                user_id=user.id, name="HENNGE", country="Japan", website="https://hennge.com", type="company"
            ),
            "rakuten": Organization(
                user_id=user.id, name="Rakuten", country="Japan", website="https://rakuten.com", type="company"
            ),
            "kyoto": Organization(user_id=user.id, name="Kyoto University", country="Japan", type="university"),
            "nims": Organization(
                user_id=user.id,
                name="NIMS",
                country="Japan",
                type="institute",
                notes="National Institute for Materials Science",
            ),
            "sony": Organization(
                user_id=user.id, name="Sony", country="Japan", website="https://sony.com", type="company"
            ),
            "tohoku": Organization(user_id=user.id, name="Tohoku University", country="Japan", type="university"),
        }
        db.add_all(list(orgs.values()))
        db.flush()

        prof = Contact(
            user_id=user.id,
            organization_id=orgs["oist"].id,
            name="Prof. Takahashi",
            role="Lab PI",
            email="takahashi@example.jp",
            notes="Fake data for demo only",
        )
        recruiter = Contact(
            user_id=user.id,
            organization_id=orgs["henge"].id,
            name="Aiko Sato",
            role="Recruiter",
            email="sato@example.jp",
            notes="Fake data for demo only",
        )
        db.add_all([prof, recruiter])
        db.flush()

        now = datetime.now(timezone.utc)

        # (organization, program, stage, created months ago, deadline days from now, priority)
        rows = [
            ("oist", "OIST Research Internship 2027", Stage.APPLYING, 11, 5, "high"),
            ("henge", "HENNGE Global Internship", Stage.RESEARCHING, 10, 60, "medium"),
            ("rakuten", "Rakuten Summer Internship", Stage.SUBMITTED, 9, 30, "high"),
            ("kyoto", "Kyoto University MEXT Scholarship", Stage.CONTACTED, 8, None, "medium"),
            ("nims", "NIMS Summer Research Program", Stage.INTERVIEW, 7, 20, "high"),
            ("sony", "Sony Graduate Program", Stage.APPLYING, 6, None, "low"),
            ("tohoku", "Tohoku University Scholarship", Stage.OFFER, 5, 45, "high"),
            ("oist", "OIST PhD Track", Stage.REJECTED, 4, None, "medium"),
            ("henge", "HENNGE Backend Intern", Stage.SUBMITTED, 3, None, "medium"),
            ("kyoto", "Kyoto iUP", Stage.CONTACTED, 2, None, "low"),
            ("rakuten", "Rakuten Data Science Intern", Stage.RESEARCHING, 1, None, "medium"),
            ("nims", "NIMS Winter Internship", Stage.WITHDRAWN, 0, None, "low"),
        ]

        apps: dict[str, Application] = {}
        for key, program, stage, ago, deadline, priority in rows:
            application = Application(
                user_id=user.id,
                organization_id=orgs[key].id,
                program_name=program,
                stage=stage,
                deadline=(now + timedelta(days=deadline)) if deadline is not None else None,
                deadline_timezone="Asia/Tokyo",
                priority=priority,
                created_at=months_ago(ago),
            )
            apps[program] = application
            db.add(application)
        db.flush()

        interactions = [
            Interaction(
                user_id=user.id,
                application_id=apps["OIST Research Internship 2027"].id,
                contact_id=prof.id,
                channel=Channel.EMAIL,
                occurred_at=now - timedelta(days=1),
                summary="Asked the PI about research fit",
            ),
            Interaction(
                user_id=user.id,
                application_id=apps["HENNGE Global Internship"].id,
                contact_id=recruiter.id,
                channel=Channel.EMAIL,
                occurred_at=months_ago(8, day=20),
                summary="Intro email to the recruiter",
            ),
            Interaction(
                user_id=user.id,
                application_id=apps["Rakuten Summer Internship"].id,
                channel=Channel.PORTAL,
                occurred_at=months_ago(7, day=8),
                summary="Submitted the online application",
            ),
            Interaction(
                user_id=user.id,
                application_id=apps["NIMS Summer Research Program"].id,
                channel=Channel.CALL,
                occurred_at=months_ago(4, day=15),
                summary="Phone screen with the lab manager",
            ),
            Interaction(
                user_id=user.id,
                application_id=apps["Tohoku University Scholarship"].id,
                channel=Channel.MEETING,
                occurred_at=months_ago(2, day=3),
                summary="Interview panel",
            ),
            Interaction(
                user_id=user.id,
                application_id=apps["Kyoto iUP"].id,
                channel=Channel.EMAIL,
                occurred_at=months_ago(1, day=22),
                summary="Followed up on documents",
            ),
        ]
        db.add_all(interactions)

        task1 = Task(
            user_id=user.id,
            application_id=apps["OIST Research Internship 2027"].id,
            title="Finish cover letter",
            due_date=date.today() + timedelta(days=3),
        )
        task2 = Task(
            user_id=user.id,
            application_id=apps["HENNGE Global Internship"].id,
            title="Follow up with HENNGE recruiter",
            due_date=date.today() + timedelta(days=10),
        )
        task3 = Task(user_id=user.id, title="Request transcript", due_date=date.today() - timedelta(days=2))
        db.add_all([task1, task2, task3])

        db.commit()
        print("Seeded demo user (demo@example.com / password123) with sample data.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
