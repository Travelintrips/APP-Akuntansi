-- Remove duplicate entries, keeping only the first occurrence of each kode_booking
DELETE FROM bookings_trips 
WHERE id NOT IN (
    SELECT MIN(id::text)::uuid 
    FROM bookings_trips 
    GROUP BY kode_booking
);

-- Add unique constraint to kode_booking column in bookings_trips table
ALTER TABLE bookings_trips ADD CONSTRAINT unique_kode_booking UNIQUE (kode_booking);

-- Create index for better performance on kode_booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_trips_kode_booking_unique ON bookings_trips(kode_booking);
