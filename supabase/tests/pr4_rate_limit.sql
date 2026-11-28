BEGIN;
DO $$
DECLARE i int; ok boolean; n int;
BEGIN
  FOR i IN 1..3 LOOP
    IF NOT public.rate_limit_hit('t:a', 3, 86400) THEN RAISE EXCEPTION 'hit % should be allowed', i; END IF;
  END LOOP;
  IF public.rate_limit_hit('t:a', 3, 86400) THEN RAISE EXCEPTION '4th hit should be refused'; END IF;
  IF NOT public.rate_limit_hit('t:b', 3, 86400) THEN RAISE EXCEPTION 'keys must be independent'; END IF;
  BEGIN PERFORM public.rate_limit_hit('', 3, 60); RAISE EXCEPTION 'empty key accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'empty key accepted' THEN RAISE; END IF; END;
  BEGIN PERFORM public.rate_limit_hit('x', 0, 60); RAISE EXCEPTION 'zero max accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'zero max accepted' THEN RAISE; END IF; END;
  -- browser roles cannot call it or read the table
  SET LOCAL ROLE authenticated;
  BEGIN PERFORM public.rate_limit_hit('t:c', 3, 60); RAISE EXCEPTION 'authenticated can call rate_limit_hit';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM 1 FROM public.rate_limit_hits; RAISE EXCEPTION 'authenticated can read table';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
END $$;
ROLLBACK;
