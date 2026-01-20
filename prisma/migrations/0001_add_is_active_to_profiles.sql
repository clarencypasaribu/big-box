-- Adds is_active flag to profiles with a default of true.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Backfill nulls to true for any existing rows.
UPDATE public.profiles
SET is_active = COALESCE(is_active, true);
