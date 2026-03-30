// API error handling utilities
import { useToast } from '../context/ToastContext';

// Custom error classes
export class ApiError extends Error {
    constructor(message, statusCode, code, details = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export class ValidationError extends Error {
    constructor(message, fields = {}) {
        super(message);
        this.name = 'ValidationError';
        this.fields = fields;
    }
}

export class NetworkError extends Error {
    constructor(message = 'Network connection failed') {
        super(message);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends Error {
    constructor(message = 'Request timeout') {
        super(message);
        this.name = 'TimeoutError';
    }
}

// Error handler hook
export const useApiErrorHandler = () => {
    const { error: showError, info: showInfo } = useToast();

    const handleError = (err, options = {}) => {
        const { 
            silent = false, 
            fallbackMessage = 'เกิดข้อผิดพลาด',
            onError = null,
            logToConsole = true
        } = options;

        if (logToConsole) {
            console.error('API Error:', err);
        }

        let message = fallbackMessage;
        let shouldShowToast = !silent;

        if (err instanceof ApiError) {
            switch (err.statusCode) {
                case 401:
                    message = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
                    // Redirect to login
                    window.location.href = '/login';
                    break;
                case 403:
                    message = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
                    break;
                case 404:
                    message = 'ไม่พบข้อมูลที่ต้องการ';
                    break;
                case 409:
                    message = 'ข้อมูลซ้ำหรือมีการแก้ไขโดยผู้ใช้อื่น';
                    break;
                case 422:
                    message = 'ข้อมูลไม่ถูกต้อง: ' + (err.details?.join(', ') || '');
                    break;
                case 500:
                    message = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่';
                    break;
                case 503:
                    message = 'ระบบไม่พร้อมใช้งาน กรุณาลองใหม่ในภายหลัง';
                    break;
                default:
                    message = err.message || fallbackMessage;
            }
        } else if (err instanceof NetworkError) {
            message = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
        } else if (err instanceof TimeoutError) {
            message = 'การดำเนินการใช้เวลานานเกินไป กรุณาลองใหม่';
        } else if (err?.message) {
            message = err.message;
        }

        if (shouldShowToast) {
            showError(message);
        }

        if (onError) {
            onError(err, message);
        }

        return { message, error: err };
    };

    return { handleError };
};

// Async wrapper with error handling
export const withErrorHandling = async (asyncFn, options = {}) => {
    const {
        timeout = 30000,
        retries = 0,
        retryDelay = 1000,
        onRetry = null,
        fallbackValue = null
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new TimeoutError()), timeout);
            });

            // Race between async function and timeout
            const result = await Promise.race([asyncFn(), timeoutPromise]);
            return { success: true, data: result, error: null };

        } catch (err) {
            lastError = err;

            // Don't retry on certain errors
            if (err instanceof ApiError && [401, 403, 404].includes(err.statusCode)) {
                break;
            }

            // Check if we should retry
            if (attempt < retries) {
                if (onRetry) {
                    onRetry(attempt + 1, retries, err);
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }
        }
    }

    return { 
        success: false, 
        data: fallbackValue, 
        error: lastError 
    };
};

// Supabase error parser
export const parseSupabaseError = (error) => {
    if (!error) return null;

    // Handle specific Supabase error codes
    const code = error.code;
    const message = error.message || error.details || 'Unknown error';

    switch (code) {
        case '23505': // unique_violation
            return new ApiError('ข้อมูลซ้ำในระบบ', 409, code, message);
        case '23503': // foreign_key_violation
            return new ApiError('ข้อมูลมีการเชื่อมโยงกับรายการอื่น', 422, code, message);
        case '23514': // check_violation
            return new ApiError('ข้อมูลไม่ตรงตามเงื่อนไข', 422, code, message);
        case 'PGRST116':
            return new ApiError('ไม่พบข้อมูล', 404, code, message);
        case 'PGRST301':
            return new ApiError('การเชื่อมต่อถูกปฏิเสธ', 403, code, message);
        case 'auth/invalid-credentials':
            return new ApiError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401, code, message);
        case 'auth/user-not-found':
            return new ApiError('ไม่พบบัญชีผู้ใช้', 404, code, message);
        case 'auth/email-already-in-use':
            return new ApiError('อีเมลนี้ถูกใช้งานแล้ว', 409, code, message);
        default:
            return new ApiError(message, error.status || 500, code, error.details);
    }
};

// Safe data fetching hook
export const useSafeFetch = () => {
    const { handleError } = useApiErrorHandler();

    const safeFetch = async (fetchFn, options = {}) => {
        const result = await withErrorHandling(fetchFn, options);
        
        if (!result.success) {
            const parsedError = parseSupabaseError(result.error);
            handleError(parsedError || result.error, options);
        }

        return result;
    };

    return { safeFetch };
};

// Error boundary fallback for async errors
export class AsyncErrorBoundary extends Error {
    constructor(errors = []) {
        super('Multiple async errors occurred');
        this.name = 'AsyncErrorBoundary';
        this.errors = errors;
    }
}

// Batch request handler with error isolation
export const batchRequests = async (requests, options = {}) => {
    const { continueOnError = false } = options;
    
    const results = await Promise.allSettled(requests);
    
    const successful = [];
    const failed = [];
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successful.push({ index, data: result.value });
        } else {
            failed.push({ index, error: result.reason });
            if (!continueOnError) {
                throw new AsyncErrorBoundary(failed.map(f => f.error));
            }
        }
    });
    
    return { successful, failed };
};

export default {
    ApiError,
    ValidationError,
    NetworkError,
    TimeoutError,
    useApiErrorHandler,
    withErrorHandling,
    parseSupabaseError,
    useSafeFetch,
    AsyncErrorBoundary,
    batchRequests
};
