CREATE POLICY "Vault cards require the authorized account"
ON public.vault_cards AS RESTRICTIVE
FOR ALL TO PUBLIC
USING (lower((SELECT auth.jwt()) ->> 'email') = 'brts2461@gmail.com')
WITH CHECK (lower((SELECT auth.jwt()) ->> 'email') = 'brts2461@gmail.com');

CREATE POLICY "Vault settings require the authorized account"
ON public.vault_settings AS RESTRICTIVE
FOR ALL TO PUBLIC
USING (lower((SELECT auth.jwt()) ->> 'email') = 'brts2461@gmail.com')
WITH CHECK (lower((SELECT auth.jwt()) ->> 'email') = 'brts2461@gmail.com');
