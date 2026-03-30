import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    DollarSign, 
    Users, 
    Calendar, 
    Clock, 
    TrendingUp, 
    Download, 
    Printer,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Receipt,
    PiggyBank,
    Activity
} from 'lucide-react';
import { format, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const DailyReport = () => {
    const { language } = useLanguage();
    const { appointments, patients, billingRecords, expenses } = useData();
    const { staff } = useAuth();
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        generateReport();
    }, [selectedDate, appointments, patients, billingRecords, expenses]);

    const generateReport = () => {
        setIsLoading(true);
        
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);
        
        // กรองข้อมูลตามวันที่เลือก
        const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= start && aptDate <= end;
        });

        const dayBilling = billingRecords.filter(bill => {
            const billDate = new Date(bill.date || bill.createdAt);
            return billDate >= start && billDate <= end;
        });

        const dayExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });

        // คำนวณสถิติ
        const totalRevenue = dayBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const totalExpenses = dayExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        
        const completedAppointments = dayAppointments.filter(apt => apt.status === 'completed').length;
        const cancelledAppointments = dayAppointments.filter(apt => apt.status === 'cancelled').length;
        const noShowAppointments = dayAppointments.filter(apt => apt.status === 'no-show').length;
        
        const paymentMethods = {
            cash: dayBilling.filter(bill => bill.paymentMethod === 'cash').reduce((sum, bill) => sum + (bill.amount || 0), 0),
            card: dayBilling.filter(bill => bill.paymentMethod === 'card').reduce((sum, bill) => sum + (bill.amount || 0), 0),
            transfer: dayBilling.filter(bill => bill.paymentMethod === 'transfer').reduce((sum, bill) => sum + (bill.amount || 0), 0),
            insurance: dayBilling.filter(bill => bill.paymentMethod === 'insurance').reduce((sum, bill) => sum + (bill.amount || 0), 0)
        };

        const treatmentTypes = {};
        dayAppointments.forEach(apt => {
            const treatment = apt.procedure || apt.treatment || 'General';
            treatmentTypes[treatment] = (treatmentTypes[treatment] || 0) + 1;
        });

        const report = {
            date: selectedDate,
            summary: {
                totalPatients: dayAppointments.length,
                completedAppointments,
                cancelledAppointments,
                noShowAppointments,
                completionRate: dayAppointments.length > 0 ? (completedAppointments / dayAppointments.length * 100).toFixed(1) : 0
            },
            financial: {
                totalRevenue,
                totalExpenses,
                netProfit,
                averageTransaction: dayBilling.length > 0 ? (totalRevenue / dayBilling.length).toFixed(2) : 0,
                paymentMethods
            },
            appointments: dayAppointments,
            billing: dayBilling,
            expenses: dayExpenses,
            treatmentTypes,
            staff: staff?.name || 'System'
        };

        setReportData(report);
        setIsLoading(false);
    };

    const exportToPDF = () => {
        // จำลองการพิมพ์ PDF (ใน production จะใช้ library จริง)
        window.print();
    };

    const closeDailyReport = async () => {
        setIsClosing(true);
        
        // บันทึกรายงานปิดร้าน
        const closingReport = {
            ...reportData,
            closedAt: new Date().toISOString(),
            closedBy: staff?.name || 'System',
            status: 'closed'
        };

        // บันทึกลง localStorage (ใน production จะบันทึกลง database)
        const closedReports = JSON.parse(localStorage.getItem('closedDailyReports') || '[]');
        closedReports.push(closingReport);
        localStorage.setItem('closedDailyReports', JSON.stringify(closedReports));

        // ส่งแจ้งเตือนไปยังผู้จัดการ (ถ้ามี)
        console.log('Daily report closed:', closingReport);
        
        setIsClosing(false);
        alert(language === 'TH' ? 'ปิดรายงานประจำวันเรียบร้อยแล้ว' : 'Daily report closed successfully');
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="glass-panel" style={{ 
            padding: '1.5rem', 
            background: 'white',
            border: `1px solid ${color}20`,
            borderRadius: '12px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {title}
                    </p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--neutral-900)', margin: 0 }}>
                        {value}
                    </h3>
                    {trend && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <TrendingUp size={14} color={trend > 0 ? '#10b981' : '#ef4444'} />
                            <span style={{ fontSize: '0.75rem', color: trend > 0 ? '#10b981' : '#ef4444' }}>
                                {Math.abs(trend)}%
                            </span>
                        </div>
                    )}
                </div>
                <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: `${color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon size={24} color={color} />
                </div>
            </div>
        </div>
    );

    if (!reportData) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner" />
                <p>{language === 'TH' ? 'กำลังโหลดรายงาน...' : 'Loading report...'}</p>
            </div>
        );
    }

    return (
        <div className="daily-report" style={{ padding: '2rem' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={32} color="var(--primary-600)" />
                            {language === 'TH' ? 'รายงานประจำวัน' : 'Daily Report'}
                        </h1>
                        <p style={{ color: 'var(--neutral-600)', marginTop: '0.5rem' }}>
                            {format(selectedDate, language === 'TH' ? 'd MMMM yyyy' : 'MMMM d, yyyy', { locale: language === 'TH' ? th : enUS })}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="date"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}
                        />
                        <button onClick={exportToPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} />
                            {language === 'TH' ? 'ส่งออก' : 'Export'}
                        </button>
                        <button onClick={closeDailyReport} disabled={isClosing} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isClosing ? (
                                <>
                                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                                    {language === 'TH' ? 'กำลังบันทึก...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    {language === 'TH' ? 'ปิดรายงาน' : 'Close Report'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard 
                    title={language === 'TH' ? 'ผู้ป่วยทั้งหมด' : 'Total Patients'} 
                    value={reportData.summary.totalPatients}
                    icon={Users}
                    color="#3b82f6"
                />
                <StatCard 
                    title={language === 'TH' ? 'รักษาสำเร็จ' : 'Completed'} 
                    value={reportData.summary.completedAppointments}
                    icon={CheckCircle}
                    color="#10b981"
                />
                <StatCard 
                    title={language === 'TH' ? 'รายได้รวม' : 'Total Revenue'} 
                    value={`฿${reportData.financial.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="#22c55e"
                />
                <StatCard 
                    title={language === 'TH' ? 'กำไรสุทธิ' : 'Net Profit'} 
                    value={`฿${reportData.financial.netProfit.toLocaleString()}`}
                    icon={PiggyBank}
                    color={reportData.financial.netProfit >= 0 ? '#10b981' : '#ef4444'}
                />
            </div>

            {/* Detailed Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Appointments */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'นัดหมายวันนี้' : "Today's Appointments"}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reportData.appointments.length === 0 ? (
                            <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: '2rem' }}>
                                {language === 'TH' ? 'ไม่มีนัดหมายวันนี้' : 'No appointments today'}
                            </p>
                        ) : (
                            reportData.appointments.map(apt => (
                                <div key={apt.id} style={{
                                    padding: '1rem',
                                    border: '1px solid var(--neutral-200)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{apt.patientName || apt.patient}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                            {apt.time} - {apt.procedure || apt.treatment}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: apt.status === 'completed' ? '#dcfce7' : 
                                                   apt.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                                        color: apt.status === 'completed' ? '#16a34a' : 
                                               apt.status === 'cancelled' ? '#dc2626' : '#d97706'
                                    }}>
                                        {apt.status || 'pending'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'วิธีการชำระเงิน' : 'Payment Methods'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.entries(reportData.financial.paymentMethods).map(([method, amount]) => (
                            <div key={method} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'var(--neutral-50)',
                                borderRadius: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {method === 'cash' && <DollarSign size={16} />}
                                    {method === 'card' && <CreditCard size={16} />}
                                    {method === 'transfer' && <Receipt size={16} />}
                                    {method === 'insurance' && <FileText size={16} />}
                                    <span style={{ textTransform: 'capitalize' }}>
                                        {method === 'cash' ? (language === 'TH' ? 'เงินสด' : 'Cash') :
                                         method === 'card' ? (language === 'TH' ? 'บัตร' : 'Card') :
                                         method === 'transfer' ? (language === 'TH' ? 'โอนเงิน' : 'Transfer') :
                                         (language === 'TH' ? 'ประกัน' : 'Insurance')}
                                    </span>
                                </div>
                                <span style={{ fontWeight: 600 }}>฿{amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Treatment Types */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} color="var(--primary-600)" />
                    {language === 'TH' ? 'สถิติการรักษา' : 'Treatment Statistics'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(reportData.treatmentTypes).map(([treatment, count]) => (
                        <div key={treatment} style={{
                            padding: '1rem',
                            background: 'var(--neutral-50)',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                                {count}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                {treatment}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DailyReport;
