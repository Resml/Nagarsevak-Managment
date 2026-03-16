import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const DiaryTutorial: React.FC = () => {
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
            headerTitle: 'Diary & GB Register',
            headerContent: 'Track all proceedings, decisions, and resolutions from municipal meetings and General Body sessions.',
            addTitle: 'Add Official Entry',
            addContent: 'Record a new entry for a meeting, including subject, department, and official response. Use AI to help draft descriptions!',
            searchTitle: 'Find by Subject',
            searchContent: 'Search through recorded resolutions and meeting notes by their subject, title, or keywords.',
            areaTitle: 'Filter by Location',
            areaContent: 'Quickly find all decisions or tasks related to a specific ward or locality.',
            filterTitle: 'Meeting Type',
            filterContent: 'Filter entries by meeting category like Standing Committee, Ward Committee, or General Body sessions.',
            listTitle: 'The Records List',
            listContent: 'View a summary of all entries. Click on any record to expand it and see full details like beneficiaries and official responses.',
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
            headerTitle: 'दैनंदिनी (GB Register)',
            headerContent: 'महापालिकेच्या सभा आणि महासभांमधील सर्व कामकाजाचा, निर्णयांचा आणि ठरावांचा मागोवा येथे घ्या.',
            addTitle: 'नवीन नोंद जोडा',
            addContent: 'सभेची नवीन नोंद करा, ज्यामध्ये विषय, विभाग आणि अधिकृत प्रतिसादाचा समावेश असेल. मजकूर तयार करण्यासाठी तुम्ही AI ची मदत घेऊ शकता!',
            searchTitle: 'विषयानुसार शोधा',
            searchContent: 'ठराव आणि सभेच्या नोंदी त्यांच्या विषयानुसार किंवा शीर्षकानुसार शोधा.',
            areaTitle: 'भागांनुसार फिल्टर',
            areaContent: 'ठराविक प्रभाग किंवा भागाशी संबंधित सर्व निर्णय किंवा समस्या त्वरित शोधा.',
            filterTitle: 'सभेचा प्रकार',
            filterContent: 'स्थायी समिती, प्रभाग समिती किंवा महासभा यांसारख्या सभेच्या श्रेणीनुसार नोंदी फिल्टर करा.',
            listTitle: 'रेकॉर्डची यादी',
            listContent: 'सर्व नोंदींचा सारांश पहा. विभाग, लाभार्थी आणि अधिकृत प्रतिसादासारखे तपशील पाहण्यासाठी कोणतीही नोंद उघडा (Expand).',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-diary-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-diary-add',
            content: t.addContent,
            title: t.addTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-diary-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-diary-area',
            content: t.areaContent,
            title: t.areaTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-diary-filter',
            content: t.filterContent,
            title: t.filterTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-diary-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-diary-help',
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

export default DiaryTutorial;
