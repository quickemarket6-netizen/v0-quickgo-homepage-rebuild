-- Migration: allow super_admin in profiles.role CHECK constraint
-- Run this in your Supabase SQL editor before calling the setup route.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'vendor', 'driver', 'admin', 'super_admin'));
