"""
Database migration runner for the briefing system.

This utility provides a robust, lightweight mechanism for applying and 
reverting SQL-based migrations. It manages a `schema_migrations` table 
to track applied scripts and ensure idempotency.

Usage:
    python -m app.db.run_migrations up
    python -m app.db.run_migrations down --steps 1
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Optional

import psycopg
from sqlalchemy.engine import make_url

from app.config import get_settings

# Absolute path to the migrations directory.
MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "db" / "migrations"


def _get_database_url() -> str:
    """Retrieve the database URL from environment or configuration."""
    database_url = os.getenv("DATABASE_URL") or get_settings().database_url
    if not database_url:
        print("Error: DATABASE_URL is not set.", file=sys.stderr)
        sys.exit(1)
    return database_url


def _to_psycopg_conninfo(database_url: str) -> str:
    """Transform a SQLAlchemy URL into a psycopg-compatible conninfo string."""
    if "postgresql+" in database_url:
        sqlalchemy_url = make_url(database_url)
        return sqlalchemy_url.set(drivername="postgresql").render_as_string(hide_password=False)
    return database_url


def _ensure_migration_table(conn: psycopg.Connection) -> None:
    """Ensure the schema tracking table exists."""
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            """
        )
    conn.commit()


def _get_applied_migrations(conn: psycopg.Connection) -> set[str]:
    """Retrieve the set of filenames for already applied migrations."""
    with conn.cursor() as cur:
        cur.execute("SELECT filename FROM schema_migrations;")
        rows = cur.fetchall()
    return {row[0] for row in rows}


def _execute_migration(conn: psycopg.Connection, filename: str, sql: str, direction: str) -> None:
    """Execute a migration script and update the tracking table."""
    with conn.cursor() as cur:
        cur.execute(sql)
        if direction == "up":
            cur.execute(
                "INSERT INTO schema_migrations (filename) VALUES (%s);",
                (filename,),
            )
        else:
            cur.execute(
                "DELETE FROM schema_migrations WHERE filename = %s;",
                (filename,),
            )
    conn.commit()


def _is_up_script(filename: str) -> bool:
    """Identify if a file is an 'up' migration script."""
    return filename.endswith(".sql") and not filename.endswith(".down.sql")


def _get_down_script_name(up_filename: str) -> str:
    """Construct the corresponding 'down' script name for an 'up' script."""
    if up_filename.endswith(".sql"):
        return up_filename[:-4] + ".down.sql"
    raise ValueError(f"Invalid migration filename format: {up_filename}")


def _run_up_migrations(conn: psycopg.Connection) -> None:
    """Apply all pending 'up' migrations in lexicographical order."""
    applied = _get_applied_migrations(conn)
    scripts = sorted([p.name for p in MIGRATIONS_DIR.glob("*.sql") if _is_up_script(p.name)])

    applied_count = 0
    for script in scripts:
        if script in applied:
            continue

        sql = (MIGRATIONS_DIR / script).read_text(encoding="utf-8")
        print(f"Applying: {script}")
        _execute_migration(conn, script, sql, "up")
        applied_count += 1

    print(f"Migration sequence complete. Applied {applied_count} new scripts.")


def _run_down_migrations(conn: psycopg.Connection, steps: int) -> None:
    """Revert the specified number of most recently applied migrations."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT filename FROM schema_migrations 
            ORDER BY applied_at DESC, filename DESC 
            LIMIT %s;
            """,
            (steps,),
        )
        to_revert = [row[0] for row in cur.fetchall()]

    if not to_revert:
        print("No applied migrations found to revert.")
        return

    reverted_count = 0
    for script in to_revert:
        down_script = _get_down_script_name(script)
        down_path = MIGRATIONS_DIR / down_script
        
        if not down_path.exists():
            print(f"Error: Missing rollback script '{down_script}' for '{script}'", file=sys.stderr)
            sys.exit(1)

        sql = down_path.read_text(encoding="utf-8")
        print(f"Reverting: {script} (using {down_script})")
        _execute_migration(conn, script, sql, "down")
        reverted_count += 1

    print(f"Rollback sequence complete. Reverted {reverted_count} scripts.")


def main() -> None:
    """Main entry point for the migration runner CLI."""
    parser = argparse.ArgumentParser(description="Intelligence Briefing Migration Runner")
    parser.add_argument("command", choices=["up", "down"], default="up", help="Action to perform")
    parser.add_argument("--steps", type=int, default=1, help="Number of steps for rollback")
    args = parser.parse_args()

    conninfo = _to_psycopg_conninfo(_get_database_url())

    try:
        with psycopg.connect(conninfo) as conn:
            _ensure_migration_table(conn)
            if args.command == "up":
                _run_up_migrations(conn)
            else:
                _run_down_migrations(conn, args.steps)
    except Exception as exc:
        print(f"Migration Failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
