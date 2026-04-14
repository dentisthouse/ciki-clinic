import React, { createContext, useContext, useState, useCallback } from 'react';
import {
    sendAppointmentNotification,
    sendAppointmentSMS,
    sendAppointmentReminder,
    sendLineAppointmentNotification,
    sendOTP,
    verifyOTP,
    checkBackendStatus,
    formatPhoneNumber,
    isValidThaiPhone
} from '../services/notificationService';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState(false);
    const [notificationLog, setNotificationLog] = useState(() => {
        // Load from localStorage
        const stored = localStorage.getItem('ciki_notification_log');
        return stored ? JSON.parse(stored) : [];
    });

    // Check backend status on mount
    const checkStatus = useCallback(async () => {
        const status = await checkBackendStatus();
        setBackendStatus(status);
        return status;
    }, []);

    // Add notification to log
    const addToLog = useCallback((notification) => {
        const newLog = [{
            ...notification,
            id: `NOTIF-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: notification.status || 'pending'
        }, ...notificationLog];
        
        // Keep only last 100 notifications
        const trimmedLog = newLog.slice(0, 100);
        setNotificationLog(trimmedLog);
        localStorage.setItem('ciki_notification_log', JSON.stringify(trimmedLog));
    }, [notificationLog]);

    // Send appointment confirmation notification
    const sendAppointmentConfirmation = useCallback(async (params) => {
        setIsLoading(true);
        try {
            const result = await sendAppointmentNotification({
                ...params,
                channels: params.channels || ['sms']
            });

            if (result.success) {
                addToLog({
                    type: 'appointment_confirmation',
                    patientName: params.patientName,
                    phone: params.phone,
                    lineUserId: params.lineUserId,
                    appointmentDate: params.appointmentDate,
                    appointmentTime: params.appointmentTime,
                    status: 'sent',
                    channels: result.data?.channels || []
                });
            } else {
                addToLog({
                    type: 'appointment_confirmation',
                    patientName: params.patientName,
                    phone: params.phone,
                    status: 'failed',
                    error: result.error
                });
            }

            return result;
        } finally {
            setIsLoading(false);
        }
    }, [addToLog]);

    // Send appointment reminder (D-1)
    const sendReminder = useCallback(async (params) => {
        setIsLoading(true);
        try {
            const result = await sendAppointmentSMS(params.phone, {
                patientName: params.patientName,
                appointmentDate: params.appointmentDate,
                appointmentTime: params.appointmentTime,
                treatment: params.treatment,
                doctor: params.doctor
            });

            if (result.success) {
                addToLog({
                    type: 'appointment_reminder',
                    patientName: params.patientName,
                    phone: params.phone,
                    status: 'sent'
                });
            }

            return result;
        } finally {
            setIsLoading(false);
        }
    }, [addToLog]);

    // Send LINE notification only
    const sendLineNotification = useCallback(async (params) => {
        setIsLoading(true);
        try {
            const result = await sendLineAppointmentNotification(params);

            if (result.success) {
                addToLog({
                    type: 'line_notification',
                    patientName: params.patientName,
                    lineUserId: params.userId,
                    appointmentDate: params.appointmentDate,
                    status: 'sent'
                });
            } else {
                addToLog({
                    type: 'line_notification',
                    patientName: params.patientName,
                    lineUserId: params.userId,
                    status: 'failed',
                    error: result.error
                });
            }

            return result;
        } finally {
            setIsLoading(false);
        }
    }, [addToLog]);

    // Send SMS only
    const sendSMSOnly = useCallback(async (phone, message, sender = 'CIKI') => {
        setIsLoading(true);
        try {
            const { sendSMS } = await import('../services/notificationService');
            const result = await sendSMS(phone, message, sender);

            if (result.success) {
                addToLog({
                    type: 'sms',
                    phone,
                    message: message.substring(0, 50) + '...',
                    status: 'sent'
                });
            }

            return result;
        } finally {
            setIsLoading(false);
        }
    }, [addToLog]);

    // Request OTP
    const requestOTP = useCallback(async (phone, lineUserId = null) => {
        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            
            if (!isValidThaiPhone(formattedPhone)) {
                return { success: false, error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' };
            }

            const result = await sendOTP(formattedPhone, lineUserId);
            
            if (result.success) {
                addToLog({
                    type: 'otp_request',
                    phone: formattedPhone,
                    lineUserId,
                    method: result.method,
                    status: 'sent'
                });
            }

            return result;
        } finally {
            setIsLoading(false);
        }
    }, [addToLog]);

    // Verify OTP
    const verifyOTPCode = useCallback(async (phone, code) => {
        const formattedPhone = formatPhoneNumber(phone);
        const result = verifyOTP(formattedPhone, code);

        if (result.success) {
            addToLog({
                type: 'otp_verify',
                phone: formattedPhone,
                status: 'success'
            });
        } else {
            addToLog({
                type: 'otp_verify',
                phone: formattedPhone,
                status: 'failed',
                error: result.message
            });
        }

        return result;
    }, [addToLog]);

    // Get notification log for a specific patient
    const getPatientNotifications = useCallback((patientPhone) => {
        return notificationLog.filter(n => n.phone === patientPhone);
    }, [notificationLog]);

    // Clear notification log
    const clearLog = useCallback(() => {
        setNotificationLog([]);
        localStorage.removeItem('ciki_notification_log');
    }, []);

    const value = {
        // State
        isLoading,
        backendStatus,
        notificationLog,
        
        // Actions
        checkStatus,
        sendAppointmentConfirmation,
        sendReminder,
        sendLineNotification,
        sendSMSOnly,
        requestOTP,
        verifyOTPCode,
        getPatientNotifications,
        clearLog,
        
        // Helpers
        formatPhoneNumber,
        isValidThaiPhone
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
