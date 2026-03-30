import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    Search, 
    FileText, 
    Phone, 
    Mail,
    CreditCard,
    User,
    Calendar,
    RefreshCw,
    Download,
    Upload
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';

const InsuranceVerification = ({ patient, onVerificationComplete }) => {
    const { language } = useLanguage();
    const { patients } = useData();
    
    const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verified, rejected, expired
    const [insuranceData, setInsuranceData] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [verificationHistory, setVerificationHistory] = useState([]);

    // ข้อมูลบริษัทประกัน
    const insuranceProviders = [
        { id: 'sso', name: 'ประกันสังคม', nameEN: 'Social Security', verificationTime: 'instant', coverage: 'basic' },
        { id: 'bupa', name: 'บูพา', nameEN: 'BUPA', verificationTime: '2-3 min', coverage: 'full' },
        { id: 'aia', name: 'เอไอเอ', nameEN: 'AIA', verificationTime: '1-2 min', coverage: 'premium' },
        { id: 'muangthai', name: 'เมืองไทย', nameEN: 'Muang Thai', verificationTime: '3-5 min', coverage: 'standard' },
        { id: 'thaisri', name: 'ไทยศรี', nameEN: 'Thai Sri', verificationTime: '2-4 min', coverage: 'standard' },
        { id: 'dhip', name: 'ดีแฮป', nameEN: 'Dhipaya', verificationTime: '1-3 min', coverage: 'premium' }
    ];

    useEffect(() => {
        if (patient) {
            loadPatientInsurance();
        }
    }, [patient]);

    const loadPatientInsurance = () => {
        // จำลองการโหลดข้อมูลประกันของผู้ป่วย
        const mockInsuranceData = {
            provider: patient?.insuranceProvider || null,
            policyNumber: patient?.insuranceNumber || '',
            memberId: patient?.insuranceMemberId || '',
            coverage: patient?.insuranceCoverage || {},
            verifiedAt: patient?.insuranceVerifiedAt || null,
            expiresAt: patient?.insuranceExpiresAt || null,
            status: patient?.insuranceStatus || 'unverified'
        };
        
        setInsuranceData(mockInsuranceData);
        setVerificationStatus(mockInsuranceData.status);
        loadVerificationHistory();
    };

    const loadVerificationHistory = () => {
        // จำลองการโหลดประวัติการตรวจสอบ
        const mockHistory = [
            {
                date: '2024-01-15',
                provider: 'sso',
                status: 'verified',
                verifiedBy: 'ระบบอัตโนมัติ',
                coverage: 'การรักษาพื้นฐาน 900 บาท/ปี'
            },
            {
                date: '2023-12-01',
                provider: 'bupa',
                status: 'verified',
                verifiedBy: 'พนักงานต้อนรับ',
                coverage: 'ครอบคลุมการรักษาทั้งหมด สูงสุด 50,000 บาท/ปี'
            }
        ];
        setVerificationHistory(mockHistory);
    };

    const verifyInsurance = async (providerId) => {
        setIsVerifying(true);
        setSelectedProvider(providerId);
        
        try {
            // จำลองการตรวจสอบกับบริษัทประกัน
            const provider = insuranceProviders.find(p => p.id === providerId);
            
            // จำลองเวลาในการตรวจสอบ
            const verificationTime = provider.verificationTime.includes('instant') ? 1000 : 
                                     parseInt(provider.verificationTime) * 1000;
            
            await new Promise(resolve => setTimeout(resolve, verificationTime));
            
            // จำลองผลการตรวจสอบ (90% ผ่าน)
            const isVerified = Math.random() > 0.1;
            
            if (isVerified) {
                const coverage = generateCoverage(providerId);
                const newInsuranceData = {
                    provider: providerId,
                    policyNumber: generatePolicyNumber(),
                    memberId: generateMemberId(),
                    coverage,
                    verifiedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'verified'
                };
                
                setInsuranceData(newInsuranceData);
                setVerificationStatus('verified');
                
                // เพิ่มลงประวัติ
                const newHistory = {
                    date: new Date().toISOString().split('T')[0],
                    provider: providerId,
                    status: 'verified',
                    verifiedBy: staff?.name || 'พนักงานต้อนรับ',
                    coverage: coverage.description
                };
                setVerificationHistory([newHistory, ...verificationHistory]);
                
                if (onVerificationComplete) {
                    onVerificationComplete(newInsuranceData);
                }
            } else {
                setVerificationStatus('rejected');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setVerificationStatus('rejected');
        } finally {
            setIsVerifying(false);
            setSelectedProvider(null);
        }
    };

    const generateCoverage = (providerId) => {
        const coverages = {
            sso: {
                annualLimit: 900,
                description: 'การรักษาพื้นฐาน 900 บาท/ปี',
                coveredTreatments: ['การถอนฟัน', 'การอุดฟัน', 'การขูดหินปูน'],
                copayment: 0
            },
            bupa: {
                annualLimit: 50000,
                description: 'ครอบคลุมการรักษาทั้งหมด สูงสุด 50,000 บาท/ปี',
                coveredTreatments: ['การรักษาทั้งหมด'],
                copayment: 10
            },
            aia: {
                annualLimit: 100000,
                description: 'ครอบคลุมการรักษาพรีเมียม สูงสุด 100,000 บาท/ปี',
                coveredTreatments: ['การรักษาทั้งหมด', 'จัดฟัน', 'อิมแพลนต์'],
                copayment: 5
            }
        };
        
        return coverages[providerId] || coverages.sso;
    };

    const generatePolicyNumber = () => {
        return 'POL' + Math.random().toString(36).substr(2, 9).toUpperCase();
    };

    const generateMemberId = () => {
        return 'MEM' + Math.random().toString(36).substr(2, 9).toUpperCase();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'verified':
                return <CheckCircle size={16} color="#10b981" />;
            case 'rejected':
                return <AlertCircle size={16} color="#ef4444" />;
            case 'expired':
                return <Clock size={16} color="#f59e0b" />;
            default:
                return <Clock size={16} color="#6b7280" />;
        }
    };

    const getStatusText = (status) => {
        const texts = {
            verified: language === 'TH' ? 'ยืนยันแล้ว' : 'Verified',
            rejected: language === 'TH' ? 'ไม่ผ่าน' : 'Rejected',
            expired: language === 'TH' ? 'หมดอายุ' : 'Expired',
            pending: language === 'TH' ? 'รอตรวจสอบ' : 'Pending'
        };
        return texts[status] || texts.pending;
    };

    const filteredProviders = insuranceProviders.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.nameEN.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!patient) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <User size={48} color="var(--neutral-400)" />
                <p style={{ color: 'var(--neutral-600)' }}>
                    {language === 'TH' ? 'กรุณาเลือกผู้ป่วยก่อนตรวจสอบประกัน' : 'Please select a patient before verifying insurance'}
                </p>
            </div>
        );
    }

    return (
        <div className="insurance-verification" style={{ padding: '2rem' }}>
            {/* Current Insurance Status */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={20} color="var(--primary-600)" />
                    {language === 'TH' ? 'สถานะประกันปัจจุบัน' : 'Current Insurance Status'}
                </h3>
                
                {insuranceData ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    {language === 'TH' ? 'บริษัทประกัน' : 'Insurance Provider'}
                                </label>
                                <div style={{ fontWeight: 600 }}>
                                    {insuranceProviders.find(p => p.id === insuranceData.provider)?.[language === 'TH' ? 'name' : 'nameEN'] || '-'}
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    {language === 'TH' ? 'เลขกรมธรรม์' : 'Policy Number'}
                                </label>
                                <div style={{ fontWeight: 600 }}>{insuranceData.policyNumber || '-'}</div>
                            </div>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    {language === 'TH' ? 'รหัสสมาชิก' : 'Member ID'}
                                </label>
                                <div style={{ fontWeight: 600 }}>{insuranceData.memberId || '-'}</div>
                            </div>
                        </div>
                        
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                    {language === 'TH' ? 'สถานะ' : 'Status'}
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                    {getStatusIcon(verificationStatus)}
                                    {getStatusText(verificationStatus)}
                                </div>
                            </div>
                            
                            {insuranceData.verifiedAt && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                        {language === 'TH' ? 'วันที่ยืนยัน' : 'Verified Date'}
                                    </label>
                                    <div style={{ fontWeight: 600 }}>
                                        {new Date(insuranceData.verifiedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                            
                            {insuranceData.expiresAt && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                        {language === 'TH' ? 'วันหมดอายุ' : 'Expiry Date'}
                                    </label>
                                    <div style={{ fontWeight: 600 }}>
                                        {new Date(insuranceData.expiresAt).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-600)' }}>
                        <Shield size={48} color="var(--neutral-300)" />
                        <p style={{ marginTop: '1rem' }}>
                            {language === 'TH' ? 'ไม่พบข้อมูลประกัน' : 'No insurance information found'}
                        </p>
                    </div>
                )}
            </div>

            {/* Insurance Providers */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={20} color="var(--primary-600)" />
                    {language === 'TH' ? 'ตรวจสอบประกัน' : 'Verify Insurance'}
                </h3>
                
                {/* Search */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="search-wrapper" style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                        <input
                            type="text"
                            placeholder={language === 'TH' ? 'ค้นหาบริษัทประกัน...' : 'Search insurance provider...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 3rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '8px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>
                </div>
                
                {/* Provider List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filteredProviders.map(provider => (
                        <div 
                            key={provider.id}
                            style={{
                                padding: '1.5rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '12px',
                                background: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-300)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--neutral-200)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                                        {language === 'TH' ? provider.name : provider.nameEN}
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <Clock size={14} color="var(--neutral-500)" />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                            {provider.verificationTime}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: provider.coverage === 'premium' ? '#fef3c7' : 
                                               provider.coverage === 'full' ? '#dcfce7' : '#f3f4f6',
                                    color: provider.coverage === 'premium' ? '#d97706' : 
                                           provider.coverage === 'full' ? '#16a34a' : '#6b7280'
                                }}>
                                    {provider.coverage === 'premium' ? (language === 'TH' ? 'พรีเมียม' : 'Premium') :
                                     provider.coverage === 'full' ? (language === 'TH' ? 'ครบคลุม' : 'Full') :
                                     (language === 'TH' ? 'มาตรฐาน' : 'Standard')}
                                </div>
                            </div>
                            
                            <button
                                onClick={() => verifyInsurance(provider.id)}
                                disabled={isVerifying && selectedProvider === provider.id}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: isVerifying && selectedProvider === provider.id ? 'var(--neutral-300)' : 'var(--primary-600)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: isVerifying && selectedProvider === provider.id ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isVerifying && selectedProvider === provider.id ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        {language === 'TH' ? 'กำลังตรวจสอบ...' : 'Verifying...'}
                                    </>
                                ) : (
                                    <>
                                        <Shield size={16} />
                                        {language === 'TH' ? 'ตรวจสอบ' : 'Verify'}
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Verification History */}
            {verificationHistory.length > 0 && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} color="var(--primary-600)" />
                        {language === 'TH' ? 'ประวัติการตรวจสอบ' : 'Verification History'}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {verificationHistory.map((record, index) => (
                            <div key={index} style={{
                                padding: '1rem',
                                border: '1px solid var(--neutral-200)',
                                borderRadius: '8px',
                                background: 'var(--neutral-50)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                            {insuranceProviders.find(p => p.id === record.provider)?.[language === 'TH' ? 'name' : 'nameEN']}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                                            {record.date} • {language === 'TH' ? 'ตรวจสอบโดย' : 'Verified by'} {record.verifiedBy}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginTop: '0.25rem' }}>
                                            {record.coverage}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {getStatusIcon(record.status)}
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                            {getStatusText(record.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsuranceVerification;
