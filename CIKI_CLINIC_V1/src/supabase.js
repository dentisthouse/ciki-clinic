import { createClient } from '@supabase/supabase-js';

// Cloud Supabase (For Online Bookings)
const supabaseCloudUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseCloudKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Local Supabase (For Patient Data in Clinic)
const supabaseLocalUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL || 'http://localhost:8000';
const supabaseLocalKey = import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY || '';

// Validate environment variables
if (!supabaseCloudUrl || !supabaseCloudKey) {
    console.error('❌ Missing Supabase Cloud environment variables!');
}

// Create Cloud client (Bookings bridge)
export const supabase = createClient(
    supabaseCloudUrl || '',
    supabaseCloudKey || '',
    {
        auth: { autoRefreshToken: true, persistSession: true },
        global: { headers: { 'X-Client-Info': 'dentist-house-cloud' } }
    }
);

// Create Local client (Clinic Private Data)
// If local key is missing, we use a placeholder to prevent "supabaseKey is required" crash
export const supabaseLocal = (supabaseLocalUrl && supabaseLocalKey) 
    ? createClient(
        supabaseLocalUrl,
        supabaseLocalKey,
        {
            auth: { autoRefreshToken: true, persistSession: true },
            global: { headers: { 'X-Client-Info': 'dentist-house-local' } }
        }
    )
    : (function() {
        console.warn('⚠️ Missing VITE_SUPABASE_LOCAL_ANON_KEY. Local Sync features will be disabled.');
        // Return a mock client that matches the interface but does nothing to prevent downstream crashes
        const mockClient = {
            from: () => ({
                select: () => ({
                    eq: () => ({ 
                        single: () => Promise.resolve({ data: null, error: null }),
                        maybeSingle: () => Promise.resolve({ data: null, error: null })
                    }),
                    ilike: () => ({ 
                        maybeSingle: () => Promise.resolve({ data: null, error: null }) 
                    }),
                    limit: () => Promise.resolve({ data: [], error: null })
                }),
                insert: () => Promise.resolve({ error: null }),
                update: () => ({ eq: () => Promise.resolve({ error: null }) }),
                delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
                on: () => ({ subscribe: () => ({}) }),
                upsert: () => Promise.resolve({ error: null })
            }),
            auth: {
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                signInWithPassword: () => Promise.resolve({ error: new Error('Local server disconnected') }),
                signOut: () => Promise.resolve({ error: null })
            },
            channel: () => ({ 
                on: () => ({ 
                    subscribe: () => ({}) 
                }),
                subscribe: () => ({})
            }),
            removeChannel: () => {}
        };
        return mockClient;
    })();

// Enhanced supabase helper with timeout and error handling
export const supabaseWithTimeout = async (query, timeoutMs = 10000) => {
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    );
    
    try {
        const result = await Promise.race([query, timeoutPromise]);
        return result;
    } catch (error) {
        console.error('Supabase query error:', error);
        throw error;
    }
};

// Pagination helper for large datasets
export const fetchPaginated = async (table, options = {}) => {
    const {
        page = 1,
        pageSize = 50,
        orderBy = 'created_at',
        order = 'desc',
        select = '*',
        filters = {}
    } = options;

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
        .from(table)
        .select(select, { count: 'exact' })
        .order(orderBy, { ascending: order === 'asc' })
        .range(start, end);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
        }
    });

    const { data, error, count } = await supabaseWithTimeout(query, 15000);
    
    if (error) throw error;
    
    return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
    };
};
