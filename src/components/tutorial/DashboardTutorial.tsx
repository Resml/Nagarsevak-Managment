import React from 'react';
import Joyride, { STATUS, ACTIONS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const DashboardTutorial: React.FC = () => {
    const { runTutorial, stopTutorial } = useTutorial();
    const { language } = useLanguage();

    // Define translations for the tutorial steps
    const translations = {
        en: {
            next: 'Next',
            skip: 'Skip',
            last: 'Got it!',
            back: 'Back',
            close: 'Close',
            step: 'Step',
            of: 'of',
            headerTitle: 'Welcome to your Dashboard',
            headerContent: 'This is your central hub. Here you can see a quick overview of everything happening in your constituency.',
            newRequestTitle: 'Create a New Request',
            newRequestContent: 'Click here to quickly log a new citizen complaint, problem, or personal request.',
            quickActionsTitle: 'Quick Actions',
            quickActionsContent: 'Use these buttons for fast access to your most used areas: Voters list, Staff management, and all Complaints.',
            aiInsightTitle: 'AI Daily Briefing',
            aiInsightContent: 'Our AI analyzes your data and provides a daily summary and insights to help you prioritize your day.',
            statsTitle: 'Key Statistics',
            statsContent: 'At a glance, see your total registered citizens, and the current status of all issues (Pending, In Progress, Resolved).',
            chartTitle: 'Status Overview',
            chartContent: 'This chart gives you a visual breakdown of issue statuses and your overall clearance rate.',
            activityTitle: 'Live Activity Feed',
            activityContent: 'See the most recent complaints and updates as they happen in real-time.',
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
            headerTitle: 'तुमच्या डॅशबोर्डवर स्वागत आहे',
            headerContent: 'हे तुमचे मुख्य केंद्र आहे. येथे तुम्ही तुमच्या मतदारसंघातील सर्व घडामोडींचा थोडक्यात आढावा घेऊ शकता.',
            newRequestTitle: 'नवीन विनंती करा',
            newRequestContent: 'नवीन नागरिक तक्रार, समस्या किंवा वैयक्तिक विनंती त्वरित नोंदवण्यासाठी येथे क्लिक करा.',
            quickActionsTitle: 'जलद कृती',
            quickActionsContent: 'तुमच्या सर्वाधिक वापरल्या जाणार्‍या भागांच्या जलद प्रवेशासाठी या बटणांचा वापर करा: मतदार यादी, कर्मचारी व्यवस्थापन आणि सर्व तक्रारी.',
            aiInsightTitle: 'AI दैनिक माहिती',
            aiInsightContent: 'आमचे AI तुमच्या डेटाचे विश्लेषण करते आणि तुम्हाला तुमचा दिवस नियोजित करण्यात मदत करण्यासाठी दैनिक सारांश आणि अंतर्दृष्टी प्रदान करते.',
            statsTitle: 'महत्त्वाची आकडेवारी',
            statsContent: 'एका दृष्टिक्षेपात, तुमचे एकूण नोंदणीकृत नागरिक आणि सर्व समस्यांची सद्यस्थिती (प्रलंबित, प्रगतीपथावर, सोडवलेल्या) पहा.',
            chartTitle: 'स्थिती विहंगावलोकन',
            chartContent: 'हा चार्ट तुम्हाला समस्यांच्या स्थितीचे आणि तुमच्या एकूण निराकरण दराचे दृश्यमान विश्लेषण देतो.',
            activityTitle: 'थेट अद्यतने',
            activityContent: 'सर्वाधिक अलीकडील तक्रारी आणि अद्यतने जसजशी घडतात तसतशी रिअल-टाइममध्ये पहा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-new-request',
            content: t.newRequestContent,
            title: t.newRequestTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-quick-actions',
            content: t.quickActionsContent,
            title: t.quickActionsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ai-insight',
            content: t.aiInsightContent,
            title: t.aiInsightTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-stats',
            content: t.statsContent,
            title: t.statsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-status-chart',
            content: t.chartContent,
            title: t.chartTitle,
            disableBeacon: true,
            placement: 'right',
        },
        {
            target: '.tutorial-live-activity',
            content: t.activityContent,
            title: t.activityTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-dashboard-help',
            content: t.helpContent,
            title: t.helpTitle,
            disableBeacon: true,
            placement: 'bottom',
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, action } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status) || action === ACTIONS.CLOSE) {
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

export default DashboardTutorial;
