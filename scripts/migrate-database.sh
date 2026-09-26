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

# Prisma connection strings carry parameters libpq knows nothing about, and
# psql refuses the whole URI over them ("invalid URI query parameter:
# pgbouncer"). Strip the Prisma-only ones; keep sslmode and friends.
sanitize_url() {
  node -e '
    const u = new URL(process.argv[1]);
    for (const k of ["pgbouncer","connection_limit","pool_timeout",
                     "statement_cache_size","prepared_statements","schema"]) {
      u.searchParams.delete(k);
    }
    process.stdout.write(u.toString());
  ' "$1"
}

OLD_DB_URL="$(sanitize_url "$OLD_DB_URL")"
NEW_DB_URL="$(sanitize_url "$NEW_DB_URL")"

# pg_dump needs a real session: it sets session state and uses a consistent
# snapshot, neither of which survives transaction-mode pooling. Supabase serves
# that pooler on 6543 — dumping through it fails or silently produces a partial
# dump. The direct connection (port 5432) is the one to use.
if [[ "$OLD_DB_URL" == *":6543/"* ]]; then
  echo "ERROR: OLD_DB_URL points at the transaction pooler (port 6543)." >&2
  echo "       pg_dump cannot run through it. Use the direct connection instead:" >&2
  echo "       Supabase dashboard -> Project Settings -> Database ->" >&2
  echo "       Connection string -> URI, with 'Use connection pooling' OFF." >&2
  echo "       It looks like: postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres" >&2
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
# --schema=public: this app's tables all live in public (Prisma puts them
# there). A Supabase source also carries auth, storage, graphql, realtime and
# vault schemas, plus extensions like pgsodium and pg_graphql, which do not
# exist on a plain Postgres target — dumping them makes the restore below fail
# on its first statement because of --exit-on-error.
pg_dump "$OLD_DB_URL" --no-owner --no-acl --schema=public --format=custom --file="$DUMP_FILE"
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
