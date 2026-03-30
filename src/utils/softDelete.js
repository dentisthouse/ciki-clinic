import { supabase } from '../supabase.js';

// Soft delete helper - updates deleted_at instead of actually deleting
export const softDelete = async (table, id, deletedBy = null) => {
    const updates = {
        deleted_at: new Date().toISOString(),
        is_deleted: true
    };
    
    if (deletedBy) {
        updates.deleted_by = deletedBy;
    }

    const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    
    // Log the deletion
    await logAudit('DELETE', table, id, null, updates, deletedBy);
    
    return data;
};

// Restore soft-deleted record
export const restoreSoftDelete = async (table, id, restoredBy = null) => {
    const updates = {
        deleted_at: null,
        is_deleted: false,
        restored_at: new Date().toISOString(),
        restored_by: restoredBy
    };

    const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    
    await logAudit('RESTORE', table, id, null, updates, restoredBy);
    
    return data;
};

// Get only non-deleted records
export const getActiveRecords = async (table, options = {}) => {
    const { 
        select = '*', 
        filters = {}, 
        orderBy = 'created_at', 
        order = 'desc',
        page = 1,
        pageSize = 50
    } = options;

    let query = supabase
        .from(table)
        .select(select, { count: 'exact' })
        .is('is_deleted', false)
        .or(`is_deleted.is.null,deleted_at.is.null`)
        .order(orderBy, { ascending: order === 'asc' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
        }
    });

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
    };
};

// Audit logging
export const logAudit = async (action, tableName, recordId, oldData, newData, userId = null) => {
    const auditEntry = {
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData,
        user_id: userId,
        ip_address: null, // Would need server-side or additional lib
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log('📝 Audit Log:', auditEntry);
    }

    // Send to Supabase (fire and forget - don't block on audit log)
    supabase
        .from('audit_logs')
        .insert(auditEntry)
        .then(({ error }) => {
            if (error) console.error('Failed to write audit log:', error);
        })
        .catch(err => {
            console.error('Audit log error:', err);
        });
};

// Wrapper for update operations with audit logging
export const updateWithAudit = async (table, id, updates, oldData, userId = null) => {
    const { data, error } = await supabase
        .from(table)
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
            updated_by: userId
        })
        .eq('id', id)
        .select();

    if (error) throw error;
    
    await logAudit('UPDATE', table, id, oldData, updates, userId);
    
    return data;
};

// Wrapper for insert operations with audit logging
export const insertWithAudit = async (table, data, userId = null) => {
    const insertData = {
        ...data,
        created_at: new Date().toISOString(),
        created_by: userId,
        is_deleted: false
    };

    const { data: result, error } = await supabase
        .from(table)
        .insert(insertData)
        .select();

    if (error) throw error;
    
    await logAudit('CREATE', table, result[0]?.id, null, insertData, userId);
    
    return result;
};

// Get audit logs for a specific record
export const getAuditLogs = async (tableName, recordId, options = {}) => {
    const { page = 1, pageSize = 50 } = options;
    
    let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
    };
};

// Bulk soft delete
export const bulkSoftDelete = async (table, ids, deletedBy = null) => {
    const updates = {
        deleted_at: new Date().toISOString(),
        is_deleted: true,
        deleted_by: deletedBy
    };

    const { data, error } = await supabase
        .from(table)
        .update(updates)
        .in('id', ids)
        .select();

    if (error) throw error;
    
    // Log each deletion
    for (const id of ids) {
        await logAudit('BULK_DELETE', table, id, null, updates, deletedBy);
    }
    
    return data;
};

// Permanent delete (use with caution!)
export const permanentDelete = async (table, id, deletedBy = null) => {
    // First soft delete
    await softDelete(table, id, deletedBy);
    
    // Then schedule for permanent deletion (after 30 days)
    const { error } = await supabase
        .from('deletion_queue')
        .insert({
            table_name: table,
            record_id: id,
            scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            requested_by: deletedBy,
            created_at: new Date().toISOString()
        });

    if (error) throw error;
    
    return { message: 'Record scheduled for permanent deletion in 30 days' };
};

export default {
    softDelete,
    restoreSoftDelete,
    getActiveRecords,
    logAudit,
    updateWithAudit,
    insertWithAudit,
    getAuditLogs,
    bulkSoftDelete,
    permanentDelete
};
