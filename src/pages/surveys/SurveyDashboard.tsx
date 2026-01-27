import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Users, Clock, Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MockService } from '../../services/mockData';
import type { Survey } from '../../types';

const SurveyDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState<Survey[]>([]);

    useEffect(() => {
        setSurveys(MockService.getSurveys());
    }, []);

    const totalVoters = MockService.getVoters().length;
    const sampleSizeTarget = Math.ceil(totalVoters * 0.01);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {t('surveys.title')}
                    </h1>
                    <p className="text-gray-500">{t('surveys.subtitle')}</p>
                </div>
                <button
                    onClick={() => navigate('/surveys/new')}
                    className="flexItems-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('surveys.create_survey')}</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('surveys.total_voters')}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{totalVoters}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('surveys.sample_size')}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{sampleSizeTarget}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('surveys.active_surveys')}</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {surveys.filter(s => s.status === 'Active').length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">{t('surveys.recent_surveys')}</h2>
                </div>

                {surveys.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>{t('surveys.no_surveys')}</p>
                        <p className="text-sm">{t('surveys.create_prompt')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left text-sm text-gray-500">
                                    <th className="p-4 font-medium">{t('surveys.table.title')}</th>
                                    <th className="p-4 font-medium">{t('surveys.table.status')}</th>
                                    <th className="p-4 font-medium">{t('surveys.table.questions')}</th>
                                    <th className="p-4 font-medium">{t('surveys.table.created_at')}</th>
                                    <th className="p-4 font-medium">{t('surveys.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {surveys.map((survey) => (
                                    <tr key={survey.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{survey.title}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{survey.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${survey.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                survey.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {survey.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {survey.questions.length} {t('surveys.questions_suffix')}
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(survey.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button className="text-brand-600 hover:text-brand-800 text-sm font-medium flex items-center">
                                                <Send className="w-3 h-3 mr-1" />
                                                {t('surveys.send_whatsapp')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SurveyDashboard;
