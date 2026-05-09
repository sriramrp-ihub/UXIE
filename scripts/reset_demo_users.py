from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import create_engine, text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import get_settings
from app.core.security import get_password_hash


@dataclass(frozen=True)
class DemoUser:
    name: str
    email: str
    password: str
    role: str


DEMO_USERS = (
    DemoUser(
        name="Demo Learner",
        email="student@example.com",
        password="Password123!",
        role="student",
    ),
    DemoUser(
        name="Demo Admin",
        email="admin@example.com",
        password="Password123!",
        role="admin",
    ),
)


def reset_demo_users(replace_all_users: bool) -> None:
    settings = get_settings()
    engine = create_engine(settings.database_url, future=True)

    with engine.begin() as conn:
        if replace_all_users:
            conn.execute(text("TRUNCATE TABLE users CASCADE"))
            print("Truncated users table with CASCADE.")
        else:
            emails = [user.email for user in DEMO_USERS]
            conn.execute(
                text("DELETE FROM users WHERE email = ANY(:emails)"),
                {"emails": emails},
            )
            print("Removed existing demo users.")

        for user in DEMO_USERS:
            conn.execute(
                text(
                    """
                    INSERT INTO users (id, name, email, password_hash, role, is_verified)
                    VALUES (gen_random_uuid(), :name, :email, :password_hash, :role, true)
                    """
                ),
                {
                    "name": user.name,
                    "email": user.email,
                    "password_hash": get_password_hash(user.password),
                    "role": user.role,
                },
            )
            print(f"Created {user.role} user: {user.email}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reset the demo learner/admin accounts used by the frontend login pages."
    )
    parser.add_argument(
        "--replace-all-users",
        action="store_true",
        help="Delete every row in the users table before recreating the demo accounts.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    reset_demo_users(replace_all_users=args.replace_all_users)
