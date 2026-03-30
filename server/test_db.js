const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('--- DB SCAN START ---');
    
    // 1. Check if we can see the appointments table
    const { data: tables, error: tableErr } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (tableErr) {
        console.error('❌ Table "appointments" check failed:', tableErr.message);
    } else {
        console.log('✅ Table "appointments" exists!');
        console.log('Sample row data:', tables[0]);
    }

    // 2. List some IDs to see format
    const { data: ids } = await supabase
        .from('appointments')
        .select('id')
        .limit(5);
    
    console.log('Existing IDs in DB:', ids);
    console.log('--- DB SCAN END ---');
}

test();
