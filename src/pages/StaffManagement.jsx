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
    Target
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const StaffManagement = () => {
    const { language } = useLanguage();
    const { staff } = useAuth();
    const { appointments, patients, billingRecords } = useData();
    
    const [activeTab, setActiveTab] = useState('overview'); // overview, attendance, payroll, performance, settings
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [showPayrollDetails, setShowPayrollDetails] = useState(false);

    // ข้อมูลพนักงาน (จำลอง)
    const [staffList, setStaffList] = useState([
        {
            id: 1,
            name: 'หมออ้อม',
            email: 'aom@dental.com',
            role: 'owner',
            department: 'management',
            phone: '0812345678',
            address: 'กรุงเทพฯ',
            salary: 80000,
            hireDate: '2020-01-15',
            status: 'active',
            avatar: '#3b82f6',
            performance: {
                rating: 4.8,
                patientsTreated: 1240,
                revenue: 2400000,
                satisfaction: 96
            }
        },
        {
            id: 2,
            name: 'หมอต้อง',
            email: 'tong@dental.com',
            role: 'owner',
            department: 'management',
            phone: '0823456789',
            address: 'กรุงเทพฯ',
            salary: 75000,
            hireDate: '2020-03-20',
            status: 'active',
            avatar: '#8b5cf6',
            performance: {
                rating: 4.7,
                patientsTreated: 980,
                revenue: 1850000,
                satisfaction: 94
            }
        },
        {
            id: 3,
            name: 'หมอบิ๊ก',
            email: 'big@dental.com',
            role: 'dentist',
            department: 'clinical',
            phone: '0834567890',
            address: 'กรุงเทพฯ',
            salary: 60000,
            hireDate: '2021-06-10',
            status: 'active',
            avatar: '#10b981',
            performance: {
                rating: 4.6,
                patientsTreated: 856,
                revenue: 1560000,
                satisfaction: 92
            }
        },
        {
            id: 4,
            name: 'สมศรี ใจดี',
            email: 'somsri@ciki.com',
            role: 'receptionist',
            department: 'admin',
            phone: '0845678901',
            address: 'นนทบุรี',
            salary: 25000,
            hireDate: '2022-01-05',
            status: 'active',
            avatar: '#f59e0b',
            performance: {
                rating: 4.5,
                patientsHandled: 2100,
                appointments: 4500,
                satisfaction: 88
            }
        },
        {
            id: 5,
            name: 'มานี รักงาน',
            email: 'manee@ciki.com',
            role: 'assistant',
            department: 'clinical',
            phone: '0856789012',
            address: 'ปทุมธานี',
            salary: 20000,
            hireDate: '2022-08-15',
            status: 'active',
            avatar: '#ec4899',
            performance: {
                rating: 4.4,
                patientsAssisted: 1800,
                procedures: 3200,
                satisfaction: 90
            }
        }
    ]);

    // ข้อมูลการเข้างาน (จำลอง)
    const [attendanceData, setAttendanceData] = useState([
        {
            id: 1,
            staffId: 1,
            date: '2024-03-01',
            checkIn: '08:45',
            checkOut: '18:15',
            overtime: '1:15',
            status: 'present',
            totalHours: 9.5
        },
        {
            id: 2,
            staffId: 2,
            date: '2024-03-01',
            checkIn: '08:30',
            checkOut: '17:45',
            overtime: '0:15',
            status: 'present',
            totalHours: 9.25
        }
    ]);

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

    useEffect(() => {
        loadStaffData();
        loadAttendanceData();
    }, []);

    const loadStaffData = () => {
        // จำลองการโหลดข้อมูลจาก API
        console.log('Loading staff data...');
    };

    const loadAttendanceData = () => {
        // จำลองการโหลดข้อมูลการเข้างาน
        console.log('Loading attendance data...');
    };

    const calculatePayroll = () => {
        const { startDate, endDate } = getPeriodDates();
        
        return staffList.map(employee => {
            const baseSalary = employee.salary;
            const overtimeHours = calculateOvertime(employee.id, startDate, endDate);
            const overtimePay = overtimeHours * (baseSalary / 160) * 1.5; // 1.5x สำหรับ OT
            const bonus = calculateBonus(employee);
            const deductions = calculateDeductions(employee);
            const total = baseSalary + overtimePay + bonus - deductions;
            
            return {
                ...employee,
                baseSalary,
                overtimeHours,
                overtimePay,
                bonus,
                deductions,
                total
            };
        });
    };

    const calculateOvertime = (staffId, startDate, endDate) => {
        const staffAttendance = attendanceData.filter(att => 
            att.staffId === staffId && 
            new Date(att.date) >= startDate && 
            new Date(att.date) <= endDate
        );
        
        return staffAttendance.reduce((total, att) => {
            const [hours, minutes] = att.overtime.split(':').map(Number);
            return total + hours + minutes / 60;
        }, 0);
    };

    const calculateBonus = (employee) => {
        // โบนัสตามประสิทธิภาพ
        const performanceBonus = employee.performance?.rating >= 4.5 ? 5000 : 0;
        const revenueBonus = employee.performance?.revenue > 1000000 ? 3000 : 0;
        return performanceBonus + revenueBonus;
    };

    const calculateDeductions = (employee) => {
        // หัก ภาษี และประกันสังคม
        const tax = employee.salary * 0.05; // 5% ภาษี
        const socialSecurity = Math.min(employee.salary * 0.05, 750); // 5% สังคม สูงสุด 750
        return tax + socialSecurity;
    };

    const getPeriodDates = () => {
        const now = new Date();
        let startDate, endDate;
        
        switch (selectedPeriod) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                endDate = new Date(now.setDate(now.getDate() + (6 - now.getDay())));
                break;
            case 'month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                break;
            default:
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
        }
        
        return { startDate, endDate };
    };

    const filteredStaff = staffList.filter(employee => {
        const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });

    const StaffCard = ({ employee }) => (
        <div style={{
            padding: '1.5rem',
            border: '1px solid var(--neutral-100)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--glass-premium-bg)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: 'var(--shadow-sm)'
        }}
        onClick={() => setSelectedStaff(employee)}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-300)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--neutral-100)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    background: `linear-gradient(135deg, ${employee.avatar || '#3b82f6'} 0%, var(--neutral-900) 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    {employee.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--neutral-900)', letterSpacing: '-0.02em' }}>{employee.name}</h4>
                    <p style={{ margin: '0.15rem 0 0.5rem', fontSize: '0.85rem', color: 'var(--neutral-400)', fontWeight: 600 }}>
                        {employee.email}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: `${roles[employee.role]?.color}15`,
                            color: roles[employee.role]?.color,
                            border: `1px solid ${roles[employee.role]?.color}30`
                        }}>
                            {roles[employee.role]?.[language]}
                        </span>
                        <span style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            background: employee.status === 'active' ? 'var(--success-light)' : 'var(--danger-light)',
                            color: employee.status === 'active' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${employee.status === 'active' ? 'var(--success)' : 'var(--danger)'}30`
                        }}>
                            {employee.status === 'active' ? (language === 'TH' ? 'ปฏิบัติงาน' : 'Active') : (language === 'TH' ? 'พักงาน' : 'On Leave')}
                        </span>
                    </div>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.85rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                    <Phone size={16} color="var(--primary-600)" />
                    <span>{employee.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                    <DollarSign size={16} color="var(--primary-600)" />
                    <span>฿{employee.salary.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                    <MapPin size={16} color="var(--primary-600)" />
                    <span>{employee.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                    <Calendar size={16} color="var(--primary-600)" />
                    <span>{format(new Date(employee.hireDate), language === 'TH' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}</span>
                </div>
            </div>
            
            {employee.performance && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {language === 'TH' ? 'ประสิทธิภาพ' : 'Performance'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                            <span style={{ fontWeight: 600 }}>{employee.performance.rating}</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                        {employee.role === 'dentist' ? (
                            <>
                                {language === 'TH' ? 'ผู้ป่วยที่รักษา' : 'Patients Treated'}: {employee.performance.patientsTreated} • 
                                {language === 'TH' ? 'รายได้' : 'Revenue'}: ฿{employee.performance.revenue.toLocaleString()}
                            </>
                        ) : (
                            <>
                                {language === 'TH' ? 'ความพึงพอใจ' : 'Satisfaction'}: {employee.performance.satisfaction}%
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const PayrollTable = () => {
        const payroll = calculatePayroll();
        
        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--neutral-50)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                {language === 'TH' ? 'พนักงาน' : 'Employee'}
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                {language === 'TH' ? 'เงินเดือน' : 'Base Salary'}
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                {language === 'TH' ? 'OT' : 'Overtime'}
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                {language === 'TH' ? 'โบนัส' : 'Bonus'}
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                {language === 'TH' ? 'หัก' : 'Deductions'}
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                {language === 'TH' ? 'สุทธิ' : 'Net Pay'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {payroll.map(employee => (
                            <tr key={employee.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: employee.avatar || '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.875rem'
                                        }}>
                                            {employee.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{employee.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                                                {roles[employee.role]?.[language]}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    ฿{employee.baseSalary.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    ฿{employee.overtimePay.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    ฿{employee.bonus.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    ฿{employee.deductions.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                    ฿{employee.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        <tr style={{ background: 'var(--neutral-50)', fontWeight: 700 }}>
                            <td style={{ padding: '1rem' }} colSpan={6}>
                                {language === 'TH' ? 'รวมทั้งหมด' : 'Total'}: ฿{payroll.reduce((sum, emp) => sum + emp.total, 0).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="staff-management" style={{ padding: '2rem' }}>
            {/* Header */}
            <div className="glass-panel-premium animate-fade-in" style={{ 
                padding: '2.5rem', marginBottom: '2.5rem', 
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--neutral-100)',
                background: 'linear-gradient(135deg, white 0%, var(--primary-50) 100%)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--neutral-900)', letterSpacing: '-0.04em' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--primary-600)', borderRadius: '16px', color: 'white', boxShadow: 'var(--shadow-md)' }}>
                                <Users size={32} />
                            </div>
                            {language === 'TH' ? 'บริหารจัดการพนักงาน' : 'Human Capital'}
                        </h1>
                        <p style={{ color: 'var(--neutral-500)', fontWeight: 600, marginTop: '0.5rem', fontSize: '1.1rem', marginLeft: '4.5rem' }}>
                            {language === 'TH' ? 'จัดการทีมงานและประสิทธิภาพของบุคลากร' : 'Manage your professional clinical team'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => setShowAddStaff(true)}
                            className="btn btn-primary"
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '0.75rem', 
                                padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: 800,
                                background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-md)', border: 'none'
                            }}
                        >
                            <UserPlus size={20} />
                            {language === 'TH' ? 'เพิ่มพนักงานใหม่' : 'Enroll Staff'}
                        </button>
                        <button className="btn btn-secondary" style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.8rem 1.25rem', borderRadius: '14px', fontWeight: 700,
                            background: 'white', border: '1.5px solid var(--neutral-200)', boxShadow: 'var(--shadow-sm)'
                        }}>
                            <Download size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'รายงาน' : 'Report'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {[
                        { id: 'overview', label: { TH: 'พนักงานทั้งหมด', EN: 'All Staff' }, icon: Users },
                        { id: 'attendance', label: { TH: 'เวลาเข้างาน', EN: 'Attendance' }, icon: Clock },
                        { id: 'payroll', label: { TH: 'เงินเดือน/ค่าจ้าง', EN: 'Payroll' }, icon: DollarSign },
                        { id: 'performance', label: { TH: 'ประเมินผล', EN: 'Performance' }, icon: Target },
                        { id: 'settings', label: { TH: 'ตั้งค่าระบบ', EN: 'HR System' }, icon: Settings }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.85rem 1.5rem',
                                border: 'none',
                                borderRadius: '12px',
                                background: activeTab === tab.id ? 'var(--neutral-900)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--neutral-500)',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s ease',
                                boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label[language]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div>
                    {/* Filters */}
                    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <div className="search-wrapper" style={{ position: 'relative' }}>
                                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                                    <input
                                        type="text"
                                        placeholder={language === 'TH' ? 'ค้นหาพนักงาน...' : 'Search staff...'}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 3rem',
                                            border: '1px solid var(--neutral-200)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </div>
                            </div>
                            
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                style={{ 
                                    padding: '0.75rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--neutral-200)',
                                    background: 'white'
                                }}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        {filteredStaff.map(employee => (
                            <StaffCard key={employee.id} employee={employee} />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'บันทึกเวลาทำงาน' : 'Time Attendance'}
                    </h3>
                    
                    <div style={{ 
                        height: '400px', 
                        background: 'var(--neutral-50)', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--neutral-500)'
                    }}>
                        {language === 'TH' ? 'ตารางบันทึกเวลาทำงาน' : 'Attendance time table'}
                    </div>
                </div>
            )}

            {activeTab === 'payroll' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'คำนวณค่าจ้าง' : 'Payroll Calculation'}
                        </h3>
                        
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            style={{ 
                                padding: '0.75rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--neutral-200)',
                                background: 'white'
                            }}
                        >
                            <option value="week">{language === 'TH' ? 'สัปดาห์' : 'Week'}</option>
                            <option value="month">{language === 'TH' ? 'เดือน' : 'Month'}</option>
                            <option value="quarter">{language === 'TH' ? 'ไตรมาส' : 'Quarter'}</option>
                        </select>
                    </div>
                    
                    <PayrollTable />
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ประเมินประสิทธิภาพ' : 'Performance Review'}
                    </h3>
                    
                    <div style={{ 
                        height: '400px', 
                        background: 'var(--neutral-50)', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--neutral-500)'
                    }}>
                        {language === 'TH' ? 'กราฟประสิทธิภาพพนักงาน' : 'Staff performance charts'}
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ตั้งค่า HR' : 'HR Settings'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                {language === 'TH' ? 'นโยบายการเข้างาน' : 'Attendance Policies'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {language === 'TH' ? 'เวลาทำงาน' : 'Working Hours'}
                                    </label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <input type="time" defaultValue="08:30" style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--neutral-200)' }} />
                                        <span>-</span>
                                        <input type="time" defaultValue="17:30" style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--neutral-200)' }} />
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {language === 'TH' ? 'วันหยุด' : 'Holidays'}
                                    </label>
                                    <textarea 
                                        placeholder={language === 'TH' ? 'ระบุวันหยุด...' : 'Enter holidays...'}
                                        rows={3}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--neutral-200)',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                {language === 'TH' ? 'นโยบายเงินเดือน' : 'Salary Policies'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {language === 'TH' ? 'อัตราค่า OT' : 'OT Rate'}
                                    </label>
                                    <input 
                                        type="number" 
                                        defaultValue="1.5" 
                                        step="0.1"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--neutral-200)'
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {language === 'TH' ? 'วันทำงานต่อเดือน' : 'Working Days/Month'}
                                    </label>
                                    <input 
                                        type="number" 
                                        defaultValue="22" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--neutral-200)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
