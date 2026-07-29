
DROP POLICY IF EXISTS secp_pack_upsert ON public.secp_pack_state;
DROP POLICY IF EXISTS secp_pack_update ON public.secp_pack_state;
CREATE POLICY secp_pack_upsert ON public.secp_pack_state FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));
CREATE POLICY secp_pack_update ON public.secp_pack_state FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));
