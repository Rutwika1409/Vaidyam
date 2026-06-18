CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text,
  email text UNIQUE,
  password_hash text,
  language text DEFAULT 'en'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);