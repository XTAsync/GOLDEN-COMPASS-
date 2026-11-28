#!/usr/bin/env bash
# Bootstraps a throwaway database (Supabase stubs: auth schema, roles, default grants), applies every
# migration, then runs scripts/test-sql.sh and scripts/test-concurrency.sh against it.
# Needs a reachable Postgres 15+ and a SUPERUSER role named "postgres" (the guard triggers trust it,
# as on Supabase). It creates and drops its own database.
# Usage: PGHOST=localhost PGPORT=5432 PGUSER=postgres scripts/sql-scratch.sh
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
-- Supabase grants new public objects to the API roles by default; mirror that so tests exercise RLS, not missing grants.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
SQL
for f in supabase/migrations/*.sql; do
  psql -qv ON_ERROR_STOP=1 -f "$f" >/dev/null 2>/tmp/sqltest-err || { echo "MIGRATION FAILED: $f"; head -5 /tmp/sqltest-err; exit 1; }
done
echo "ok   all $(ls supabase/migrations/*.sql | wc -l | tr -d ' ') migrations applied"
export DATABASE_URL="host=${PGHOST:-localhost} port=${PGPORT:-5432} user=${PGUSER:-postgres} dbname=$DB"
bash scripts/test-sql.sh 2>&1 | grep -v '^$' && bash scripts/test-concurrency.sh
