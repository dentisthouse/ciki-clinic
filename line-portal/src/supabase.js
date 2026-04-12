import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ฟังก์ชันสำหรับจัดการข้อมูลผู้ใช้
export const userService = {
  // ค้นหาผู้ใช้จากเบอร์โทรศัพท์
  async findUserByPhone(phone) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phone)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error finding user by phone:', error)
        return { error }
      }
      
      return { data }
    } catch (err) {
      console.error('Database error:', err)
      return { error: err }
    }
  },

  // ค้นหาผู้ใช้จาก LINE User ID
  async findUserByLineId(lineId) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('line_id', lineId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error finding user by LINE ID:', error)
        return { error }
      }
      
      return { data }
    } catch (err) {
      console.error('Database error:', err)
      return { error: err }
    }
  },

  // สร้างผู้ใช้ใหม่
  async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: userData.name,
          phone: userData.phone || '',
          email: userData.email || '',
          line_id: userData.line_id || '',
          line_profile_pic: userData.line_profile_pic || '',
          status: 'Active',
          points: userData.points || 0,
          tier: userData.tier || 'Standard',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating user:', error)
        return { error }
      }
      
      return { data }
    } catch (err) {
      console.error('Database error:', err)
      return { error: err }
    }
  },

  // อัปเดตข้อมูลผู้ใช้
  async updateUser(userId, updateData) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating user:', error)
        return { error }
      }
      
      return { data }
    } catch (err) {
      console.error('Database error:', err)
      return { error: err }
    }
  },

  // ดึงข้อมูลนัดหมายของผู้ใช้
  async getUserAppointments(userId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', userId)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
      
      if (error) {
        console.error('Error fetching appointments:', error)
        return { error }
      }
      
      return { data: data || [] }
    } catch (err) {
      console.error('Database error:', err)
      return { error: err }
    }
  },

  // สร้างนัดหมายใหม่
  async createAppointment(appointmentData) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: appointmentData.patient_id,
          patient_name: appointmentData.patient_name || 'ไม่ระบุชื่อ',
          phone: appointmentData.phone || '',
          treatment: appointmentData.treatment,
          date: appointmentData.date,
          time: appointmentData.time,
          branch: appointmentData.branch,
          status: 'Pending',
          // Prepend type indicator to notes for persistence workaround in main app
          notes: `📱 [LINE] ${appointmentData.notes || ''}`.trim(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) {
        console.error('Error creating appointment:', error)
        return { error }
      }
      
      return { data }
    } catch (err) {
      console.error('Database error:', err)
      return { error: err }
    }
  }
}

export default supabase
