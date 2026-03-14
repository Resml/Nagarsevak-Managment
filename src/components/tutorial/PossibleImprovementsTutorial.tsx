import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const PossibleImprovementsTutorial: React.FC = () => {
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
            headerTitle: 'Ward Improvements',
            headerContent: 'Welcome to the Possible Improvements page! Here you can view and propose community-driven projects for your ward.',
            viewTitle: 'Display Options',
            viewContent: 'Switch between a visual Grid view and a formal Report view for printing projects.',
            newTitle: 'Propose New Idea',
            newContent: 'Have a suggestion for ward development? Click here to propose a new improvement project.',
            searchTitle: 'Find Projects',
            searchContent: 'Search through proposed improvements by title, description, or specific location.',
            areaTitle: 'Locality Filter',
            areaContent: 'Filter projects by specific neighborhoods or areas within your ward.',
            dateTitle: 'Timeline',
            dateContent: 'Find projects based on when they were proposed or planned for completion.',
            tabsTitle: 'Status Tracking',
            tabsContent: 'Filter projects by their current progress - from Pending ideas to Completed works.',
            listTitle: 'Improvement Ideas',
            listContent: 'Explore all community suggestions here. You can vote for projects and see their current status.',
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
            headerTitle: 'प्रभागातील सुधारणा',
            headerContent: 'प्रभागातील सुधारणा (Possible Improvements) पृष्ठावर आपले स्वागत आहे! येथे तुम्ही तुमच्या प्रभागासाठी लोकसहभागातून सुचवलेले प्रकल्प पाहू शकता आणि नवीन प्रकल्प प्रस्तावित करू शकता.',
            viewTitle: 'प्रदर्शन पर्याय',
            viewContent: 'व्हिज्युअल ग्रिड व्ह्यू आणि प्रिंटिंगसाठी औपचारिक रिपोर्ट व्ह्यूमध्ये स्विच करा.',
            newTitle: 'नवीन कल्पना सुचवा',
            newContent: 'प्रभाग विकासासाठी काही सूचना आहेत? नवीन सुधारणा प्रकल्प सुचवण्यासाठी येथे क्लिक करा.',
            searchTitle: 'प्रकल्प शोधा',
            searchContent: 'शीर्षक, वर्णन किंवा विशिष्ट ठिकाणानुसार प्रस्तावित सुधारणा प्रकल्प शोधा.',
            areaTitle: 'परिसर फिल्टर',
            areaContent: 'तुमच्या प्रभागातील विशिष्ट परिसर किंवा भागांनुसार प्रकल्प फिल्टर करा.',
            dateTitle: 'कालावधी',
            dateContent: 'प्रस्तावित केलेल्या किंवा पूर्ण होण्यासाठी नियोजित असलेल्या तारखांनुसार प्रकल्प शोधा.',
            tabsTitle: 'स्थितीचा मागोवा',
            tabsContent: 'कामाच्या प्रगतीनुसार प्रकल्प फिल्टर करा - प्रलंबित (Pending) पासून पूर्ण (Complete) झालेल्या कामांपर्यंत.',
            listTitle: 'सुधारणांच्या कल्पना',
            listContent: 'येथे सर्व समुदायाने सुचवलेल्या कल्पना पहा. तुम्ही प्रकल्पांना मतदान करू शकता आणि त्यांची सद्यस्थिती पाहू शकता.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-improve-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-improve-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-improve-new',
            content: t.newContent,
            title: t.newTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-improve-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-improve-area',
            content: t.areaContent,
            title: t.areaTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-improve-date',
            content: t.dateContent,
            title: t.dateTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-improve-tabs',
            content: t.tabsContent,
            title: t.tabsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-improve-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-improve-help',
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

export default PossibleImprovementsTutorial;
