import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const WorkHistoryTutorial: React.FC = () => {
    const { runTutorial, stopTutorial } = useTutorial();
    const { language } = useLanguage();

    const translations = {
        en: {
            next: 'Next',
            skip: 'Skip',
            last: 'Got it!',
            back: 'Back',
            close: 'Close',
            step: 'Step',
            of: 'of',
            headerTitle: 'Work History & Reports',
            headerContent: 'Welcome to the Work History page! Here you can track all completed and planned development works in your ward.',
            viewTitle: 'Switch Views',
            viewContent: 'Toggle between a visual Grid view and a detailed Report view suitable for printing.',
            ahwalTitle: 'Ahwal Generation',
            ahwalContent: 'Select multiple works and click here to automatically generate a professional "Ahwal" report for citizens.',
            newTitle: 'Add New Work',
            newContent: 'Manually record a new project, track its status, amount spent, and specific location.',
            searchTitle: 'Quick Search',
            searchContent: 'Find specific projects quickly by searching for titles, descriptions, or locations.',
            areaTitle: 'Area Filter',
            areaContent: 'Filter works by specific localities to see the impact of development across your ward.',
            dateTitle: 'Date Range',
            dateContent: 'Find works completed or planned within specific timeframes.',
            listTitle: 'Work Inventory',
            listContent: 'Review all recorded works here. Click on any card to see full details, feedback, and photos.',
            helpTitle: 'Need Help?',
            helpContent: 'Click this Help button anytime to restart this tutorial.'
        },
        mr: {
            next: 'पुढे',
            skip: 'वगळा',
            last: 'समजले!',
            back: 'मागे',
            close: 'बंद करा',
            step: 'टप्पा',
            of: 'पैकी',
            headerTitle: 'कामाचा इतिहास आणि अहवाल',
            headerContent: 'कामाचा इतिहास (Work History) पृष्ठावर आपले स्वागत आहे! येथे तुम्ही तुमच्या प्रभागातील सर्व पूर्ण झालेली आणि नियोजित विकासकामे पाहू शकता.',
            viewTitle: 'प्रदर्शन बदला',
            viewContent: 'व्हिज्युअल ग्रिड व्ह्यू आणि प्रिंटिंगसाठी योग्य अशा तपशीलवार रिपोर्ट व्ह्यूमध्ये स्विच करा.',
            ahwalTitle: 'अहवाल (Ahwal) तयार करणे',
            ahwalContent: 'एकाहून अधिक कामे निवडा आणि नागरिकांसाठी व्यावसायिक "अहवाल" आपोआप व्युत्पन्न करण्यासाठी येथे क्लिक करा.',
            newTitle: 'नवीन काम जोडा',
            newContent: 'नवीन प्रकल्प मॅन्युअली नोंदवा, त्याची स्थिती, खर्च झालेली रक्कम आणि विशिष्ट ठिकाणाचा मागोवा घ्या.',
            searchTitle: 'त्वरित शोध',
            searchContent: 'शीर्षके, वर्णन किंवा ठिकाणे शोधून विशिष्ट प्रकल्प लवकर शोधा.',
            areaTitle: 'भागांनुसार फिल्टर',
            areaContent: 'तुमच्या प्रभागातील विकासाचा प्रभाव पाहण्यासाठी विशिष्ट परिसरांनुसार कामांची यादी फिल्टर करा.',
            dateTitle: 'कालावधी',
            dateContent: 'विशिष्ट कालावधीत पूर्ण झालेली किंवा नियोजित कामे शोधा.',
            listTitle: 'कामांची यादी',
            listContent: 'येथे सर्व नोंदवलेल्या कामांचे पुनरावलोकन करा. पूर्ण तपशील, अभिप्राय आणि फोटो पाहण्यासाठी कोणत्याही कार्डवर क्लिक करा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-work-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-work-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-work-ahwal',
            content: t.ahwalContent,
            title: t.ahwalTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-work-new',
            content: t.newContent,
            title: t.newTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-work-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-work-area',
            content: t.areaContent,
            title: t.areaTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-work-date',
            content: t.dateContent,
            title: t.dateTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-work-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-work-help',
            content: t.helpContent,
            title: t.helpTitle,
            disableBeacon: true,
            placement: 'bottom',
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            stopTutorial();
        }
    };

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous={true}
            run={runTutorial}
            scrollToFirstStep={true}
            showProgress={true}
            showSkipButton={true}
            steps={steps}
            locale={{
                back: t.back,
                close: t.close,
                last: t.last,
                next: t.next,
                skip: t.skip,
                nextLabelWithProgress: `${t.next} (${t.step} {step} ${t.of} {steps})`
            }}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#0369a1', // Match theme (sky-700)
                    textColor: '#334155', // slate-700
                    backgroundColor: '#ffffff',
                },
                overlay: {
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                },
                tooltip: {
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#0369a1',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontFamily: 'inherit',
                },
                buttonBack: {
                    marginRight: '10px',
                    color: '#64748b',
                },
                buttonSkip: {
                    color: '#64748b',
                }
            }}
        />
    );
};

export default WorkHistoryTutorial;
