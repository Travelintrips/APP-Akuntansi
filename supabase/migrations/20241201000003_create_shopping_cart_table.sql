CREATE TABLE IF NOT EXISTS shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
    'tiket_pesawat',
    'hotel', 
    'passenger_handling',
    'travel',
    'airport_transfer',
    'rental_car'
  )),
  service_name VARCHAR(255) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

alter publication supabase_realtime add table shopping_cart;
