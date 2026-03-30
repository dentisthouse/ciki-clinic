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
            border: '1px solid var(--neutral-200)',
            borderRadius: '12px',
            background: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
        onClick={() => setSelectedStaff(employee)}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-300)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--neutral-200)';
            e.currentTarget.style.boxShadow = 'none';
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: employee.avatar || '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.2rem'
                }}>
                    {employee.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{employee.name}</h4>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                        {employee.email}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: `${roles[employee.role]?.color}10`,
                            color: roles[employee.role]?.color
                        }}>
                            {roles[employee.role]?.[language]}
                        </span>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: employee.status === 'active' ? '#dcfce7' : '#fee2e2',
                            color: employee.status === 'active' ? '#16a34a' : '#dc2626'
                        }}>
                            {employee.status === 'active' ? (language === 'TH' ? 'ทำงาน' : 'Active') : (language === 'TH' ? 'ลา' : 'Leave')}
                        </span>
                    </div>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} color="var(--neutral-500)" />
                    <span>{employee.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={14} color="var(--neutral-500)" />
                    <span>{employee.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={14} color="var(--neutral-500)" />
                    <span>฿{employee.salary.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} color="var(--neutral-500)" />
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
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={32} color="var(--primary-600)" />
                        {language === 'TH' ? 'จัดการพนักงาน' : 'Staff Management'}
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => setShowAddStaff(true)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <UserPlus size={18} />
                            {language === 'TH' ? 'เพิ่มพนักงาน' : 'Add Staff'}
                        </button>
                        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} />
                            {language === 'TH' ? 'ส่งออก' : 'Export'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
                    {[
                        { id: 'overview', label: { TH: 'ภาพรวม', EN: 'Overview' } },
                        { id: 'attendance', label: { TH: 'การเข้างาน', EN: 'Attendance' } },
                        { id: 'payroll', label: { TH: 'ค่าจ้าง', EN: 'Payroll' } },
                        { id: 'performance', label: { TH: 'ประสิทธิภาพ', EN: 'Performance' } },
                        { id: 'settings', label: { TH: 'ตั้งค่า', EN: 'Settings' } }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary-700)' : 'var(--neutral-600)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
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
