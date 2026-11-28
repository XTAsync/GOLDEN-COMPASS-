#!/usr/bin/env bash
# Applies every migration to a scratch Postgres (Supabase stubs: auth schema, roles) then runs supabase/tests/*.sql.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=pgtest scripts/sql-test.sh   (any reachable Postgres 15+; it creates and drops a DB)
set -euo pipefail
cd "$(dirname "$0")/.."
DB="gc_sqltest_$$"; export PGDATABASE=postgres
psql -qv ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $DB" -c "CREATE DATABASE $DB" >/dev/null
export PGDATABASE=$DB
trap 'PGDATABASE=postgres psql -q -c "DROP DATABASE IF EXISTS '$DB'" >/dev/null 2>&1 || true' EXIT
psql -qv ON_ERROR_STOP=1 >/dev/null <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS extensions;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true),''),'anon') $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
CREATE PUBLICATION supabase_realtime;
SQL
fail=0
for f in supabase/migrations/*.sql; do
  psql -qv ON_ERROR_STOP=1 -f "$f" >/dev/null 2>/tmp/sqltest-err || { echo "MIGRATION FAILED: $f"; head -5 /tmp/sqltest-err; fail=1; break; }
done
[ "$fail" = 0 ] && for t in supabase/tests/*.sql; do
  if psql -qv ON_ERROR_STOP=1 -f "$t" >/dev/null 2>/tmp/sqltest-err; then echo "ok   $t"; else echo "FAIL $t"; head -5 /tmp/sqltest-err; fail=1; fi
done
exit $fail
