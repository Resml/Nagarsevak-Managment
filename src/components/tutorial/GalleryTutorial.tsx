import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const GalleryTutorial: React.FC = () => {
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
            headerTitle: 'Gallery & Media',
            headerContent: 'Welcome! This is where you can manage your events, work photos, and awards to showcase your achievements.',
            addTitle: 'Add New Content',
            addContent: 'Click here to upload a new photo. You can categorize it by Event, Work, or Award.',
            filtersTitle: 'Quick Search',
            filtersContent: 'Easily find specific photos by searching for keywords or filtering by a specific date.',
            listTitle: 'Media Library',
            listContent: 'Browse through your entire collection of photos and media items here.',
            cardTitle: 'Photo Details',
            cardContent: 'Each card displays the photo title, category, and date. You can edit or delete items on hover.',
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
            headerTitle: 'गॅलरी आणि मीडिया',
            headerContent: 'स्वागत आहे! येथे तुम्ही तुमचे कार्यक्रम, कामाचे फोटो आणि पुरस्कार व्यवस्थापित करू शकता.',
            addTitle: 'नवीन फोटो जोडा',
            addContent: 'नवीन फोटो अपलोड करण्यासाठी येथे क्लिक करा. तुम्ही त्याला "कार्यक्रम", "काम" किंवा "पुरस्कार" या श्रेणींमध्ये विभागू शकता.',
            filtersTitle: 'झटपट शोध',
            filtersContent: 'कीवर्ड शोधून किंवा विशिष्ट तारखेनुसार फिल्टर करून तुम्ही हवे असलेले फोटो सहज शोधू शकता.',
            listTitle: 'मीडिया लायब्ररी',
            listContent: 'तुमचा संपूर्ण फोटोंचा संग्रह येथे पाहू शकता.',
            cardTitle: 'फोटो तपशील',
            cardContent: 'प्रत्येक फोटो कार्डवर त्याचे शीर्षक, श्रेणी आणि तारीख दिसते. एडिट किंवा डिलीट करण्यासाठी फोटोवर कर्सर न्या.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-gallery-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-gallery-add',
            content: t.addContent,
            title: t.addTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-gallery-filters',
            content: t.filtersContent,
            title: t.filtersTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-gallery-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-gallery-card',
            content: t.cardContent,
            title: t.cardTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-gallery-help',
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

export default GalleryTutorial;
