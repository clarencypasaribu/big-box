-- Adds assignee fields to blockers for assignment flow.
ALTER TABLE public.blockers
ADD COLUMN IF NOT EXISTS assignee_id uuid,
ADD COLUMN IF NOT EXISTS assignee_name text;

