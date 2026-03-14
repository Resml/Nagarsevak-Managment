import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const ComplaintTutorial: React.FC = () => {
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
            headerTitle: 'Complaints & Requests',
            headerContent: 'This is where you manage all incoming citizen problems and personal requests.',
            newTitle: 'Create New',
            newContent: 'Use this button to manually add a new complaint or a new personal request into the system.',
            viewTitle: 'Display Options',
            viewContent: 'Toggle between the standard Grid view or a printable Report view.',
            tabsTitle: 'Categories',
            tabsContent: 'Switch between "Area Complaints" (general problems) and "Personal Help" (individual requests).',
            searchTitle: 'Search and Filter',
            searchContent: 'Quickly find specific complaints by keyword, or filter down by Area and Date.',
            statusTitle: 'Status Filters',
            statusContent: 'Filter the list below to see only Pending, In Progress, Assigned, or Resolved issues.',
            listTitle: 'The Request List',
            listContent: 'Here are the actual requests. Click on any card to view its full details, update its status, or assign it to staff.',
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
            headerTitle: 'तक्रारी आणि विनंती',
            headerContent: 'येथून तुम्ही नागरिकांच्या सर्व समस्या आणि वैयक्तिक विनंत्या व्यवस्थापित करू शकता.',
            newTitle: 'नवीन तयार करा',
            newContent: 'सिस्टममध्ये नवीन तक्रार किंवा वैयक्तिक विनंती मॅन्युअली जोडण्यासाठी हे बटण वापरा.',
            viewTitle: 'प्रदर्शन पर्याय',
            viewContent: 'सामान्य ग्रिड दृश्य (Grid) किंवा प्रिंट करण्यायोग्य अहवाल दृश्य (Report) दरम्यान स्विच करा.',
            tabsTitle: 'श्रेण्या',
            tabsContent: '"परिसरातील तक्रारी" (सामान्य समस्या) आणि "वैयक्तिक मदत" (वैयक्तिक विनंत्या) दरम्यान स्विच करा.',
            searchTitle: 'शोधा आणि फिल्टर करा',
            searchContent: 'कीवर्डद्वारे विशिष्ट तक्रारी त्वरित शोधा, किंवा भाग (Area) आणि तारखेनुसार फिल्टर करा.',
            statusTitle: 'स्थिती फिल्टर',
            statusContent: 'फक्त प्रलंबित (Pending), प्रगतीपथावर (In Progress), सोपवलेले (Assigned) किंवा सोडवलेले (Resolved) समस्या पाहण्यासाठी खालील यादी फिल्टर करा.',
            listTitle: 'विनंती यादी',
            listContent: 'येथे प्रत्यक्ष विनंत्या आहेत. संपूर्ण तपशील पाहण्यासाठी, स्थिती अद्यतनित करण्यासाठी किंवा कर्मचाऱ्यांना सोपवण्यासाठी कोणत्याही कार्डवर क्लिक करा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-complaint-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-complaint-new',
            content: t.newContent,
            title: t.newTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-complaint-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-complaint-tabs',
            content: t.tabsContent,
            title: t.tabsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-complaint-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-complaint-status',
            content: t.statusContent,
            title: t.statusTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-complaint-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-complaint-help',
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

export default ComplaintTutorial;
