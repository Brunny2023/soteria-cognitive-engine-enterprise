CREATE TABLE public.secp_workstreams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  request_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  owner_role TEXT NOT NULL DEFAULT 'Program Manager',
  duration_days INTEGER NOT NULL DEFAULT 14,
  acceptance TEXT NOT NULL DEFAULT '',
  risk TEXT NOT NULL DEFAULT 'low',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secp_workstreams TO authenticated;
GRANT ALL ON public.secp_workstreams TO service_role;
ALTER TABLE public.secp_workstreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own workstreams" ON public.secp_workstreams FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX secp_workstreams_request_idx ON public.secp_workstreams (request_id, position);

CREATE TABLE public.secp_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  workstream_id UUID NOT NULL REFERENCES public.secp_workstreams(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  specialist_id TEXT NOT NULL DEFAULT '',
  specialist_role TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  effort_hours INTEGER NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'todo',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secp_tasks TO authenticated;
GRANT ALL ON public.secp_tasks TO service_role;
ALTER TABLE public.secp_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own tasks" ON public.secp_tasks FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX secp_tasks_ws_idx ON public.secp_tasks (workstream_id, position);
CREATE INDEX secp_tasks_request_idx ON public.secp_tasks (request_id);