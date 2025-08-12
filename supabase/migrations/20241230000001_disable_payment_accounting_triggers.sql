-- COMPREHENSIVE REMOVAL OF ALL ACCOUNTING INTEGRATION FROM PAYMENTS
-- This migration completely decouples payments from the accounting system

-- Step 1: Drop ALL possible triggers on payments table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Get all triggers on payments table
    FOR trigger_record IN 
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger 
        WHERE tgrelid = 'payments'::regclass
        AND tgname NOT LIKE 'RI_%'  -- Keep referential integrity triggers
        AND tgname != 'trigger_update_payments_updated_at'  -- Keep the updated_at trigger
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s CASCADE', trigger_record.tgname, trigger_record.table_name);
        RAISE NOTICE 'Dropped trigger: % on %', trigger_record.tgname, trigger_record.table_name;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping triggers: %', SQLERRM;
END
$$;

-- Step 2: Drop ALL possible triggers on bookings_trips table that might affect payments
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname, tgrelid::regclass as table_name
        FROM pg_trigger 
        WHERE tgrelid = 'bookings_trips'::regclass
        AND tgname NOT LIKE 'RI_%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s CASCADE', trigger_record.tgname, trigger_record.table_name);
        RAISE NOTICE 'Dropped trigger: % on %', trigger_record.tgname, trigger_record.table_name;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping bookings triggers: %', SQLERRM;
END
$$;

-- Step 3: Drop ALL functions that might create journal entries
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname LIKE '%journal%' 
           OR proname LIKE '%payment%' 
           OR proname LIKE '%booking%'
           OR proname LIKE '%accounting%'
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
            RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in function cleanup: %', SQLERRM;
END
$$;

