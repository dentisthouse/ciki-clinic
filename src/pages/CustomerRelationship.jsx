import React, { useState, useEffect } from 'react';
import { 
    Users, 
    MessageSquare, 
    Star, 
    ThumbsUp, 
    ThumbsDown, 
    Calendar, 
    Phone, 
    Mail, 
    Send, 
    Plus, 
    Search, 
    Filter,
    Heart,
    Award,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    Eye,
    Edit3,
    Trash2,
    Reply,
    Forward,
    Download,
    Target,
    Gift,
    Zap,
    Smile,
    Meh,
    Frown
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const CustomerRelationship = () => {
    const { language } = useLanguage();
    const { patients, appointments, billingRecords } = useData();
    const { staff } = useAuth();
    
    const [activeTab, setActiveTab] = useState('feedback'); // feedback, loyalty, communication, satisfaction
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loyaltyProgram, setLoyaltyProgram] = useState(null);
    const [communications, setCommunications] = useState([]);
    const [satisfactionSurveys, setSatisfactionSurveys] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, positive, negative, pending
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [newMessage, setNewMessage] = useState({
        recipient: '',
        subject: '',
        message: '',
        type: 'general' // general, promotion, reminder, followup
    });

    // จำลองข้อมูล Feedback
    const mockFeedbacks = [
        {
            id: 1,
            patientId: 'P00123',
            patientName: 'สมชาย ใจดี',
            date: new Date(),
            rating: 5,
            category: 'service',
            comment: 'บริการดีมาก พนักงานน่ารัก แพทย์แพทย์ให้คำแนะนำละเอียดดี',
            response: 'ขอบคุณครับ สมชายครับ ยินดีที่ได้รับบริการดีๆ คลินิกจะพัฒนาอย่างต่อเนื่อง',
            status: 'resolved',
            respondedBy: 'หมออ้อม',
            respondedAt: subDays(new Date(), 1)
        },
        {
            id: 2,
            patientId: 'P00456',
            patientName: 'วิระ รักสุขภาพ',
            date: subDays(new Date(), 3),
            rating: 2,
            category: 'waiting_time',
            comment: 'รอนานนานเกินไป 45 นาที ไม่มีใครแจ้ง',
            response: 'ขออภัยในความไม่สะดวก จะปรับปรุงเพื่อลดเวลารอคิว',
            status: 'resolved',
            respondedBy: 'สมศรี ใจดี',
            respondedAt: subDays(new Date(), 2)
        },
        {
            id: 3,
            patientId: 'P00789',
            patientName: 'มานี สุขใจ',
            date: subDays(new Date(), 7),
            rating: 4,
            category: 'facility',
            comment: 'สถานที่ตั้งสะอาด แต่ห้องน้ำอาจจะปรับปรุง',
            response: 'ขอบคุณครับ ได้รับการแจ้งเตือนแล้ว จะดำเนินการปรับปรุงทันที',
            status: 'in_progress',
            respondedBy: null,
            respondedAt: null
        }
    ];

    // จำลองข้อมูล Loyalty Program
    const mockLoyaltyProgram = {
        enabled: true,
        name: { TH: 'CIKI สมาชิก', EN: 'CIKI Membership' },
        tiers: [
            {
                id: 'bronze',
                name: { TH: 'บรอนซ์', EN: 'Bronze' },
                minPoints: 0,
                benefits: [
                    { TH: 'ส่วนลด 5% บริการทั่วไป', EN: '5% discount on all services' },
                    { TH: 'สะสมะคะแนนฟรีทุก 3 ครั้ง', EN: 'Free scaling every 3 visits' }
                ],
                color: '#CD7F32'
            },
            {
                id: 'silver',
                name: { TH: 'ซิลเวอร์', EN: 'Silver' },
                minPoints: 1000,
                benefits: [
                    { TH: 'ส่วนลด 10% บริการทั่วไป', EN: '10% discount on all services' },
                    { TH: 'ส่วนลด 15% ผลิตภัณฑ์', EN: '15% discount on products' },
                    { TH: 'นัดหมายล่วงหน้า', EN: 'Priority appointments' }
                ],
                color: '#C0C0C0'
            },
            {
                id: 'gold',
                name: { TH: 'โกลด์', EN: 'Gold' },
                minPoints: 5000,
                benefits: [
                    { TH: 'ส่วนลด 15% บริการทั่วไป', EN: '15% discount on all services' },
                    { TH: 'ส่วนลด 20% ผลิตภัณฑ์', EN: '20% discount on products' },
                    { TH: 'นัดหมายล่วงหน้า', EN: 'Priority appointments' },
                    { TH: 'บริการ VIP พิเศษ', EN: 'VIP services' },
                    { TH: 'คลินิกกลับบ้าน', EN: 'Home visit service' }
                ],
                color: '#FFD700'
            }
        ],
        points: {
            earn: {
                appointment: 10,
                review: 50,
                referral: 100,
                birthday: 200
            },
            redeem: {
                discount_5: 500,
                discount_10: 1000,
                free_cleaning: 2000,
                whitening: 5000
            }
        }
    };

    // จำลองข้อมูล Communications
    const mockCommunications = [
        {
            id: 1,
            type: 'promotion',
            title: { TH: 'โปรโมชั่นเดือนเกิด', EN: 'Birthday Month Promotion' },
            content: { 
                TH: 'รับส่วนลดพิเศษ 20% สำหรับลูกค้าที่เกิดในเดือนนี้', 
                EN: 'Get 20% special discount for customers born this month' 
            },
            sentDate: subDays(new Date(), 1),
            sentBy: 'ระบบการตลาด',
            recipients: 245,
            opened: 189,
            clicked: 67
        },
        {
            id: 2,
            type: 'reminder',
            title: { TH: 'แจ้งเตือนนัดหมาย', EN: 'Appointment Reminder' },
            content: { 
                TH: 'อย่าลืมนัดหมายของคุณวันที่ 15 มี.ค. 2567', 
                EN: 'Don\'t forget your appointment on March 15, 2024' 
            },
            sentDate: subDays(new Date(), 2),
            sentBy: 'ระบบอัตโนมัติ',
            recipients: 89,
            opened: 78,
            clicked: 34
        },
        {
            id: 3,
            type: 'newsletter',
            title: { TH: 'ข่าวสารคลินิก', EN: 'Clinic Newsletter' },
            content: { 
                TH: 'เทคนิคการดูแลฟันขาวใหม่ปี 2024', 
                EN: 'New dental care and teeth whitening techniques for 2024' 
            },
            sentDate: subDays(new Date(), 7),
            sentBy: 'แพทย์แพทย์',
            recipients: 520,
            opened: 312,
            clicked: 98
        }
    ];

    // จำลองข้อมูล Satisfaction Surveys
    const mockSurveys = [
        {
            id: 1,
            title: { TH: 'แบบสำรวจความพึงพอใจ Q1/2024', EN: 'Satisfaction Survey Q1/2024' },
            description: { 
                TH: 'แบบสำรวจความพึงพอใจของผู้ป่วยประจำเดือนมกราคม-กุมภาพันธ์', 
                EN: 'Patient satisfaction survey for January-March 2024' 
            },
            createdDate: subDays(new Date(), 30),
            sentTo: 1250,
            responses: 892,
            responseRate: 71.4,
            averageRating: 4.3,
            status: 'completed'
        },
        {
            id: 2,
            title: { TH: 'แบบสำรวจประสบการณ์บริการ', EN: 'Service Experience Survey' },
            description: { 
                TH: 'แบบสำรวจเกี่ยวกับประสบการณ์การใช้บริการต่างๆ', 
                EN: 'Survey about experience with different services' 
            },
            createdDate: subDays(new Date(), 60),
            sentTo: 890,
            responses: 456,
            responseRate: 51.2,
            averageRating: 4.1,
            status: 'in_progress'
        }
    ];

    useEffect(() => {
        loadCustomerData();
    }, []);

    const loadCustomerData = () => {
        // จำลองการโหลดข้อมูล
        setFeedbacks(mockFeedbacks);
        setLoyaltyProgram(mockLoyaltyProgram);
        setCommunications(mockCommunications);
        setSatisfactionSurveys(mockSurveys);
    };

    const getRatingStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star 
                key={i} 
                fill={i < rating ? '#f59e0b' : 'none'} 
                color={i < rating ? '#f59e0b' : '#d1d5db'}
            />
        ));
    };

    const getSentimentIcon = (rating) => {
        if (rating >= 4) return <Smile size={20} color="#10b981" />;
        if (rating >= 3) return <Meh size={20} color="#f59e0b" />;
        return <Frown size={20} color="#ef4444" />;
    };

    const getCategoryColor = (category) => {
        const colors = {
            service: '#10b981',
            facility: '#3b82f6',
            waiting_time: '#f59e0b',
            pricing: '#8b5cf6',
            staff: '#ef4444'
        };
        return colors[category] || '#6b7280';
    };

    const sendBulkMessage = () => {
        // จำลองการส่งข้อความ
        console.log('Sending bulk message:', newMessage);
        
        // เพิ่มลงรายการสื่อสาร
        const newComm = {
            id: Date.now(),
            type: newMessage.type,
            title: newMessage.subject,
            content: newMessage.message,
            sentDate: new Date(),
            sentBy: staff?.name || 'Current User',
            recipients: newMessage.recipient.split(',').length,
            opened: 0,
            clicked: 0
        };
        
        setCommunications([newComm, ...communications]);
        setShowNewMessage(false);
        setNewMessage({ recipient: '', subject: '', message: '', type: 'general' });
    };

    const respondToFeedback = (feedbackId, response) => {
        // จำลองการตอบกลับ feedback
        const updated = feedbacks.map(f => 
            f.id === feedbackId 
                ? { 
                    ...f, 
                    response, 
                    status: 'resolved', 
                    respondedBy: staff?.name, 
                    respondedAt: new Date() 
                } 
                : f
        );
        setFeedbacks(updated);
    };

    const exportReport = (type) => {
        // จำลองการส่งออกรายงาน
        const data = type === 'feedback' ? feedbacks : 
                   type === 'satisfaction' ? satisfactionSurveys : 
                   communications;
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `customer-${type}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredFeedbacks = feedbacks.filter(feedback => {
        const matchesSearch = feedback.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           feedback.comment.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (selectedFilter === 'all') return matchesSearch;
        if (selectedFilter === 'positive') return matchesSearch && feedback.rating >= 4;
        if (selectedFilter === 'negative') return matchesSearch && feedback.rating <= 2;
        if (selectedFilter === 'pending') return matchesSearch && feedback.status === 'pending';
        return matchesSearch;
    });

    return (
        <div className="customer-relationship" style={{ padding: '2rem' }}>
            {/* Header */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={32} color="var(--primary-600)" />
                    {language === 'TH' ? 'จัดการความสัมพันธ์ลูกค้า' : 'Customer Relationship Management'}
                </h1>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--neutral-200)', marginTop: '1.5rem' }}>
                    {[
                        { id: 'feedback', label: { TH: 'Feedback', EN: 'Feedback' } },
                        { id: 'loyalty', label: { TH: 'โปรแกรมสมาชิก', EN: 'Loyalty Program' } },
                        { id: 'communication', label: { TH: 'การสื่อสาร', EN: 'Communication' } },
                        { id: 'satisfaction', label: { TH: 'สำรวจความพึงพอใจ', EN: 'Satisfaction Surveys' } }
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

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'รีวิวและความคิดเห็น' : 'Reviews & Feedback'}
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className="search-wrapper" style={{ position: 'relative' }}>
                                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                                <input
                                    type="text"
                                    placeholder={language === 'TH' ? 'ค้นหา feedback...' : 'Search feedback...'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '250px',
                                        padding: '0.75rem 1rem 0.75rem 3rem',
                                        border: '1px solid var(--neutral-200)',
                                        borderRadius: '8px'
                                    }}
                                />
                            </div>
                            
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                style={{ 
                                    padding: '0.75rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--neutral-200)',
                                    background: 'white'
                                }}
                            >
                                <option value="all">{language === 'TH' ? 'ทั้งหมด' : 'All'}</option>
                                <option value="positive">{language === 'TH' ? 'บวก' : 'Positive'}</option>
                                <option value="negative">{language === 'TH' ? 'ลบ' : 'Negative'}</option>
                                <option value="pending">{language === 'TH' ? 'รอดำเนินการ' : 'Pending'}</option>
                            </select>
                            
                            <button 
                                onClick={() => exportReport('feedback')}
                                className="btn btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Download size={18} />
                                {language === 'TH' ? 'ส่งออก' : 'Export'}
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredFeedbacks.map(feedback => (
                            <div key={feedback.id} style={{
                                padding: '1.5rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                background: 'white'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{feedback.patientName}</div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                                    {feedback.patientId}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {getRatingStars(feedback.rating)}
                                                <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{feedback.rating}.0</span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: `${getCategoryColor(feedback.category)}10`,
                                                color: getCategoryColor(feedback.category)
                                            }}>
                                                {feedback.category}
                                            </span>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: feedback.status === 'resolved' ? '#dcfce7' : 
                                                           feedback.status === 'in_progress' ? '#fef3c7' : '#fee2e2',
                                                color: feedback.status === 'resolved' ? '#16a34a' : 
                                                       feedback.status === 'in_progress' ? '#d97706' : '#dc2626'
                                            }}>
                                                {feedback.status === 'resolved' ? (language === 'TH' ? 'ได้รับเรื่อง' : 'Resolved') :
                                                 feedback.status === 'in_progress' ? (language === 'TH' ? 'ดำเนินการ' : 'In Progress') :
                                                 (language === 'TH' ? 'รอดำเนินการ' : 'Pending')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {getSentimentIcon(feedback.rating)}
                                    <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                        {format(feedback.date, language === 'TH' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}
                                    </span>
                                </div>
                            
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>
                                        {feedback.comment}
                                    </p>
                                </div>
                                
                                {feedback.response && (
                                    <div style={{
                                        padding: '1rem',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#059669' }}>
                                            {language === 'TH' ? 'การตอบกลับ:' : 'Response:'}
                                        </div>
                                        <p style={{ margin: 0, marginBottom: '0.5rem' }}>{feedback.response}</p>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                                            {language === 'TH' ? 'ตอบโดย:' : 'Responded by'}: {feedback.respondedBy} • 
                                            {format(feedback.respondedAt, language === 'TH' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy HH:mm')}
                                        </div>
                                    </div>
                                )}
                                
                                {feedback.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button 
                                            onClick={() => respondToFeedback(feedback.id, 'ขอบคุณครับ feedback กำลังตรวจสอบปัญหา')}
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.875rem' }}
                                        >
                                            <Reply size={16} style={{ marginRight: '0.5rem' }} />
                                            {language === 'TH' ? 'ตอบกลับ' : 'Respond'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loyalty Program Tab */}
            {activeTab === 'loyalty' && loyaltyProgram && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'โปรแกรมสมาชิก' : 'Loyalty Program'}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                        {/* Program Overview */}
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                {language === 'TH' ? 'ข้อมูลโปรแกรม' : 'Program Overview'}
                            </h4>
                            <div style={{ padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                                <h5 style={{ margin: '0 0 1rem 0', color: 'var(--primary-600)' }}>
                                    {loyaltyProgram.name[language]}
                                </h5>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                        {language === 'TH' ? 'สถานะ:' : 'Status:'}
                                    </span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        background: loyaltyProgram.enabled ? '#dcfce7' : '#fee2e2',
                                        color: loyaltyProgram.enabled ? '#16a34a' : '#dc2626'
                                    }}>
                                        {loyaltyProgram.enabled ? (language === 'TH' ? 'เปิดใช้งาน' : 'Active') : (language === 'TH' ? 'ปิด' : 'Inactive')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Points System */}
                        <div>
                            <h4 style={{ marginBottom: '1rem' }}>
                                <Gift size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                {language === 'TH' ? 'ระบบคะแนน' : 'Points System'}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                                    <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                                        {language === 'TH' ? 'การสะสมแต้ม' : 'Ways to Earn'}
                                    </h6>
                                    <div style={{ fontSize: '0.75rem' }}>
                                        <div>• {language === 'TH' ? 'นัดหมาย' : 'Appointment'}: +{loyaltyProgram.points.earn.appointment} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                        <div>• {language === 'TH' ? 'รีวิว' : 'Review'}: +{loyaltyProgram.points.earn.review} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                        <div>• {language === 'TH' ? 'แนะนำ' : 'Referral'}: +{loyaltyProgram.points.earn.referral} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                        <div>• {language === 'TH' ? 'วันเกิด' : 'Birthday'}: +{loyaltyProgram.points.earn.birthday} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                    </div>
                                </div>
                                
                                <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                                    <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                                        {language === 'TH' ? 'การใช้คะแนน' : 'Ways to Redeem'}
                                    </h6>
                                    <div style={{ fontSize: '0.75rem' }}>
                                        <div>• {language === 'TH' ? 'ส่วนลด 5%' : '5% Discount'}: {loyaltyProgram.points.redeem.discount_5} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                        <div>• {language === 'TH' ? 'ส่วนลด 10%' : '10% Discount'}: {loyaltyProgram.points.redeem.discount_10} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                        <div>• {language === 'TH' ? 'ขูดหินปูนฟรี' : 'Free Scaling'}: {loyaltyProgram.points.redeem.free_cleaning} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                        <div>• {language === 'TH' ? 'ฟันขาว' : 'Teeth Whitening'}: {loyaltyProgram.points.redeem.whitening} {language === 'TH' ? 'คะแนน' : 'points'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Membership Tiers */}
                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>
                            {language === 'TH' ? 'ระดับสมาชิก' : 'Membership Tiers'}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            {loyaltyProgram.tiers.map(tier => (
                                <div key={tier.id} style={{
                                    padding: '1.5rem',
                                    border: '2px solid',
                                    borderColor: tier.color,
                                    borderRadius: '12px',
                                    background: 'white',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h5 style={{ margin: 0, fontSize: '1.2rem', color: tier.color }}>
                                            {tier.name[language]}
                                        </h5>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: tier.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '0.875rem'
                                        }}>
                                            {tier.id.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    
                                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '1rem' }}>
                                        {language === 'TH' ? 'คะแนนขั้นต่ำ' : 'Min Points'}: {tier.minPoints.toLocaleString()}
                                    </div>
                                    
                                    <div>
                                        <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>
                                            {language === 'TH' ? 'สิทธิประโยชน์' : 'Benefits'}
                                        </h6>
                                        <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem' }}>
                                            {tier.benefits.map((benefit, index) => (
                                                <li key={index}>{benefit[language]}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Communication Tab */}
            {activeTab === 'communication' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Send size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'การสื่อสารกับลูกค้า' : 'Customer Communication'}
                        </h3>
                        <button 
                            onClick={() => setShowNewMessage(true)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} />
                            {language === 'TH' ? 'ส่งข้อความใหม่' : 'New Message'}
                        </button>
                    </div>
                    
                    {/* Communication History */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--neutral-50)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'วันที่ส่ง' : 'Sent Date'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ประเภท' : 'Type'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'หัวข้อ' : 'Subject'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ส่งโดย' : 'Sent By'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'ผู้รับ' : 'Recipients'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'เปิด' : 'Opened'}
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {language === 'TH' ? 'คลิก' : 'Clicked'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {communications.map(comm => (
                                    <tr key={comm.id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {format(comm.sentDate, language === 'TH' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: comm.type === 'promotion' ? '#fef3c7' : 
                                                           comm.type === 'reminder' ? '#dbeafe' : '#f3f4f6',
                                                color: comm.type === 'promotion' ? '#d97706' : 
                                                       comm.type === 'reminder' ? '#059669' : '#6b7280'
                                            }}>
                                                {comm.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {comm.title}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {comm.sentBy}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>
                                            {comm.recipients.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>
                                            {comm.opened} ({((comm.opened / comm.recipients) * 100).toFixed(1)}%)
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem' }}>
                                            {comm.clicked} ({((comm.clicked / comm.recipients) * 100).toFixed(1)}%)
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Satisfaction Surveys Tab */}
            {activeTab === 'satisfaction' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Target size={20} color="var(--primary-600)" />
                            {language === 'TH' ? 'สำรวจความพึงพอใจ' : 'Satisfaction Surveys'}
                        </h3>
                        <button 
                            onClick={() => exportReport('satisfaction')}
                            className="btn btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={18} />
                            {language === 'TH' ? 'ส่งออกผลสำรวจ' : 'Export Results'}
                        </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        {satisfactionSurveys.map(survey => (
                            <div key={survey.id} style={{
                                padding: '1.5rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                background: 'white'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                                    {survey.title}
                                </h4>
                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    {survey.description}
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--neutral-600)' }}>
                                            {language === 'TH' ? 'สร้างเมื่อ:' : 'Created:'}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {format(survey.createdDate, language === 'TH' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--neutral-600)' }}>
                                            {language === 'TH' ? 'ส่งถึง:' : 'Sent to:'}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {survey.sentTo.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--neutral-600)' }}>
                                            {language === 'TH' ? 'ตอบกลับ:' : 'Responses:'}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {survey.responses.toLocaleString()} ({survey.responseRate}%)
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--neutral-600)' }}>
                                            {language === 'TH' ? 'คะแนนเฉลี่ยว:' : 'Avg Rating:'}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {survey.averageRating} / 5.0
                                        </span>
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: survey.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                        color: survey.status === 'completed' ? '#16a34a' : '#d97706'
                                    }}>
                                        {survey.status === 'completed' ? (language === 'TH' ? 'เสร็จสิ้น' : 'Completed') : (language === 'TH' ? 'ดำเนินการ' : 'In Progress')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerRelationship;
