import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const WardProblemsTutorial: React.FC = () => {
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
            headerTitle: 'Ward Wise Problems',
            headerContent: 'This page helps you track self-identified problems and area-specific issues in your ward.',
            newTitle: 'New Ward Request',
            newContent: 'Click here to log a new ward problem or issue you have identified yourself.',
            viewTitle: 'Display Options',
            viewContent: 'Toggle between the standard Grid view or a printable Report view of ward problems.',
            searchTitle: 'Quick Search',
            searchContent: 'Quickly find specific problems by searching their title or description.',
            areaTitle: 'Area Filter',
            areaContent: 'Filter problems by specific localities or wards to see where focus is needed.',
            dateTitle: 'Date Filter',
            dateContent: 'Find problems reported on specific dates or within certain timeframes.',
            statusTitle: 'Status Filters',
            statusContent: 'Filter the list below to see only Pending, In Progress, Assigned, or Resolved issues.',
            listTitle: 'The Problems List',
            listContent: 'Review all identified ward problems here. Click on any card to see full details and manage the response.',
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
            headerTitle: 'प्रभागातील समस्या',
            headerContent: 'हे पृष्ठ तुम्हाला तुमच्या प्रभागातील स्वतः शोधलेल्या समस्या आणि भागाशी संबंधित मुद्द्यांचा मागोवा घेण्यास मदत करते.',
            newTitle: 'नवीन प्रभाग विनंती',
            newContent: 'तुम्ही स्वतः शोधलेली प्रभागातील नवीन समस्या नोंदवण्यासाठी येथे क्लिक करा.',
            viewTitle: 'प्रदर्शन पर्याय',
            viewContent: 'प्रभागातील समस्यांचे सामान्य ग्रिड दृश्य किंवा प्रिंट करण्यायोग्य अहवाल दृश्य (Report) दरम्यान स्विच करा.',
            searchTitle: 'त्वरित शोध',
            searchContent: 'शीर्षक किंवा वर्णनानुसार विशिष्ट समस्या त्वरित शोधा.',
            areaTitle: 'भागांनुसार फिल्टर',
            areaContent: 'लक्ष कुठे केंद्रित करणे आवश्यक आहे हे पाहण्यासाठी विशिष्ट परिसर किंवा प्रभागांनुसार समस्या फिल्टर करा.',
            dateTitle: 'तारखेनुसार फिल्टर',
            dateContent: 'विशिष्ट तारखांना किंवा ठराविक कालावधीत नोंदवलेल्या समस्या शोधा.',
            statusTitle: 'स्थिती फिल्टर',
            statusContent: 'फक्त प्रलंबित (Pending), प्रगतीपथावर (In Progress), सोपवलेले (Assigned) किंवा सोडवलेले (Resolved) समस्या पाहण्यासाठी खालील यादी फिल्टर करा.',
            listTitle: 'समस्यांची यादी',
            listContent: 'येथे प्रभागातील सर्व ओळखलेल्या समस्या तपासा. संपूर्ण तपशील पाहण्यासाठी आणि प्रतिसादाचे व्यवस्थापन करण्यासाठी कोणत्याही कार्डवर क्लिक करा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-ward-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ward-new',
            content: t.newContent,
            title: t.newTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ward-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ward-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ward-area',
            content: t.areaContent,
            title: t.areaTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ward-date',
            content: t.dateContent,
            title: t.dateTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ward-status',
            content: t.statusContent,
            title: t.statusTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-ward-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-ward-help',
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

export default WardProblemsTutorial;
