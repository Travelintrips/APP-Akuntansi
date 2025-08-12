-- Add check-in and check-out date columns to bookings_trips table
ALTER TABLE bookings_trips 
ADD COLUMN IF NOT EXISTS tanggal_checkin DATE,
ADD COLUMN IF NOT EXISTS tanggal_checkout DATE;

-- Add indexes for the new date columns
CREATE INDEX IF NOT EXISTS idx_bookings_trips_tanggal_checkin ON bookings_trips(tanggal_checkin);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_tanggal_checkout ON bookings_trips(tanggal_checkout);
