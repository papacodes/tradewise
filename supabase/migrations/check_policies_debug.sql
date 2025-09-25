-- Check RLS policies for trading_accounts table
DO $$
DECLARE
    policy_record RECORD;
    permission_record RECORD;
    table_record RECORD;
BEGIN
    RAISE NOTICE 'Checking RLS policies for trading_accounts table:';
    
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'trading_accounts'
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Roles: % | Condition: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles, 
            policy_record.qual;
    END LOOP;
    
    RAISE NOTICE 'Checking table permissions:';
    
    FOR permission_record IN 
        SELECT grantee, table_name, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_schema = 'public' 
            AND table_name = 'trading_accounts' 
            AND grantee IN ('anon', 'authenticated') 
        ORDER BY table_name, grantee
    LOOP
        RAISE NOTICE 'Role: % | Privilege: %', 
            permission_record.grantee, 
            permission_record.privilege_type;
    END LOOP;
    
    RAISE NOTICE 'Checking RLS status:';
    
    FOR table_record IN 
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'trading_accounts'
    LOOP
        RAISE NOTICE 'Table: % | RLS Enabled: %', 
            table_record.tablename, 
            table_record.rowsecurity;
    END LOOP;
END $$;