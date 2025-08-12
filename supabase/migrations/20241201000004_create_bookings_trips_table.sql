-- Drop shopping_cart table if it exists
DROP TABLE IF EXISTS shopping_cart;

-- Create bookings_trips table
CREATE TABLE IF NOT EXISTS bookings_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kode_booking VARCHAR(255) NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN (
    'tiket_pesawat',
    'hotel', 
    'passenger_handling',
    'travel',
    'airport_transfer',
    'rental_car'
  )),
  service_name VARCHAR(255) NOT NULL,
  service_details TEXT,
  price DECIMAL(15,2) NOT NULL,
  harga_jual DECIMAL(15,2) NOT NULL DEFAULT 0,
  harga_basic DECIMAL(15,2) NOT NULL DEFAULT 0,
  fee_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
  profit DECIMAL(15,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  jumlah_malam INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(15,2) NOT NULL,
  tanggal DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  additional_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookings_trips;

-- Create trigger function to calculate total_amount
CREATE OR REPLACE FUNCTION calculate_total_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_amount = COALESCE(NEW.harga_jual, 0) * COALESCE(NEW.quantity, 1);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and create trigger
DROP TRIGGER IF EXISTS trigger_calculate_total_amount ON bookings_trips;

CREATE TRIGGER trigger_calculate_total_amount
  BEFORE INSERT OR UPDATE ON bookings_trips
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_amount();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_trips_user_id ON bookings_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_kode_booking ON bookings_trips(kode_booking);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_service_type ON bookings_trips(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_price ON bookings_trips(price);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_harga_jual ON bookings_trips(harga_jual);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_profit ON bookings_trips(profit);
