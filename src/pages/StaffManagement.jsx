import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    Edit3, 
    Trash2, 
    Calendar, 
    Clock, 
    DollarSign, 
    Award, 
    TrendingUp,
    Search,
    Filter,
    Download,
    Upload,
    Eye,
    Settings,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Star,
    AlertCircle,
    CheckCircle,
    BarChart3,
    Target,
    X,
    Save,
    PieChart
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import '../styles/staff.css';

const StaffManagement = () => {
    const { language } = useLanguage();
    const { staff: currentStaffUser } = useAuth();
    const { 
        staff, addStaff, updateStaff, deleteStaff, 
        appointments, patients, invoices, attendanceRecords 
    } = useData();
    
    const [activeTab, setActiveTab] = useState('overview'); // overview, attendance, payroll, performance, settings
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showPayrollDetails, setShowPayrollDetails] = useState(false);
    const [selectedOffDays, setSelectedOffDays] = useState([0, 6]); // 0=Sun, 6=Sat

    useEffect(() => {
        if (editingStaff) {
            setSelectedOffDays(editingStaff.offDays || [0, 6]);
        } else {
            setSelectedOffDays([0, 6]);
        }
    }, [editingStaff, showAddStaff]);

    // Initial departments and roles metadata
    const departments = [
        { id: 'all', name: { TH: 'ทุกแผนก', EN: 'All Departments' } },
        { id: 'management', name: { TH: 'บริหาร', EN: 'Management' } },
        { id: 'clinical', name: { TH: 'ทางคลินิก', EN: 'Clinical' } },
        { id: 'admin', name: { TH: 'ธุรการ', EN: 'Administration' } }
    ];

    const roles = {
        owner: { TH: 'เจ้าของ', EN: 'Owner', color: '#64748b' },
        admin: { TH: 'ผู้ดูแลระบบ', EN: 'Admin', color: '#64748b' },
        dentist: { TH: 'ทันตแพทย์', EN: 'Dentist', color: '#3b82f6' },
        assistant: { TH: 'ผู้ช่วยทันตแพทย์', EN: 'Assistant', color: '#8b5cf6' },
        receptionist: { TH: 'พนักงานต้อนรับ', EN: 'Receptionist', color: '#f59e0b' }
    };

    const calculatePayroll = () => {
        // Dynamic payroll calculation based on attendance records
        return staff.map(employee => {
            const baseSalary = employee.salary || 0;
            const staffRecords = (attendanceRecords || []).filter(r => r.staffId === employee.id);
            
            // Calculate Performance-based additions/deductions
            const lateCount = staffRecords.filter(r => r.isLate || r.lateStatus === 'late').length;
            const lateFine = 50; // Fine per late check-in
            const deductions = (baseSalary * 0.05) + (lateCount * lateFine); 

            // Calculate OT from attendance records
            const otMinutes = staffRecords.reduce((sum, r) => sum + (r.otHours || 0) * 60, 0);
            const otRate = 150; // OT per hour
            const overtimePay = (otMinutes / 60) * otRate;

            const bonus = 0;
            const commissionRate = employee.commissionRate || (employee.role === 'dentist' ? 50 : 0);
            const total = baseSalary + overtimePay + bonus - deductions;
            
            return {
                ...employee,
                baseSalary,
                commissionRate,
                overtimePay,
                bonus,
                deductions,
                lateDays: lateCount,
                total
            };
        });
    };

    const filteredStaff = staff.filter(employee => {
        const matchesSearch = (employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });

    const handleSaveStaff = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            role: formData.get('role'),
            department: formData.get('department'),
            employeeId: formData.get('employeeId') || `STF${Math.floor(100 + Math.random() * 900)}`,
            address: formData.get('address'),
            salary: parseInt(formData.get('salary')),
            commissionRate: parseInt(formData.get('commissionRate') || 50),
            licenseNumber: formData.get('licenseNumber'),
            specialty: formData.get('specialty'),
            status: formData.get('status'),
            offDays: selectedOffDays,
            hireDate: formData.get('hireDate') || new Date().toISOString().split('T')[0]
        };

        if (editingStaff) {
            await updateStaff(editingStaff.id, data);
        } else {
            await addStaff(data);
        }
        setShowAddStaff(false);
        setEditingStaff(null);
    };

    const handleDeleteStaff = async (id) => {
        if (window.confirm(language === 'TH' ? 'ยืนยันการลบข้อมูลพนักงาน?' : 'Confirm delete staff record?')) {
            await deleteStaff(id);
        }
    };

    const StaffCard = ({ employee }) => (
        <div className="personnel-card" onClick={() => { setEditingStaff(employee); setShowAddStaff(true); }}>
            <div className="personnel-avatar-group">
                <div className="personnel-avatar" style={{ background: `linear-gradient(135deg, ${employee.avatar || '#7c3aed'} 0%, var(--neutral-900) 100%)` }}>
                    {(employee.name || 'S').charAt(0)}
                </div>
                <div className="personnel-meta">
                    <h4>{employee.name}</h4>
                    <span className="personnel-role-tag">{employee.role || 'Staff'}</span>
                    <div className="personnel-status-row">
                        <span className="status-pill" style={{
                            background: `${roles[employee.role]?.color || '#64748b'}15`,
                            color: roles[employee.role]?.color || '#64748b',
                            border: `1px solid ${roles[employee.role]?.color || '#64748b'}30`
                        }}>
                            {roles[employee.role]?.[language] || employee.role}
                        </span>
                        <span className="status-pill" style={{
                            background: employee.status === 'active' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: employee.status === 'active' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${employee.status === 'active' ? 'var(--success)' : 'var(--danger)'}30`
                        }}>
                            {employee.status === 'active' ? (language === 'TH' ? 'Active' : 'Active') : (language === 'TH' ? 'Leave' : 'On Leave')}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="personnel-details-grid">
                <div className="detail-item">
                    <div className="detail-icon"><Phone size={14} /></div>
                    <span>{employee.phone || '-'}</span>
                </div>
                <div className="detail-item">
                    <div className="detail-icon"><DollarSign size={14} /></div>
                    <span>฿{(employee.salary || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                    <div className="detail-icon"><MapPin size={14} /></div>
                    <span>{employee.department || '-'}</span>
                </div>
                <div className="detail-item">
                    <div className="detail-icon"><Calendar size={14} /></div>
                    <span>{employee.hireDate ? format(new Date(employee.hireDate), 'dd/MM/yy') : '-'}</span>
                </div>
            </div>

            {employee.role === 'dentist' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#7c3aed', fontWeight: 900, background: '#f5f3ff', padding: '6px 12px', borderRadius: '12px', width: 'fit-content', marginTop: '1.25rem', fontSize: '0.75rem' }}>
                    <PieChart size={14} />
                    <span>Commission: {employee.commissionRate || 50}%</span>
                </div>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--neutral-100)' }}>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteStaff(employee.id); }} className="btn-adj" style={{ color: '#ef4444', background: '#fef2f2' }}>
                    <Trash2 size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingStaff(employee); setShowAddStaff(true); }} className="btn-billing secondary" style={{ flex: 1, fontSize: '0.8rem', border: 'none' }}>
                    {language === 'TH' ? 'แก้ไขข้อมูล' : 'Edit Profile'}
                </button>
            </div>
        </div>
    );

    const PerformanceTable = () => {
        const stats = staff.map(employee => {
            const employeeInvoices = (invoices || []).filter(inv => inv.doctorName === employee.name);
            const totalRevenue = employeeInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const patientCount = new Set(employeeInvoices.map(inv => inv.patientId)).size;
            const commissionEarned = employeeInvoices.reduce((sum, inv) => sum + ((inv.total * (employee.commissionRate || (employee.role === 'dentist' ? 50 : 0)) / 100) || 0), 0);
            
            return {
                ...employee,
                totalRevenue,
                patientCount,
                commissionEarned
            };
        });

        return (
            <div style={{ overflowX: 'auto', padding: '1rem 0' }}>
                <table className="staff-premium-table">
                    <thead>
                        <tr>
                            <th>{language === 'TH' ? 'บุคลากร' : 'Personnel'}</th>
                            <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'คนไข้' : 'Patients'}</th>
                            <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ยอดหัตถการ' : 'Revenue'}</th>
                            <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'ค่าตอบแทน' : 'Total Comm.'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map(s => (
                            <tr key={s.id}>
                                <td>
                                    <div style={{ fontWeight: 900, color: 'var(--neutral-900)' }}>{s.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', fontWeight: 700 }}>{roles[s.role]?.[language]}</div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 950, color: 'var(--neutral-900)' }}>{s.patientCount}</td>
                                <td style={{ textAlign: 'right', fontWeight: 950 }}>฿{s.totalRevenue.toLocaleString()}</td>
                                <td style={{ textAlign: 'right', color: '#059669', fontWeight: 950 }}>฿{s.commissionEarned.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const PayrollTable = () => {
        const payroll = calculatePayroll();
        
        return (
            <div style={{ overflowX: 'auto', padding: '1rem 0' }}>
                <table className="staff-premium-table">
                    <thead>
                        <tr>
                            <th>{language === 'TH' ? 'บุคลากร' : 'Personnel'}</th>
                            <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'เงินเดือน' : 'Base'}</th>
                            <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'เบี้ยขยัน/OT' : 'Extra/OT'}</th>
                            <th style={{ textAlign: 'right' }}>{language === 'TH' ? 'สุทธิ' : 'Net Total'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payroll.map(employee => (
                            <tr key={employee.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '12px',
                                            background: `linear-gradient(135deg, ${employee.avatar || '#7c3aed'} 0%, var(--neutral-900) 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 900,
                                            fontSize: '0.875rem'
                                        }}>
                                            {(employee.name || 'S').charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, color: 'var(--neutral-900)' }}>{employee.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--neutral-400)', fontWeight: 700 }}>
                                                {roles[employee.role]?.[language]}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--neutral-900)' }}>
                                    ฿{(employee.baseSalary || 0).toLocaleString()}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 900 }}>
                                        +{employee.overtimePay.toLocaleString()}
                                    </div>
                                    <div style={{ color: '#dc2626', fontSize: '0.7rem', fontWeight: 700 }}>
                                        {employee.lateDays > 0 ? `-${(employee.lateDays * 50).toLocaleString()}` : '0'} ({employee.lateDays}d)
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 950, color: '#4f46e5', fontSize: '1.05rem' }}>
                                    ฿{(employee.total || 0).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="staff-container">
            {/* Header */}
            <div className="staff-header-glass animate-fade-in">
                <div className="staff-title-row">
                    <div className="staff-title-group">
                        <h1>
                            <div className="staff-icon-box">
                                <Users size={28} />
                            </div>
                            {language === 'TH' ? 'บริหารจัดการบุคลากร' : 'Human Capital'}
                        </h1>
                    </div>
                    <button 
                        onClick={() => { setEditingStaff(null); setShowAddStaff(true); }}
                        className="btn-billing primary"
                        style={{ border: 'none', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    >
                        <UserPlus size={18} />
                        {language === 'TH' ? 'เพิ่มพนักงาน' : 'Enroll Staff'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="staff-tab-rail">
                    {[
                        { id: 'overview', label: { TH: 'ภาพรวม', EN: 'Overview' }, icon: Users },
                        { id: 'attendance', label: { TH: 'การเข้างาน', EN: 'Attendance' }, icon: Clock },
                        { id: 'payroll', label: { TH: 'บัญชีเงินเดือน', EN: 'Payroll' }, icon: DollarSign },
                        { id: 'performance', label: { TH: 'ผลงาน', EN: 'Performance' }, icon: Target },
                        { id: 'settings', label: { TH: 'ตั้งค่า HR', EN: 'Settings' }, icon: Settings }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`staff-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <tab.icon size={16} />
                            <span className="hidden md:inline">{tab.label[language]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div>
                    {/* Filters */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className="staff-search-wrapper">
                                <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                                <input
                                    type="text"
                                    placeholder={language === 'TH' ? 'ค้นหารายชื่อบุคลากร...' : 'Search personnel directory...'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="staff-search-box"
                                />
                            </div>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="btn-billing secondary"
                                style={{ width: '220px', padding: '1.15rem', borderRadius: '20px', border: '1.5px solid var(--neutral-100)', fontWeight: 800 }}
                            >
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name[language]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Staff Grid */}
                    <div className="staff-directory-grid">
                        {filteredStaff.map(employee => (
                            <StaffCard key={employee.id} employee={employee} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="staff-header-glass animate-fade-in" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 950, fontSize: '1.5rem', color: 'var(--neutral-900)' }}>
                        <Clock size={24} color="#7c3aed" />
                        {language === 'TH' ? 'รายงานการเข้างานบุคลากร' : 'Staff Attendance Tracker'}
                    </h3>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table className="staff-premium-table">
                            <thead>
                                <tr>
                                    <th>{language === 'TH' ? 'บุคลากร' : 'Personnel'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'ลงเวลาวันนี้' : 'Clocked Today'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'จำนวนวันทำงาน' : 'Total Days'}</th>
                                    <th style={{ textAlign: 'center' }}>{language === 'TH' ? 'สถานะล่าสุด' : 'Current Status'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.filter(s => s.status === 'active').map(s => {
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const thisMonthStr = todayStr.substring(0, 7);
                                    
                                    const memberRecords = (attendanceRecords || []).filter(r => r.staffId === s.id);
                                    const todayRecord = memberRecords.find(r => (r.timestamp || r.date)?.startsWith(todayStr));
                                    const monthRecords = memberRecords.filter(r => (r.timestamp || r.date)?.startsWith(thisMonthStr));
                                    const presentDays = new Set(monthRecords.map(r => (r.timestamp || r.date)?.split('T')[0])).size;

                                    return (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 900, color: 'var(--neutral-900)' }}>{s.name}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {todayRecord ? (
                                                    <span className="status-pill" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.8rem', padding: '6px 12px' }}>
                                                        {new Date(todayRecord.timestamp || todayRecord.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 950, color: 'var(--neutral-900)' }}>{presentDays}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                {todayRecord ? (
                                                    <span className="status-pill" style={{ 
                                                        background: todayRecord.isLate ? '#fff7ed' : '#ecfdf5', 
                                                        color: todayRecord.isLate ? '#d97706' : '#059669',
                                                        fontSize: '0.7rem',
                                                        padding: '6px 12px'
                                                    }}>
                                                        {todayRecord.isLate ? (language === 'TH' ? 'เข้างานสาย' : 'Late Entrance') : (language === 'TH' ? 'ตรงเวลา' : 'On Time')}
                                                    </span>
                                                ) : (
                                                    <span className="status-pill" style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.7rem', padding: '6px 12px' }}>
                                                        {language === 'TH' ? 'ยังไม่เช็คอิน' : 'Await Arrival'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'payroll' && (
                <div className="staff-header-glass animate-fade-in" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 950, fontSize: '1.5rem', color: 'var(--neutral-900)' }}>
                        <DollarSign size={24} color="#7c3aed" />
                        {language === 'TH' ? 'ประมวลผลจ่ายค่าตอบแทน' : 'Payroll Management'}
                    </h3>
                    <PayrollTable />
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="staff-header-glass animate-fade-in" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 950, fontSize: '1.5rem', color: 'var(--neutral-900)' }}>
                            <Target size={24} color="#7c3aed" />
                            {language === 'TH' ? 'ประเมินศักยภาพบุคลากร' : 'Performance Analysis'}
                        </h3>
                        <div style={{ padding: '8px 16px', background: '#f5f3ff', color: '#7c3aed', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {language === 'TH' ? 'อัปเดตเรียลไทม์' : 'Real-time Metrics'}
                        </div>
                    </div>
                    <PerformanceTable />
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '2rem', background: 'white' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                        <Settings size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ตั้งค่าระบบพนักงาน' : 'HR System Settings'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', border: '1px solid var(--neutral-100)', borderRadius: '16px' }}>
                            <h4 style={{ margin: '0 0 1rem 0' }}>{language === 'TH' ? 'เวลาทำงานมาตรฐาน' : 'Standard Working Hours'}</h4>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{language === 'TH' ? 'เวลาเข้างาน' : 'Clock In'}</span>
                                    <input type="time" defaultValue="09:00" className="form-input" style={{ width: '120px' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{language === 'TH' ? 'เวลาเลิกงาน' : 'Clock Out'}</span>
                                    <input type="time" defaultValue="20:00" className="form-input" style={{ width: '120px' }} />
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '1.5rem', border: '1px solid var(--neutral-100)', borderRadius: '16px' }}>
                            <h4 style={{ margin: '0 0 1rem 0' }}>{language === 'TH' ? 'นโยบายเงินเดือน' : 'Payroll Policy'}</h4>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{language === 'TH' ? 'วันที่จ่ายเงินเดือน' : 'Pay Day'}</span>
                                    <select className="form-input" style={{ width: '120px' }}>
                                        <option>25</option>
                                        <option>30</option>
                                        <option>1</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{language === 'TH' ? 'หักประกันสังคม' : 'Social Security'}</span>
                                    <input type="checkbox" defaultChecked />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddStaff && (
                <div className="modal-overlay" onClick={() => setShowAddStaff(false)}>
                    <div className="modal-container" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{editingStaff ? (language === 'TH' ? 'แก้ไขพนักงาน' : 'Edit Staff') : (language === 'TH' ? 'ลงทะเบียนพนักงานใหม่' : 'Enroll New Staff')}</h2>
                            <button onClick={() => setShowAddStaff(false)} className="modal-close"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSaveStaff}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'ชื่อ-นามสกุล' : 'Full Name'}</label>
                                    <input name="name" defaultValue={editingStaff?.name} required className="form-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'อีเมล' : 'Email'}</label>
                                    <input name="email" type="email" defaultValue={editingStaff?.email} required className="form-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'รหัสพนักงาน' : 'Employee ID'}</label>
                                    <input name="employeeId" defaultValue={editingStaff?.employeeId} className="form-input" style={{ width: '100%' }} placeholder="STF001" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'เบอร์โทรศัพท์' : 'Phone'}</label>
                                    <input name="phone" defaultValue={editingStaff?.phone} required className="form-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'ตำแหน่ง' : 'Role'}</label>
                                    <select name="role" defaultValue={editingStaff?.role || 'dentist'} className="form-input" style={{ width: '100%' }}>
                                        <option value="dentist">Dentist</option>
                                        <option value="assistant">Assistant</option>
                                        <option value="receptionist">Receptionist</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'แผนก' : 'Department'}</label>
                                    <select name="department" defaultValue={editingStaff?.department || 'clinical'} className="form-input" style={{ width: '100%' }}>
                                        <option value="management">Management</option>
                                        <option value="clinical">Clinical</option>
                                        <option value="admin">Administration</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'ฐานเงินเดือน' : 'Salary'}</label>
                                    <input name="salary" type="number" defaultValue={editingStaff?.salary} required className="form-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: editingStaff?.role === 'dentist' ? 'var(--primary-600)' : 'inherit' }}>
                                        {language === 'TH' ? 'ส่วนแบ่งรายได้ (%)' : 'Commission Rate (%)'}
                                        {editingStaff?.role === 'dentist' && ' *'}
                                    </label>
                                    <input name="commissionRate" type="number" defaultValue={editingStaff?.commissionRate || 50} required className="form-input" style={{ width: '100%', borderColor: editingStaff?.role === 'dentist' ? 'var(--primary-200)' : 'var(--neutral-200)' }} />
                                    {editingStaff?.role === 'dentist' && <span style={{ fontSize: '0.7rem', color: 'var(--primary-500)', fontWeight: 600 }}>{language === 'TH' ? 'จำเป็นสำหรับแพทย์เพื่อคำนวณรายได้' : 'Required for doctor income calculation'}</span>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'เลขที่ใบอนุญาต' : 'License Number'}</label>
                                    <input name="licenseNumber" defaultValue={editingStaff?.licenseNumber} className="form-input" style={{ width: '100%' }} placeholder="ว.xxxxx / พ.xxxxx" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'ความเชี่ยวชาญ' : 'Specialty'}</label>
                                    <input name="specialty" defaultValue={editingStaff?.specialty} className="form-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'วันที่เริ่มงาน' : 'Hire Date'}</label>
                                    <input name="hireDate" type="date" defaultValue={editingStaff?.hireDate || new Date().toISOString().split('T')[0]} className="form-input" style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'สถานะ' : 'Status'}</label>
                                    <select name="status" defaultValue={editingStaff?.status || 'active'} className="form-input" style={{ width: '100%' }}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem' }}>{language === 'TH' ? 'วันหยุดประจำสัปดาห์ (ไม่มีการนับขาด)' : 'Weekly Off-days (not counted as absent)'}</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {[
                                            { id: 1, label: { TH: 'จันทร์', EN: 'Mon' } },
                                            { id: 2, label: { TH: 'อังคาร', EN: 'Tue' } },
                                            { id: 3, label: { TH: 'พุธ', EN: 'Wed' } },
                                            { id: 4, label: { TH: 'พฤหัสบดี', EN: 'Thu' } },
                                            { id: 5, label: { TH: 'ศุกร์', EN: 'Fri' } },
                                            { id: 6, label: { TH: 'เสาร์', EN: 'Sat' } },
                                            { id: 0, label: { TH: 'อาทิตย์', EN: 'Sun' } },
                                        ].map(day => {
                                            const isActive = selectedOffDays.includes(day.id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={day.id}
                                                    onClick={() => setSelectedOffDays(prev => isActive ? prev.filter(d => d !== day.id) : [...prev, day.id])}
                                                    style={{
                                                        padding: '0.6rem 1rem',
                                                        borderRadius: '12px',
                                                        border: '2px solid',
                                                        borderColor: isActive ? 'var(--danger-500)' : 'var(--neutral-200)',
                                                        background: isActive ? 'var(--danger-50)' : 'white',
                                                        color: isActive ? 'var(--danger-700)' : 'var(--neutral-500)',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        flex: 1,
                                                        minWidth: '70px',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {day.label[language]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>{language === 'TH' ? 'ที่อยู่' : 'Address'}</label>
                                    <input name="address" defaultValue={editingStaff?.address} className="form-input" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 800 }}>
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    {language === 'TH' ? 'บันทึกข้อมูลพนักงาน' : 'Save Staff Details'}
                                </button>
                            </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
