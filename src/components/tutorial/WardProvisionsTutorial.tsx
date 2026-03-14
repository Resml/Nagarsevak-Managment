import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const WardProvisionsTutorial: React.FC = () => {
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
            headerTitle: 'Ward Provisions',
            headerContent: 'Welcome to the Ward Wise Provision page. Here you can track budget requests and sanctions for various ward projects.',
            yearTitle: 'Financial Year',
            yearContent: 'Select the financial year to view or manage provisions for that specific period.',
            newTitle: 'Add New Request',
            newContent: 'Click here to submit a new budget provision request for a ward project.',
            requestedTitle: 'Total Requirements',
            requestedContent: 'This show the total amount requested across all projects for the selected year.',
            sanctionedTitle: 'Approved Budget',
            sanctionedContent: 'This shows the total amount successfully sanctioned or approved by the administration.',
            tableTitle: 'Provisions List',
            tableContent: 'Detailed list of all provision requests, their current status, and sanctioned amounts. You can edit or update records here.',
            helpTitle: 'Need Assistance?',
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
            headerTitle: 'प्रभाग तरतूद',
            headerContent: 'प्रभाग तरतूद (Ward Wise Provision) पृष्ठावर आपले स्वागत आहे. येथे तुम्ही विविध प्रभाग प्रकल्पांसाठी अर्थसंकल्पीय तरतूद आणि मंजूरीचा मागोवा घेऊ शकता.',
            yearTitle: 'आर्थिक वर्ष',
            yearContent: 'विशिष्ट कालावधीसाठी तरतुदी पाहण्यासाठी किंवा व्यवस्थापित करण्यासाठी आर्थिक वर्ष निवडा.',
            newTitle: 'नवीन विनंती जोडा',
            newContent: 'प्रभाग प्रकल्पासाठी नवीन अर्थसंकल्पीय तरतूद विनंती सबमिट करण्यासाठी येथे क्लिक करा.',
            requestedTitle: 'एकूण आवश्यकता',
            requestedContent: 'हे निवडलेल्या वर्षासाठी सर्व प्रकल्पांमध्ये विचारलेली एकूण रक्कम दर्शवते.',
            sanctionedTitle: 'मंजूर बजेट',
            sanctionedContent: 'हे प्रशासनाकडून यशस्वीरित्या मंजूर केलेली एकूण रक्कम दर्शवते.',
            tableTitle: 'तरतूद यादी',
            tableContent: 'सर्व तरतूद विनंत्यांची तपशीलवार यादी, त्यांची सद्यस्थिती आणि मंजूर रक्कम. तुम्ही येथे नोंदी संपादित (Edit) किंवा अद्ययावत (Update) करू शकता.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-provision-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-provision-year',
            content: t.yearContent,
            title: t.yearTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-provision-new',
            content: t.newContent,
            title: t.newTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-provision-requested',
            content: t.requestedContent,
            title: t.requestedTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-provision-sanctioned',
            content: t.sanctionedContent,
            title: t.sanctionedTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-provision-table',
            content: t.tableContent,
            title: t.tableTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-provision-help',
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

export default WardProvisionsTutorial;
