import React from 'react';
import Joyride, { type Step, STATUS } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

const GovtSchemesTutorial: React.FC = () => {
    const { runTutorial, stopTutorial } = useTutorial();
    const { language } = useLanguage();

    const translations = {
        title: {
            en: 'Government Schemes Guide',
            mr: 'शासकीय योजना मार्गदर्शक'
        },
        steps: [
            {
                title: { en: 'Government Schemes', mr: 'शासकीय योजना' },
                content: {
                    en: 'Welcome to the Government Schemes dashboard. Here you can find and manage various welfare schemes.',
                    mr: 'शासकीय योजना डॅशबोर्डवर तुमचे स्वागत आहे. येथे तुम्ही विविध कल्याणकारी योजना शोधू शकता आणि व्यवस्थापित करू शकता.'
                }
            },
            {
                title: { en: 'Schemes & Applications', mr: 'योजना आणि अर्ज' },
                content: {
                    en: 'Switch between the list of available schemes and tracked user applications.',
                    mr: 'उपलब्ध योजनांची यादी आणि ट्रॅक केलेले वापरकर्ता अर्ज यामध्ये स्विच करा.'
                }
            },
            {
                title: { en: 'Categories', mr: 'वर्गवारी' },
                content: {
                    en: 'Filter schemes by categories like Farmers, Students, Women, etc.',
                    mr: 'शेतकरी, विद्यार्थी, महिला इत्यादी श्रेणींनुसार योजना फिल्टर करा.'
                }
            },
            {
                title: { en: 'AI Scheme Matcher', mr: 'AI योजना जुळवणी' },
                content: {
                    en: 'Use our AI tool to find schemes matching specific eligibility criteria.',
                    mr: 'विशिष्ट पात्रता निकषांशी जुळणाऱ्या योजना शोधण्यासाठी आमचे AI साधन वापरा.'
                }
            },
            {
                title: { en: 'Add New Scheme', mr: 'नवीन योजना जोडा' },
                content: {
                    en: 'Managers can add new government schemes to the system from here.',
                    mr: 'व्यवस्थापक येथून सिस्टममध्ये नवीन सरकारी योजना जोडू शकतात.'
                }
            },
            {
                title: { en: 'Search Schemes', mr: 'योजना शोधा' },
                content: {
                    en: 'Quickly find schemes by searching for names or keywords.',
                    mr: 'नावे किंवा कीवर्ड शोधून वेगाने योजना शोधा.'
                }
            },
            {
                title: { en: 'View Modes', mr: 'पाहण्याचे प्रकार' },
                content: {
                    en: 'Toggle between card view for browsing and report view for printing.',
                    mr: 'ब्राउझिंगसाठी कार्ड व्ह्यू आणि प्रिंटिंगसाठी रिपोर्ट व्ह्यूमध्ये स्विच करा.'
                }
            },
            {
                title: { en: 'Scheme List', mr: 'योजनांची यादी' },
                content: {
                    en: 'Click on any scheme to view detailed eligibility, benefits, and required documents.',
                    mr: 'तपशीलवार पात्रता, फायदे आणि आवश्यक कागदपत्रे पाहण्यासाठी कोणत्याही योजनेवर क्लिक करा.'
                }
            },
            {
                title: { en: 'Need Help?', mr: 'मदत हवी आहे?' },
                content: {
                    en: 'Click this Help button anytime to restart this tutorial.',
                    mr: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
                }
            }
        ],
        buttons: {
            back: { en: 'Back', mr: 'मागे' },
            next: { en: 'Next', mr: 'पुढील' },
            last: { en: 'Got it!', mr: 'समजले!' },
            skip: { en: 'Skip', mr: 'वगळा' }
        }
    };

    const steps: Step[] = [
        {
            target: '.tutorial-schemes-header',
            title: translations.steps[0].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[0].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true,
            placement: 'bottom'
        },
        {
            target: '.tutorial-schemes-tabs',
            title: translations.steps[1].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[1].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        },
        {
            target: '.tutorial-schemes-categories',
            title: translations.steps[2].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[2].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        },
        {
            target: '.tutorial-schemes-matcher',
            title: translations.steps[3].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[3].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        },
        {
            target: '.tutorial-schemes-add',
            title: translations.steps[4].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[4].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        },
        {
            target: '.tutorial-schemes-search',
            title: translations.steps[5].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[5].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        },
        {
            target: '.tutorial-schemes-view',
            title: translations.steps[6].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[6].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        },
        {
            target: '.tutorial-schemes-list',
            title: translations.steps[7].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[7].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        },
        {
            target: '.tutorial-schemes-help',
            title: translations.steps[8].title[language === 'mr' ? 'mr' : 'en'],
            content: translations.steps[8].content[language === 'mr' ? 'mr' : 'en'],
            disableBeacon: true
        }
    ];

    const handleJoyrideCallback = (data: any) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            stopTutorial();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={runTutorial}
            continuous={true}
            showProgress={true}
            showSkipButton={true}
            scrollToFirstStep={true}
            callback={handleJoyrideCallback}
            locale={{
                back: translations.buttons.back[language === 'mr' ? 'mr' : 'en'],
                next: translations.buttons.next[language === 'mr' ? 'mr' : 'en'],
                last: translations.buttons.last[language === 'mr' ? 'mr' : 'en'],
                skip: translations.buttons.skip[language === 'mr' ? 'mr' : 'en'],
            }}
            styles={{
                options: {
                    primaryColor: '#0369a1',
                    zIndex: 1000,
                },
                spotlight: {
                    borderRadius: '16px',
                },
                tooltip: {
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                },
                buttonBack: {
                    marginRight: '12px',
                    fontSize: '14px',
                    fontWeight: '600'
                },
                buttonSkip: {
                    fontSize: '14px',
                    fontWeight: '600'
                }
            }}
        />
    );
};

export default GovtSchemesTutorial;
