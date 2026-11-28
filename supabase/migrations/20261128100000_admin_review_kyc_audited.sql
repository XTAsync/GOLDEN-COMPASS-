-- P1-8: KYC decisions and their audit row are written by ONE server-side function in one transaction.
-- Before, the browser wrote kyc_records, profiles and audit_logs separately, so an admin client could
-- skip or forge the audit entry. Direct INSERTs into audit_logs from browser roles are now removed.

CREATE OR REPLACE FUNCTION public.admin_review_kyc(p_record_id uuid, p_decision text, p_notes text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor uuid := auth.uid(); v_email text; v_rec public.kyc_records%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR NOT (public.has_role(v_actor, 'admin') OR public.has_role(v_actor, 'compliance')) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'bad decision'; END IF;
  IF p_decision = 'rejected' AND length(btrim(coalesce(p_notes, ''))) = 0 THEN
    RAISE EXCEPTION 'a rejection reason is required';
  END IF;

  SELECT * INTO v_rec FROM public.kyc_records WHERE id = p_record_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'kyc record not found'; END IF;
  IF v_rec.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_reviewed', 'status', v_rec.status);
  END IF;
  IF v_rec.user_id = v_actor THEN RAISE EXCEPTION 'cannot review your own KYC' USING ERRCODE = '42501'; END IF;

  UPDATE public.kyc_records
     SET status = p_decision, reviewed_by = v_actor, review_notes = coalesce(p_notes, '')
   WHERE id = p_record_id;
  UPDATE public.profiles SET kyc_status = p_decision WHERE id = v_rec.user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found for kyc record'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
  INSERT INTO public.audit_logs (action, actor_email, entity_type, entity_id, metadata)
  VALUES ('kyc_' || p_decision, v_email, 'kyc_record', p_record_id::text,
          jsonb_build_object('user_id', v_rec.user_id, 'notes', coalesce(p_notes, ''), 'actor_id', v_actor));
  RETURN jsonb_build_object('ok', true, 'status', p_decision);
END $$;
REVOKE ALL ON FUNCTION public.admin_review_kyc(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_kyc(uuid, text, text) TO authenticated, service_role;

-- No browser role may write audit_logs directly any more (reads stay admin-only).
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM PUBLIC, anon, authenticated;
