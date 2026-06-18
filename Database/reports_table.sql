CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  file_name text,
  file_url text,
  report_type text,
  ocr_text text,
  ai_summary text,
  specialist_recommendation text,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);