-- Migration 004: Password Resets & System Auth Credentials Table
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  reset_token_hash TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Persistent credentials table for synchronized administrator password management
CREATE TABLE IF NOT EXISTS public.system_auth_credentials (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON public.password_resets(reset_token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_created_at ON public.password_resets(created_at);

-- Row Level Security
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_auth_credentials ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on password_resets"
  ON public.password_resets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on system_auth_credentials"
  ON public.system_auth_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
