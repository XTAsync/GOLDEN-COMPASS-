-- Trigger functions are never meant to be called over the API.
REVOKE ALL ON FUNCTION public.ops_flag_changed()    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ops_aml_flag_added()  FROM PUBLIC, anon, authenticated;
-- Pin the search path on the two helper functions the Supabase advisor flagged.
ALTER FUNCTION public.ledger_audit_block() SET search_path = public;
ALTER FUNCTION public.ledger_row_hash(text, bigint, timestamptz, text, text, text, uuid, jsonb, jsonb) SET search_path = public;
