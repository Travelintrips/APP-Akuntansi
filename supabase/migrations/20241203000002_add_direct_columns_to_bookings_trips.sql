-- Add new columns to bookings_trips table
ALTER TABLE bookings_trips 
ADD COLUMN IF NOT EXISTS tanggal_checkin DATE,
ADD COLUMN IF NOT EXISTS tanggal_checkout DATE,
ADD COLUMN IF NOT EXISTS nama_penumpang VARCHAR(255),
ADD COLUMN IF NOT EXISTS no_telepon VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_debit')),
ADD COLUMN IF NOT EXISTS jam_checkin TIME,
ADD COLUMN IF NOT EXISTS jam_checkout TIME,
ADD COLUMN IF NOT EXISTS tujuan VARCHAR(255);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_bookings_trips_tanggal_checkin ON bookings_trips(tanggal_checkin);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_tanggal_checkout ON bookings_trips(tanggal_checkout);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_nama_penumpang ON bookings_trips(nama_penumpang);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_no_telepon ON bookings_trips(no_telepon);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_payment_method ON bookings_trips(payment_method);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_jam_checkin ON bookings_trips(jam_checkin);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_jam_checkout ON bookings_trips(jam_checkout);
CREATE INDEX IF NOT EXISTS idx_bookings_trips_tujuan ON bookings_trips(tujuan);
