import React from 'react';
import { BookOpen, Calendar, MessageCircle, Activity, Search, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const HelpCenter = () => {
    const { t, language } = useLanguage();

    const guides = [
        {
            icon: <Calendar size={24} className="text-blue-500" />,
            title: t('help_topic_schedule'),
            steps: [
                t('help_step_schedule_1'),
                t('help_step_schedule_2'),
                t('help_step_schedule_3'),
            ]
        },
        {
            icon: <MessageCircle size={24} className="text-green-500" />,
            title: t('help_topic_line'),
            steps: [
                t('help_step_line_1'),
                t('help_step_line_2'),
                t('help_step_line_3'),
            ]
        },
        {
            icon: <Activity size={24} className="text-purple-500" />,
            title: t('help_topic_charting'),
            steps: [
                t('help_step_charting_1'),
                t('help_step_charting_2'),
                t('help_step_charting_3'),
            ]
        },
        {
            icon: <Search size={24} className="text-orange-500" />,
            title: t('help_topic_patient'),
            steps: [
                t('help_step_patient_1'),
                t('help_step_patient_2'),
            ]
        }
    ];

    return (
        <div className="animate-slide-up">
            <div className="page-header">
                <div className="page-title-group">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-600)' }}>
                        <HelpCircle size={32} />
                        {t('nav_help')}
                    </h1>
                    <p>{t('help_subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.map((guide, index) => (
                    <div key={index} className="card hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4 border-b border-neutral-100 pb-3">
                            <div className="bg-neutral-50 p-2 rounded-lg">
                                {guide.icon}
                            </div>
                            <h3 className="font-bold text-lg">{guide.title}</h3>
                        </div>
                        <ul className="space-y-3">
                            {guide.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex gap-3 text-sm text-neutral-600">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs">
                                        {stepIndex + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-blue-800 mb-1">{t('help_contact_support_title')}</h3>
                    <p className="text-sm text-blue-600">{t('help_contact_support_desc')}</p>
                    <button className="mt-3 btn bg-blue-600 text-white hover:bg-blue-700 border-none">
                        Support: 02-123-4567
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
