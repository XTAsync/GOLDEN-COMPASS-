BEGIN;
DO $$
DECLARE adm uuid := gen_random_uuid(); usr uuid := gen_random_uuid(); usr2 uuid := gen_random_uuid();
        k1 uuid; k2 uuid; r jsonb; n int;
BEGIN
  INSERT INTO auth.users (id, email) VALUES (adm,'adm@t.local'),(usr,'u@t.local'),(usr2,'u2@t.local');
  INSERT INTO public.profiles (id) VALUES (adm),(usr),(usr2) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (adm,'admin');
  INSERT INTO public.kyc_records (user_id, status) VALUES (usr,'pending') RETURNING id INTO k1;
  INSERT INTO public.kyc_records (user_id, status) VALUES (usr2,'pending') RETURNING id INTO k2;
  UPDATE public.profiles SET kyc_status='pending' WHERE id IN (usr, usr2);

  -- a plain user cannot review, and cannot write audit_logs directly
  PERFORM set_config('request.jwt.claim.sub', usr::text, true); SET LOCAL ROLE authenticated;
  BEGIN PERFORM public.admin_review_kyc(k1,'approved',''); RAISE EXCEPTION 'user could review';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.audit_logs (action) VALUES ('forged'); RAISE EXCEPTION 'user wrote audit_logs';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;

  -- admin: approve writes record, profile and audit in one go
  PERFORM set_config('request.jwt.claim.sub', adm::text, true); SET LOCAL ROLE authenticated;
  r := public.admin_review_kyc(k1,'approved','');
  IF NOT (r->>'ok')::boolean THEN RAISE EXCEPTION 'approve failed: %', r; END IF;
  -- second review of the same record is refused
  r := public.admin_review_kyc(k1,'rejected','changed my mind');
  IF (r->>'ok')::boolean OR r->>'error' <> 'already_reviewed' THEN RAISE EXCEPTION 'double review allowed: %', r; END IF;
  -- reject needs a reason
  BEGIN PERFORM public.admin_review_kyc(k2,'rejected','  '); RAISE EXCEPTION 'blank reason accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'blank reason accepted' THEN RAISE; END IF; END;
  BEGIN PERFORM public.admin_review_kyc(k2,NULL,'x'); RAISE EXCEPTION 'null decision accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'null decision accepted' THEN RAISE; END IF; END;
  r := public.admin_review_kyc(k2,'rejected','blurry id');
  -- admin cannot forge or edit audit rows directly
  BEGIN INSERT INTO public.audit_logs (action) VALUES ('forged'); RAISE EXCEPTION 'admin wrote audit_logs';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;

  IF (SELECT kyc_status FROM public.profiles WHERE id=usr) <> 'approved' THEN RAISE EXCEPTION 'profile not approved'; END IF;
  IF (SELECT kyc_status FROM public.profiles WHERE id=usr2) <> 'rejected' THEN RAISE EXCEPTION 'profile not rejected'; END IF;
  SELECT count(*) INTO n FROM public.audit_logs WHERE entity_id IN (k1::text,k2::text) AND actor_email='adm@t.local';
  IF n <> 2 THEN RAISE EXCEPTION 'expected 2 audit rows, got %', n; END IF;
  IF (SELECT review_notes FROM public.kyc_records WHERE id=k2) <> 'blurry id' THEN RAISE EXCEPTION 'notes lost'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.audit_logs WHERE entity_id=k2::text AND action='kyc_rejected' AND metadata->>'notes'='blurry id' AND metadata->>'actor_id'=adm::text) THEN
    RAISE EXCEPTION 'audit metadata wrong'; END IF;

  -- admin cannot review their own KYC
  INSERT INTO public.kyc_records (user_id, status) VALUES (adm,'pending') RETURNING id INTO k1;
  PERFORM set_config('request.jwt.claim.sub', adm::text, true); SET LOCAL ROLE authenticated;
  BEGIN PERFORM public.admin_review_kyc(k1,'approved',''); RAISE EXCEPTION 'self review allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
END $$;
ROLLBACK;
