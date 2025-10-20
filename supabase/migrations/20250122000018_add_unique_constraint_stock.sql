-- Add unique constraint on warehouse_location + item_name + unit
CREATE UNIQUE INDEX IF NOT EXISTS ux_stock_wh_name_unit 
ON public.stock (warehouse_location, item_name, unit);
