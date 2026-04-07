import Dexie from 'dexie';

export const db = new Dexie('CikiClinicDB');

// Define database schema
db.version(1).stores({
    patients: 'id, hn, name, registrationDate, active',
    appointments: 'id, patient_id, date, status, queueStatus',
    inventory: 'id, name, category, stock',
    invoices: 'id, patient_id, date, status',
    expenses: 'id, description, date, amount',
    lab_orders: 'id, patient_id, date_sent, status',
    sso_claims: 'id, patient_id, date, status',
    staff: 'id, name, role',
    attendance_records: 'id, staff_id, date, clock_in',
    sync_metadata: 'table, lastSyncTime'
});

// Helper functions for common database access
export const getLocalData = async (table) => {
    return await db.table(table).toArray();
};

export const saveLocalData = async (table, data) => {
    if (!data) return;
    return await db.table(table).bulkPut(Array.isArray(data) ? data : [data]);
};

export const clearLocalData = async (table) => {
    return await db.table(table).clear();
};
