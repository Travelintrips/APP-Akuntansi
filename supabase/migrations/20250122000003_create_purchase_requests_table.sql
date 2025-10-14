-- Create purchase_requests table
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_date DATE NOT NULL,
    name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can see their own requests, admins can see all
DROP POLICY IF EXISTS "Users can view own purchase requests" ON public.purchase_requests;
CREATE POLICY "Users can view own purchase requests"
ON public.purchase_requests FOR SELECT
USING (
    requester_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'Admin')
    )
);

-- Policy for INSERT: Authenticated users can create requests
DROP POLICY IF EXISTS "Users can create purchase requests" ON public.purchase_requests;
CREATE POLICY "Users can create purchase requests"
ON public.purchase_requests FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND
    requester_id = auth.uid()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_requests;