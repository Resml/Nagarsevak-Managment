import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const SadasyaTutorial: React.FC = () => {
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
            headerTitle: 'Member Management',
            headerContent: 'Welcome! Here you can manage your team, committee members, and volunteers effectively.',
            addTitle: 'Add New Member',
            addContent: 'Click here to add a new member. You can search for existing voters or enter details manually.',
            filtersTitle: 'Filter & Search',
            filtersContent: 'Quickly find members by name, mobile, area, or address. You can also filter by voter status.',
            viewTitle: 'Display Options',
            viewContent: 'Switch between Grid view for profiles and Report view for a detailed tabular list.',
            listTitle: 'Member List',
            listContent: 'Browse through all your registered members. Click on any member to view their detailed profile.',
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
            headerTitle: 'सदस्य व्यवस्थापन',
            headerContent: 'स्वागत आहे! येथे तुम्ही तुमची टीम, समिती सदस्य आणि स्वयंसेवकांचे प्रभावीपणे व्यवस्थापन करू शकता.',
            addTitle: 'नवीन सदस्य जोडा',
            addContent: 'नवीन सदस्य जोडण्यासाठी येथे क्लिक करा. तुम्ही विद्यमान मतदार शोधू शकता किंवा मॅन्युअली माहिती भरू शकता.',
            filtersTitle: 'फिल्टर आणि शोध',
            filtersContent: 'नाव, मोबाईल, क्षेत्र किंवा पत्त्यानुसार सदस्य पटकन शोधा. तुम्ही मतदार स्थितीनुसार देखील फिल्टर करू शकता.',
            viewTitle: 'पाहण्याचे पर्याय',
            viewContent: 'प्रोफाइलसाठी "ग्रीड" व्ह्यू आणि तपशीलवार माहितीसाठी "रिपोर्ट" व्ह्यूमध्ये स्विच करा.',
            listTitle: 'सदस्य यादी',
            listContent: 'तुमच्या सर्व नोंदणीकृत सदस्यांची यादी येथे पहा. कोणत्याही सदस्यावर क्लिक करून त्यांची सविस्तर माहिती मिळवा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-sadasya-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-sadasya-add',
            content: t.addContent,
            title: t.addTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-sadasya-filters',
            content: t.filtersContent,
            title: t.filtersTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-sadasya-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-sadasya-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-sadasya-help',
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
                    primaryColor: '#0369a1', // sky-700
                    textColor: '#334155', // slate-700
                    backgroundColor: '#ffffff',
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

export default SadasyaTutorial;
