import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const WardBudgetTutorial: React.FC = () => {
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
            headerTitle: 'Ward Budget',
            headerContent: 'Manage and track development funds for your ward across different financial years.',
            yearTitle: 'Financial Year',
            yearContent: 'Switch between financial years to view previous or planned budget allocations.',
            allocatedTitle: 'Total Allocated',
            allocatedContent: 'Total amount of funds assigned to your ward for the selected year.',
            utilizedTitle: 'Funds Utilized',
            utilizedContent: 'Real-time tracking of how much budget has already been spent on various projects.',
            remainingTitle: 'Remaining Balance',
            remainingContent: 'Total funds still available for new work or ongoing expenses.',
            searchTitle: 'Search Budgets',
            searchContent: 'Quickly find specific budget heads or area-wise allocations using keywords.',
            tableTitle: 'Budget Heads',
            tableContent: 'Detailed breakdown of all categories. You can update utilization amounts or add new allocations here.',
            addTitle: 'New Allocation',
            addContent: 'Register a new budget head or allocation for a specific category or area.',
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
            headerTitle: 'प्रभाग बजेट',
            headerContent: 'विविध आर्थिक वर्षांसाठी तुमच्या प्रभागाच्या विकास निधीचे व्यवस्थापन आणि मागोवा घ्या.',
            yearTitle: 'आर्थिक वर्ष',
            yearContent: 'मागील किंवा नियोजित बजेट तरतुदी पाहण्यासाठी आर्थिक वर्ष बदला.',
            allocatedTitle: 'एकूण वाटप (Allocated)',
            allocatedContent: 'निवडलेल्या वर्षासाठी तुमच्या प्रभागाला नेमून दिलेला एकूण निधी.',
            utilizedTitle: 'खर्च केलेला निधी',
            utilizedContent: 'विविध प्रकल्पांवर आतापर्यंत किती बजेट खर्च झाले आहे याचा रिअल-टाइम मागोवा.',
            remainingTitle: 'उर्वरित शिल्लक',
            remainingContent: 'नवीन कामांसाठी किंवा चालू खर्चासाठी अद्याप उपलब्ध असलेला एकूण निधी.',
            searchTitle: 'बजेट शोधा',
            searchContent: 'कीवर्ड वापरून विशिष्ट बजेट हेड किंवा क्षेत्रनिहाय (Area-wise) वाटप द्रुतपणे शोधा.',
            tableTitle: 'बजेट हेड (Budget Heads)',
            tableContent: 'सर्व श्रेणींचा तपशीलवार ब्रेकडाउन. तुम्ही येथे खर्चाची रक्कम अपडेट करू शकता किंवा नवीन वाटप जोडू शकता.',
            addTitle: 'नवीन वाटप',
            addContent: 'विशिष्ट श्रेणी किंवा क्षेत्रासाठी नवीन बजेट हेड किंवा वाटप नोंदणी करा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-budget-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-budget-year',
            content: t.yearContent,
            title: t.yearTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-budget-allocated',
            content: t.allocatedContent,
            title: t.allocatedTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-budget-utilized',
            content: t.utilizedContent,
            title: t.utilizedTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-budget-remaining',
            content: t.remainingContent,
            title: t.remainingTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-budget-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-budget-add',
            content: t.addContent,
            title: t.addTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-budget-table',
            content: t.tableContent,
            title: t.tableTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-budget-help',
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

export default WardBudgetTutorial;
