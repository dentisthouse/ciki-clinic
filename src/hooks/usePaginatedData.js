import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPaginated } from '../supabase';

// Simple cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (table, options) => `${table}:${JSON.stringify(options)}`;

export const usePaginatedData = (table, options = {}) => {
    const {
        pageSize = 50,
        orderBy = 'created_at',
        order = 'desc',
        filters = {},
        select = '*',
        enabled = true
    } = options;

    const [page, setPage] = useState(1);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);

    // Abort controller for cancelling requests
    const abortControllerRef = useRef(null);

    const fetchData = useCallback(async (pageNum, useCache = true) => {
        if (!enabled) return;

        const cacheKey = getCacheKey(table, { page: pageNum, pageSize, orderBy, order, filters, select });
        
        // Check cache
        if (useCache) {
            const cached = cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                setData(cached.data.data);
                setTotal(cached.data.total);
                setTotalPages(cached.data.totalPages);
                setHasNextPage(pageNum < cached.data.totalPages);
                setHasPreviousPage(pageNum > 1);
                return;
            }
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const result = await fetchPaginated(table, {
                page: pageNum,
                pageSize,
                orderBy,
                order,
                select,
                filters
            });

            setData(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
            setHasNextPage(pageNum < result.totalPages);
            setHasPreviousPage(pageNum > 1);

            // Cache result
            cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError(err.message || 'Failed to fetch data');
                console.error('Fetch error:', err);
            }
        } finally {
            setIsLoading(false);
        }
    }, [table, pageSize, orderBy, order, filters, select, enabled]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchData(page);
    }, [fetchData, page]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setPage(p => p + 1);
        }
    }, [hasNextPage]);

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            setPage(p => p - 1);
        }
    }, [hasPreviousPage]);

    const goToPage = useCallback((pageNum) => {
        if (pageNum >= 1 && pageNum <= totalPages) {
            setPage(pageNum);
        }
    }, [totalPages]);

    const refresh = useCallback(() => {
        // Clear cache for this table
        const prefix = `${table}:`;
        for (const key of cache.keys()) {
            if (key.startsWith(prefix)) {
                cache.delete(key);
            }
        }
        fetchData(page, false);
    }, [table, page, fetchData]);

    return {
        data,
        total,
        page,
        pageSize,
        totalPages,
        isLoading,
        error,
        hasNextPage,
        hasPreviousPage,
        nextPage,
        previousPage,
        goToPage,
        refresh,
        setPage
    };
};

// Hook for search with debounce
export const useDebouncedSearch = (searchFn, delay = 300) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (!searchTerm.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const data = await searchFn(searchTerm);
                setResults(data);
            } catch (err) {
                console.error('Search error:', err);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [searchTerm, delay, searchFn]);

    return {
        searchTerm,
        setSearchTerm,
        results,
        isSearching,
        clearSearch: () => setSearchTerm('')
    };
};

// Hook for infinite scroll
export const useInfiniteData = (table, options = {}) => {
    const {
        pageSize = 50,
        orderBy = 'created_at',
        order = 'desc',
        filters = {}
    } = options;

    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [error, setError] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [total, setTotal] = useState(0);
    const pageRef = useRef(1);

    const fetchNextPage = useCallback(async () => {
        if (isFetchingNextPage || !hasNextPage) return;

        setIsFetchingNextPage(true);

        try {
            const result = await fetchPaginated(table, {
                page: pageRef.current,
                pageSize,
                orderBy,
                order,
                filters
            });

            setData(prev => pageRef.current === 1 ? result.data : [...prev, ...result.data]);
            setTotal(result.total);
            setHasNextPage(pageRef.current < result.totalPages);
            pageRef.current += 1;
        } catch (err) {
            setError(err.message);
        } finally {
            setIsFetchingNextPage(false);
            setIsLoading(false);
        }
    }, [table, pageSize, orderBy, order, filters, isFetchingNextPage, hasNextPage]);

    const refresh = useCallback(async () => {
        pageRef.current = 1;
        setData([]);
        setHasNextPage(true);
        setError(null);
        await fetchNextPage();
    }, [fetchNextPage]);

    useEffect(() => {
        setIsLoading(true);
        pageRef.current = 1;
        fetchNextPage();
    }, [table, JSON.stringify(filters)]);

    return {
        data,
        isLoading,
        isFetchingNextPage,
        error,
        hasNextPage,
        total,
        fetchNextPage,
        refresh
    };
};

export default usePaginatedData;
