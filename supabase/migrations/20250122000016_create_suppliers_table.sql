CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  tax_id text,
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  payment_terms text,
  category text[],
  currency text DEFAULT 'IDR',
  status text DEFAULT 'ACTIVE',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION generate_supplier_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'SUP-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.suppliers WHERE supplier_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

alter publication supabase_realtime add table suppliers;
