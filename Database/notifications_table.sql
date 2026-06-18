CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  doctor_id uuid,
  report_id uuid,
  notification_type text,
  email_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id),
  CONSTRAINT notifications_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id)
);