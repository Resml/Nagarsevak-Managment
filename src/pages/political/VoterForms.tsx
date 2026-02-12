import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
    UserPlus,
    UserMinus,
    UserCheck,
    ExternalLink,
    FileText,
    CheckCircle2,
    AlertCircle,
    ClipboardList
} from 'lucide-react';

const VoterForms: React.FC = () => {
    const { t } = useLanguage();

    const forms = [
        {
            id: 'form6',
            icon: UserPlus,
            color: 'blue',
            title: t('voter_forms.form_6.title'),
            description: t('voter_forms.form_6.desc'),
            docs: t('voter_forms.form_6.docs'),
            link: 'https://voters.eci.gov.in/form6',
            requirements: [
                t('voter_forms.photo_req'),
                t('voter_forms.id_proof'),
                t('voter_forms.address_proof'),
                t('voter_forms.dob_proof')
            ]
        },
        {
            id: 'form7',
            icon: UserMinus,
            color: 'red',
            title: t('voter_forms.form_7.title'),
            description: t('voter_forms.form_7.desc'),
            docs: t('voter_forms.form_7.docs'),
            link: 'https://voters.eci.gov.in/form7',
            requirements: [
                t('voter_forms.epic_req'),
                t('voter_forms.deletion_reason')
            ]
        },
        {
            id: 'form8',
            icon: UserCheck,
            color: 'green',
            title: t('voter_forms.form_8.title'),
            description: t('voter_forms.form_8.desc'),
            docs: t('voter_forms.form_8.docs'),
            link: 'https://voters.eci.gov.in/form8',
            requirements: [
                t('voter_forms.epic_req'),
                t('voter_forms.id_proof'),
                t('voter_forms.address_proof'),
                t('voter_forms.fir_req')
            ]
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('voter_forms.title')}</h1>
                <p className="text-slate-600 text-lg">{t('voter_forms.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {forms.map((form) => {
                    const Icon = form.icon;
                    return (
                        <div key={form.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className={`p-6 bg-${form.color}-50 border-b border-${form.color}-100 flex items-center gap-4`}>
                                <div className={`p-3 bg-white rounded-xl shadow-sm border border-${form.color}-200`}>
                                    <Icon className={`w-8 h-8 text-${form.color}-600`} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">{form.title}</h2>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    {form.description}
                                </p>

                                <div className="space-y-4 mb-8">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-slate-400" />
                                        {t('voter_forms.required_documents')}
                                    </h3>
                                    <ul className="space-y-2">
                                        {form.requirements.map((req, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span>{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-auto">
                                    <a
                                        href={form.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-full py-3 px-4 bg-${form.color}-600 hover:bg-${form.color}-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm`}
                                    >
                                        {t('voter_forms.apply_now')}
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-amber-900 font-bold mb-1">Important Notice</h3>
                    <p className="text-amber-800">
                        These links will take you to the official <strong>Voter Service Portal (eci.gov.in)</strong>.
                        Please ensure you have digital copies of all required documents ready before starting the application.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoterForms;
