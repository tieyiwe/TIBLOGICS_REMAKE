#!/usr/bin/env bash
#
# Move this app's Postgres from one host to another (e.g. Supabase -> Neon).
#
# Supabase is only a Postgres host for this project — no Supabase Auth,
# Storage, Realtime or RLS — so the move is a dump, a restore, and a changed
# connection string.
#
# NOTHING IS DELETED. The old database is only ever read from. If the restore
# goes wrong, point DATABASE_URL back at the old host and you are live again.
#
# Usage:
#   OLD_DB_URL="postgresql://..." NEW_DB_URL="postgresql://..." \
#     bash scripts/migrate-database.sh
#
set -euo pipefail

if [[ -z "${OLD_DB_URL:-}" || -z "${NEW_DB_URL:-}" ]]; then
  echo "ERROR: set both OLD_DB_URL and NEW_DB_URL" >&2
  echo "  OLD_DB_URL = current Supabase connection string" >&2
  echo "  NEW_DB_URL = new Neon connection string" >&2
  exit 1
fi

DUMP_DIR="${DUMP_DIR:-./db-migration}"
mkdir -p "$DUMP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="$DUMP_DIR/backup-$STAMP.dump"

echo "==> 1/5  Checking both databases are reachable"
psql "$OLD_DB_URL" -c "SELECT 1;" >/dev/null || { echo "Cannot reach OLD_DB_URL" >&2; exit 1; }
psql "$NEW_DB_URL" -c "SELECT 1;" >/dev/null || { echo "Cannot reach NEW_DB_URL" >&2; exit 1; }
echo "    both reachable"

echo "==> 2/5  Recording row counts on the OLD database (to verify against later)"
psql "$OLD_DB_URL" -At -F',' -c "
  SELECT relname, n_live_tup
  FROM pg_stat_user_tables
  WHERE schemaname='public' AND n_live_tup > 0
  ORDER BY relname;" > "$DUMP_DIR/counts-old-$STAMP.csv"
echo "    $(wc -l < "$DUMP_DIR/counts-old-$STAMP.csv") non-empty tables"

echo "==> 3/5  Dumping OLD database -> $DUMP_FILE"
# --no-owner / --no-acl: role names differ between hosts and would error.
pg_dump "$OLD_DB_URL" --no-owner --no-acl --format=custom --file="$DUMP_FILE"
echo "    dump size: $(du -h "$DUMP_FILE" | cut -f1)"

echo "==> 4/5  Restoring into NEW database"
# --clean --if-exists makes the restore repeatable: re-running replaces the
# objects rather than failing on "already exists".
pg_restore \
  --dbname="$NEW_DB_URL" \
  --no-owner --no-acl \
  --clean --if-exists \
  --exit-on-error \
  "$DUMP_FILE"
echo "    restore complete"

echo "==> 5/5  Verifying row counts match"
psql "$NEW_DB_URL" -c "ANALYZE;" >/dev/null
psql "$NEW_DB_URL" -At -F',' -c "
  SELECT relname, n_live_tup
  FROM pg_stat_user_tables
  WHERE schemaname='public' AND n_live_tup > 0
  ORDER BY relname;" > "$DUMP_DIR/counts-new-$STAMP.csv"

if diff -q "$DUMP_DIR/counts-old-$STAMP.csv" "$DUMP_DIR/counts-new-$STAMP.csv" >/dev/null; then
  echo "    row counts match exactly"
else
  echo ""
  echo "    ROW COUNTS DIFFER (old | new):"
  diff --side-by-side --suppress-common-lines \
    "$DUMP_DIR/counts-old-$STAMP.csv" "$DUMP_DIR/counts-new-$STAMP.csv" || true
  echo ""
  echo "    Small differences in analytics tables are expected — the old site"
  echo "    is still taking traffic while this runs. Any difference in"
  echo "    Student, LearnCertificate, Order or Appointment is NOT expected:"
  echo "    investigate before switching over."
fi

echo ""
echo "Done. The old database was not modified."
echo "Backup kept at: $DUMP_FILE"
echo ""
echo "Next: set DATABASE_URL to the new connection string in Replit Secrets,"
echo "then Republish. To roll back, set it to the old one."
