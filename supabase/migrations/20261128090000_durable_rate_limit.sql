-- P1-6: durable, shared rate limiting for money endpoints (the old in-memory Map reset per isolate
-- and was not shared across workers). Fixed window counter, server only (service_role).

CREATE TABLE IF NOT EXISTS public.rate_limit_hits (
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;   -- no policies: server only
REVOKE ALL ON public.rate_limit_hits FROM PUBLIC, anon, authenticated;

-- Returns true if the call is allowed (hit counted), false if the key is over its limit.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_start timestamptz; v_hits integer;
BEGIN
  IF p_key IS NULL OR length(p_key) = 0 OR length(p_key) > 200 THEN RAISE EXCEPTION 'bad rate limit key'; END IF;
  IF p_max < 1 OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN RAISE EXCEPTION 'bad rate limit config'; END IF;
  v_start := to_timestamp(floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.rate_limit_hits AS r (key, window_start, hits) VALUES (p_key, v_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET hits = r.hits + 1
  RETURNING r.hits INTO v_hits;
  IF random() < 0.01 THEN   -- opportunistic cleanup
    DELETE FROM public.rate_limit_hits WHERE window_start < clock_timestamp() - interval '2 days';
  END IF;
  RETURN v_hits <= p_max;
END $$;
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;
