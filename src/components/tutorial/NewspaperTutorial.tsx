import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const NewspaperTutorial: React.FC = () => {
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
            headerTitle: 'Newspaper Clippings',
            headerContent: 'Welcome! This page allows you to manage and view news clippings related to your work and ward.',
            addTitle: 'Add New Clipping',
            addContent: 'Click here to upload a new newspaper cutting. You can add a title, description, and link it to a specific date.',
            sectionsTitle: 'News Categories',
            sectionsContent: 'Switch between "Positive" and "Negative" news to keep track of public sentiment and media coverage.',
            filtersTitle: 'Quick Search',
            filtersContent: 'Search for specific clippings by title or description, or filter them by a specific date.',
            viewTitle: 'Display Options',
            viewContent: 'Choose between "Grid View" for a visual gallery or "Report View" for a detailed list suitable for printing.',
            listTitle: 'Media Records',
            listContent: 'View your clippings here. In grid mode, you can hover over items to edit or delete them.',
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
            headerTitle: 'वृत्तपत्र कात्रणे (Newspaper Clippings)',
            headerContent: 'स्वागत आहे! हे पृष्ठ तुम्हाला तुमच्या कामाशी आणि प्रभागाशी संबंधित बातम्यांचे व्यवस्थापन आणि पाहण्यास मदत करते.',
            addTitle: 'नवीन कात्रण जोडा',
            addContent: 'नवीन वृत्तपत्र कात्रण अपलोड करण्यासाठी येथे क्लिक करा. तुम्ही हेडलाईन, वर्णन आणि तारीख जोडू शकता.',
            sectionsTitle: 'बातम्यांचे प्रकार',
            sectionsContent: 'सार्वजनिक मत आणि मीडिया कव्हरेजचा मागोवा घेण्यासाठी "सकारात्मक" आणि "नकारात्मक" बातम्यांमध्ये स्विच करा.',
            filtersTitle: 'त्वरीत शोध',
            filtersContent: 'शीर्षक किंवा वर्णनानुसार विशिष्ट कात्रणे शोधा किंवा विशिष्ट तारखेनुसार फिल्टर करा.',
            viewTitle: 'पाहण्याचे पर्याय',
            viewContent: 'व्हिज्युअल गॅलरीसाठी "ग्रिड व्ह्यू" किंवा प्रिंटिंगसाठी योग्य तपशीलवार सूचीसाठी "रिपोर्ट व्ह्यू" निवडा.',
            listTitle: 'मीडिया रेकॉर्ड्स',
            listContent: 'तुमची कात्रणे येथे पहा. ग्रिड मोडमध्ये, एडिट किंवा डिलीट करण्यासाठी आयटमवर माउस फिरवा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-newspaper-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-newspaper-add',
            content: t.addContent,
            title: t.addTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-newspaper-sections',
            content: t.sectionsContent,
            title: t.sectionsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-newspaper-filters',
            content: t.filtersContent,
            title: t.filtersTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-newspaper-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-newspaper-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-newspaper-help',
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

export default NewspaperTutorial;
