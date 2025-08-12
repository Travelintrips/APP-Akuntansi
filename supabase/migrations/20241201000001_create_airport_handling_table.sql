CREATE TABLE IF NOT EXISTS airport_handling_services (
  id SERIAL PRIMARY KEY,
  service_type VARCHAR(255) NOT NULL,
  airport VARCHAR(255),
  basic_price DECIMAL(15,2) NOT NULL,
  sell_price DECIMAL(15,2) NOT NULL,
  additional DECIMAL(15,2) NOT NULL,
  additional_basic_price DECIMAL(15,2) DEFAULT 0,
  porter_base_price DECIMAL(15,2) DEFAULT 0,
  porter_base_quantity INTEGER DEFAULT 3,
  porter_additional_price DECIMAL(15,2) DEFAULT 0,
  services_arrival VARCHAR(255) NOT NULL,
  services_departure VARCHAR(255) NOT NULL,
  terminal VARCHAR(100) NOT NULL,
  trip_type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);