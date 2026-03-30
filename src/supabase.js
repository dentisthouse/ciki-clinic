import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create client with optimized settings for large datasets
export const supabase = createClient(
    supabaseUrl || '',
    supabaseKey || '',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                'X-Client-Info': 'ciki-clinic'
            }
        }
    }
);

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
