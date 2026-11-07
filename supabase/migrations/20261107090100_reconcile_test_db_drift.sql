-- Reconciles drift between these migrations and the golden-compass-test database, which was
-- built from earlier hand-applied migrations (add_foreign_key_indexes and
-- app_config_client_reads_and_disclosures) that were never committed. Verified by comparing
-- column, function and trigger fingerprints of both databases: only the items below differed.
-- Placeholder legal text is copied as-is and still needs legal review before go-live.

-- 1. Live-service gates, all OFF. broker_mode is "mock" (the repo's older migration set "live").
INSERT INTO public.app_config (key, value, description) VALUES
  ('broker_mode', '"mock"'::jsonb, 'MOCK: "mock" routes trades to the simulated broker. Set to "live" once a licensed broker integration exists.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.app_config (key, value, description) VALUES
  ('invest_live', 'false'::jsonb, 'Gate: real investing. Needs broker_mode = "live" as well.'),
  ('mpesa_live',  'false'::jsonb, 'Gate: real M-Pesa payments.'),
  ('cfd_enabled', 'false'::jsonb, 'Gate: CFD products.')
ON CONFLICT (key) DO NOTHING;

-- 2. Legal disclosure rows, readable without signing in (landing and legal pages).
INSERT INTO public.app_config (key, value, description) VALUES
  ('broker_of_record_disclosure', '"Golden Compass is in demo mode. No real orders are placed and no real money is held. [PLACEHOLDER - pending legal review]"'::jsonb, 'Public disclosure text. Replace after legal review.'),
  ('risk_warning', '"Investing involves risk, including loss of capital. Past performance does not guarantee future results. Demo figures are illustrative only. [PLACEHOLDER - pending legal review]"'::jsonb, 'Public risk warning. Replace after legal review.'),
  ('legal_entity', '"Golden Compass (legal entity details to be confirmed). [PLACEHOLDER - pending legal review]"'::jsonb, 'Public legal entity line. Replace after legal review.')
ON CONFLICT (key) DO NOTHING;

GRANT SELECT ON public.app_config TO anon;
CREATE POLICY "Public read legal disclosure rows" ON public.app_config
  FOR SELECT TO anon
  USING (key = ANY (ARRAY['broker_of_record_disclosure', 'risk_warning', 'legal_entity']));

-- 3. Foreign-key indexes.
CREATE INDEX IF NOT EXISTS idx_aml_flags_reviewed_by      ON public.aml_flags (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_aml_flags_transaction_id   ON public.aml_flags (transaction_id);
CREATE INDEX IF NOT EXISTS idx_aml_flags_user_id          ON public.aml_flags (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_records_reviewed_by    ON public.kyc_records (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_kyc_records_user_id        ON public.kyc_records (user_id);
CREATE INDEX IF NOT EXISTS idx_pool_nav_history_pool_id   ON public.pool_nav_history (pool_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id       ON public.price_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pool_id       ON public.transactions (pool_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created  ON public.transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_investments_pool_id   ON public.user_investments (pool_id);
