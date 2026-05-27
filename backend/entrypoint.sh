#!/bin/sh
set -e

echo "=== Running database migrations ==="

# If DB already has tables but no alembic_version (common on first HF/Supabase hookup),
# stamp the baseline revision so incremental migrations can run.
python - <<'PY'
import os
from sqlalchemy import create_engine, text

url = os.getenv("DATABASE_URL")
if not url:
    raise SystemExit(0)

engine = create_engine(url)
with engine.connect() as c:
    users = c.execute(text("select to_regclass('public.users')")).scalar()
    alembic_version = c.execute(text("select to_regclass('public.alembic_version')")).scalar()
    if users and not alembic_version:
        print("STAMP_001")
PY

if [ "$(python - <<'PY'
import os
from sqlalchemy import create_engine, text

url = os.getenv("DATABASE_URL")
if not url:
    print("")
    raise SystemExit(0)

engine = create_engine(url)
with engine.connect() as c:
    users = c.execute(text("select to_regclass('public.users')")).scalar()
    alembic_version = c.execute(text("select to_regclass('public.alembic_version')")).scalar()
    print("STAMP_001" if (users and not alembic_version) else "")
PY
)" = "STAMP_001" ]; then
  echo "=== Detected existing schema without alembic_version; stamping revision 001 ==="
  alembic stamp 001
fi

alembic upgrade head
echo "=== Migrations applied ==="

echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-7860}"
