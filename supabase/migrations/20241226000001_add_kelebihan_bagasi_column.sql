-- Add kelebihan_bagasi column to bookings_trips table
ALTER TABLE bookings_trips ADD COLUMN IF NOT EXISTS kelebihan_bagasi DECIMAL(15,2) DEFAULT 0;

-- Add index for kelebihan_bagasi column
CREATE INDEX IF NOT EXISTS idx_bookings_trips_kelebihan_bagasi ON bookings_trips(kelebihan_bagasi);
