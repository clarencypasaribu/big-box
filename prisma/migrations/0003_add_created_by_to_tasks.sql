-- Adds created_by to tasks for tracking task creator as fallback assignee
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS created_by text;
