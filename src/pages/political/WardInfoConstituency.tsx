import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, AlertTriangle, Lightbulb, Gavel, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const WardInfoConstituency = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const sections = [
        {
            title: 'Work History',
            description: 'Track completed and ongoing development works in the ward.',
            icon: <Briefcase className="w-8 h-8 text-blue-600" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-100',
            path: '/history',
            status: 'Active'
        },
        {
            title: 'Ward Wise Problem',
            description: 'View and manage complaints reported by citizens.',
            icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-100',
            path: '/ward/problems',
            status: 'Active'
        },
        {
            title: 'Possible Improvements',
            description: 'Propose and track future development ideas and needs.',
            icon: <Lightbulb className="w-8 h-8 text-yellow-600" />,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-100',
            path: '/ward/improvements',
            status: 'Active'
        },
        {
            title: 'Ward-wise Provision',
            description: 'Budget provisions and allocations for ward development.',
            icon: <Gavel className="w-8 h-8 text-slate-400" />,
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-200',
            path: '#',
            status: 'Coming Soon'
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Ward Info (Constituency)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, index) => (
                    <div
                        key={index}
                        onClick={() => section.status === 'Active' && navigate(section.path)}
                        className={`
                            relative p-6 rounded-xl border ${section.borderColor} ${section.bgColor} 
                            ${section.status === 'Active' ? 'cursor-pointer hover:shadow-md transition-shadow group' : 'opacity-70 cursor-not-allowed'}
                        `}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                {section.icon}
                            </div>
                            {section.status === 'Coming Soon' && (
                                <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                                    Coming Soon
                                </span>
                            )}
                            {section.status === 'Active' && (
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-2">{section.title}</h3>
                        <p className="text-sm text-slate-600">{section.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WardInfoConstituency;
