import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const LetterTutorial: React.FC = () => {
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
            headerTitle: 'Letters Dashboard',
            headerContent: 'Manage all outgoing official letters and incoming documents from citizens.',
            actionsTitle: 'Letter Actions',
            actionsContent: 'Access settings for Letter Types (templates) or create a New Request here.',
            tabsTitle: 'Incoming vs Outgoing',
            tabsContent: 'Toggle between generating Outgoing Letters (certificates, recommendations) and viewing uploaded Incoming Letters.',
            viewTitle: 'Display Options',
            viewContent: 'Switch between a standard Grid view or a printable Report view of the letters list.',
            searchTitle: 'Search and Filter',
            searchContent: 'Quickly find specific letters by name, subject, area, or date.',
            listTitle: 'The Letters List',
            listContent: 'Select any letter from this list to view its details or preview the document on the right.',
            previewTitle: 'Document Preview',
            previewContent: 'View the drafted letter, translate its contents, or generate the final PDF (English or Marathi) from here.',
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
            headerTitle: 'पत्र डॅशबोर्ड',
            headerContent: 'सर्व जाणारी अधिकृत पत्रे (Outgoing) आणि नागरिकांकडून येणारी कागदपत्रे (Incoming) व्यवस्थापित करा.',
            actionsTitle: 'पत्राच्या कृती',
            actionsContent: 'पत्राच्या प्रकारांसाठी (Types/Templates) सेटिंग्जमध्ये जा किंवा नवीन विनंती (New Request) तयार करा.',
            tabsTitle: 'जावक विरुद्ध आवक',
            tabsContent: 'जावक पत्रे (Outgoing - दाखले, शिफारसी) तयार करणे आणि अपलोड केलेली आवक पत्रे (Incoming) पाहणे या दरम्यान स्विच करा.',
            viewTitle: 'प्रदर्शन पर्याय',
            viewContent: 'पत्रांच्या यादीचे सामान्य ग्रिड दृश्य (Grid) किंवा प्रिंट करण्यायोग्य अहवाल दृश्य (Report) दरम्यान स्विच करा.',
            searchTitle: 'शोधा आणि फिल्टर करा',
            searchContent: 'नाव, विषय, भाग (Area) किंवा तारखेनुसार विशिष्ट पत्रे त्वरित शोधा.',
            listTitle: 'पत्रांची यादी',
            listContent: 'तपशील पाहण्यासाठी किंवा उजवीकडे दस्तऐवजाचे पूर्वावलोकन (Preview) पाहण्यासाठी या सूचीमधून कोणतेही पत्र निवडा.',
            previewTitle: 'दस्तऐवज पूर्वावलोकन (Preview)',
            previewContent: 'येथून मसुद्याचे पूर्वावलोकन पहा, आशय भाषांतरित करा किंवा अंतिम पीडीएफ (इंग्रजी किंवा मराठीत) तयार करा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-letter-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-letter-actions',
            content: t.actionsContent,
            title: t.actionsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-letter-tabs',
            content: t.tabsContent,
            title: t.tabsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-letter-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-letter-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-letter-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'right', // typically on the left side, so tooltip points right
        },
        {
            target: '.tutorial-letter-preview',
            content: t.previewContent,
            title: t.previewTitle,
            disableBeacon: true,
            placement: 'left', // typically on the right side, so tooltip points left
        },
        {
            target: '.tutorial-letter-help',
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

export default LetterTutorial;
