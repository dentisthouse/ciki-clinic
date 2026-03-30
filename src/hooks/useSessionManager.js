import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Session timeout settings
const INACTIVE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export const useSessionManager = () => {
    const { logout, user } = useAuth();
    const inactiveTimerRef = useRef(null);
    const sessionStartTimeRef = useRef(Date.now());
    const lastActivityRef = useRef(Date.now());

    const clearInactiveTimer = useCallback(() => {
        if (inactiveTimerRef.current) {
            clearTimeout(inactiveTimerRef.current);
            inactiveTimerRef.current = null;
        }
    }, []);

    const resetInactiveTimer = useCallback(() => {
        if (!user) return;
        
        clearInactiveTimer();
        lastActivityRef.current = Date.now();
        
        inactiveTimerRef.current = setTimeout(() => {
            console.log('Session expired due to inactivity');
            logout();
            alert('เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่');
        }, INACTIVE_TIMEOUT);
    }, [user, logout, clearInactiveTimer]);

    const checkMaxSessionDuration = useCallback(() => {
        if (!user) return;
        
        const sessionDuration = Date.now() - sessionStartTimeRef.current;
        if (sessionDuration >= MAX_SESSION_DURATION) {
            console.log('Maximum session duration reached');
            logout();
            alert('เซสชันหมดอายุ (8 ชั่วโมง) กรุณาเข้าสู่ระบบใหม่');
        }
    }, [user, logout]);

    useEffect(() => {
        if (!user) {
            clearInactiveTimer();
            return;
        }

        // Track user activity
        const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        
        const handleActivity = () => {
            resetInactiveTimer();
        };

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Check session duration every minute
        const sessionCheckInterval = setInterval(checkMaxSessionDuration, 60000);

        // Start inactive timer
        resetInactiveTimer();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            clearInactiveTimer();
            clearInterval(sessionCheckInterval);
        };
    }, [user, resetInactiveTimer, clearInactiveTimer, checkMaxSessionDuration]);

    // Visibility API - logout when tab is hidden for too long
    useEffect(() => {
        if (!user) return;

        let hiddenTimer = null;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab is hidden - set timer to logout after 5 minutes
                hiddenTimer = setTimeout(() => {
                    console.log('Tab hidden for too long - logging out');
                    logout();
                }, 5 * 60 * 1000);
            } else {
                // Tab is visible again - clear timer and reset activity
                if (hiddenTimer) {
                    clearTimeout(hiddenTimer);
                    hiddenTimer = null;
                }
                resetInactiveTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (hiddenTimer) clearTimeout(hiddenTimer);
        };
    }, [user, logout, resetInactiveTimer]);

    return {
        resetInactiveTimer,
        sessionStartTime: sessionStartTimeRef.current,
        lastActivity: lastActivityRef.current
    };
};

export default useSessionManager;