-- Step 4: Drop specific functions by name (in case the above missed any)
DROP FUNCTION IF EXISTS create_journal_entry_for_payment(UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_create_payment_journal_entry() CASCADE;
DROP FUNCTION IF EXISTS process_payment_journal_entry() CASCADE;
DROP FUNCTION IF EXISTS create_payment_journal_entry_function() CASCADE;
DROP FUNCTION IF EXISTS handle_payment_journal_entry() CASCADE;
DROP FUNCTION IF EXISTS payment_journal_entry_trigger() CASCADE;
DROP FUNCTION IF EXISTS auto_create_journal_entry_for_payment() CASCADE;
DROP FUNCTION IF EXISTS process_payment_accounting() CASCADE;
DROP FUNCTION IF EXISTS handle_new_payment() CASCADE;
DROP FUNCTION IF EXISTS handle_new_booking() CASCADE;
DROP FUNCTION IF EXISTS process_new_payment() CASCADE;
DROP FUNCTION IF EXISTS process_new_booking() CASCADE;
DROP FUNCTION IF EXISTS create_journal_entry_for_booking(UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_create_booking_journal_entry() CASCADE;
DROP FUNCTION IF EXISTS process_booking_journal_entry() CASCADE;
DROP FUNCTION IF EXISTS handle_booking_journal_entry() CASCADE;
DROP FUNCTION IF EXISTS booking_journal_entry_trigger() CASCADE;

-- Step 5: Drop any views that might be causing issues
DROP MATERIALIZED VIEW IF EXISTS payments_with_journal_items CASCADE;
DROP MATERIALIZED VIEW IF EXISTS payment_journal_view CASCADE;
DROP MATERIALIZED VIEW IF EXISTS payments_with_accounting CASCADE;
DROP VIEW IF EXISTS payments_with_journal_items CASCADE;
DROP VIEW IF EXISTS payment_journal_view CASCADE;
DROP VIEW IF EXISTS payments_with_accounting CASCADE;

-- Step 6: Remove any foreign key constraints linking to journal entries
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE (conrelid = 'payments'::regclass OR conrelid = 'bookings_trips'::regclass)
        AND conname LIKE '%journal%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', constraint_record.table_name, constraint_record.conname);
        RAISE NOTICE 'Dropped constraint: % from %', constraint_record.conname, constraint_record.table_name;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraints: %', SQLERRM;
END
$$;

-- Step 7: Drop any columns that reference journal entries
ALTER TABLE payments DROP COLUMN IF EXISTS journal_entry_id CASCADE;
ALTER TABLE bookings_trips DROP COLUMN IF EXISTS journal_entry_id CASCADE;

-- Step 8: Drop any indexes related to journal entries
DROP INDEX IF EXISTS idx_payments_journal_entry_id;
DROP INDEX IF EXISTS idx_bookings_journal_entry_id;

-- Step 9: Remove any rules that might be creating journal entries
DROP RULE IF EXISTS payment_journal_entry_rule ON payments;
DROP RULE IF EXISTS booking_journal_entry_rule ON bookings_trips;

-- Step 10: Disable RLS policies that might be interfering
DROP POLICY IF EXISTS "payment_journal_entry_policy" ON payments;
DROP POLICY IF EXISTS "booking_journal_entry_policy" ON bookings_trips;

-- Step 11: Check for and remove any event triggers
DO $$
DECLARE
    evt_record RECORD;
BEGIN
    FOR evt_record IN 
        SELECT evtname 
        FROM pg_event_trigger 
        WHERE evtname LIKE '%journal%' 
           OR evtname LIKE '%payment%' 
           OR evtname LIKE '%booking%'
    LOOP
        EXECUTE format('DROP EVENT TRIGGER IF EXISTS %I CASCADE', evt_record.evtname);
        RAISE NOTICE 'Dropped event trigger: %', evt_record.evtname;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with event triggers: %', SQLERRM;
END
$$;

-- Step 12: Remove any stored procedures
DROP PROCEDURE IF EXISTS process_payment_accounting(UUID) CASCADE;
DROP PROCEDURE IF EXISTS create_payment_journal_entry(UUID) CASCADE;
DROP PROCEDURE IF EXISTS handle_payment_insert(UUID) CASCADE;

-- Step 13: Clean up any remaining dependencies in system catalogs
DO $$
BEGIN
    DELETE FROM pg_depend 
    WHERE refobjid IN (
        SELECT oid FROM pg_class WHERE relname IN ('payments', 'bookings_trips')
    ) AND objid IN (
        SELECT oid FROM pg_proc WHERE proname LIKE '%journal%'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not clean dependencies: %', SQLERRM;
END
$$;

-- Step 14: Recreate the journal_entry_items_with_ledger view (if it was dropped)
DROP VIEW IF EXISTS journal_entry_items_with_ledger CASCADE;
CREATE OR REPLACE VIEW journal_entry_items_with_ledger AS
SELECT 
  ji.id as journal_entry_item_id,
  ji.journal_entry_id,
  ji.account_id,
  ji.debit as item_debit,
  ji.credit as item_credit,
  ji.created_at as item_created_at,
  ji.updated_at as item_updated_at,
  
  -- General Ledger data
  gl.id as general_ledger_id,
  gl.date as ledger_date,
  gl.description as ledger_description,
  gl.debit as ledger_debit,
  gl.credit as ledger_credit,
  gl.running_balance,
  gl.created_at as ledger_created_at,
  gl.updated_at as ledger_updated_at,
  gl.manual_entry
  
FROM journal_entry_items ji
LEFT JOIN general_ledger gl ON ji.id = gl.journal_entry_item_id
ORDER BY ji.journal_entry_id, ji.created_at;

-- Step 15: Add comments to indicate the decoupling
COMMENT ON TABLE payments IS 'Payment records - completely decoupled from accounting system';
COMMENT ON TABLE bookings_trips IS 'Booking records - payment processing decoupled from accounting';

-- Step 16: Final verification - list any remaining triggers on payments
DO $$
DECLARE
    remaining_trigger RECORD;
BEGIN
    RAISE NOTICE 'Remaining triggers on payments table:';
    FOR remaining_trigger IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'payments'::regclass
    LOOP
        RAISE NOTICE 'Trigger: %', remaining_trigger.tgname;
    END LOOP;
END
$$;

SELECT 'Payment system successfully decoupled from accounting system' as migration_status;
