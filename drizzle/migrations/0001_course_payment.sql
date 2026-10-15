ALTER TABLE public.applications
 ADD COLUMN course_payment_status text NOT NULL DEFAULT 'unpaid',
 ADD COLUMN course_order_id text,
 ADD COLUMN course_payment_id text,
 ADD COLUMN course_amount integer,
 ADD COLUMN course_paid_at timestamptz;