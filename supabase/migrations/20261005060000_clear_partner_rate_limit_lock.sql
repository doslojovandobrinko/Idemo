-- IDEMO PARTNER RATE LIMIT RESET & INITIAL CREDENTIAL RESTORATION
-- Clears login attempts rate limit table and restores IDEMO partner to temporary PIN '1611' with must_change_pin = true.

TRUNCATE TABLE public.partner_login_attempts;

UPDATE public.partners 
SET passport_pin_hash = extensions.crypt('1611', extensions.gen_salt('bf')), 
    must_change_pin = true 
WHERE LOWER(public_code) = 'idemo';
