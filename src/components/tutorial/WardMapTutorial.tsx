import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const WardMapTutorial: React.FC = () => {
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
            headerTitle: 'Interactive Ward Map',
            headerContent: 'Welcome to the Ward Map! This tool provides a geographic overview of your constituency boundary and key locations.',
            mapTitle: 'Interactive Boundary',
            mapContent: 'The map displays the official boundary of your ward. You can pan, zoom, and explore different areas.',
            detailsTitle: 'Place Identification',
            detailsContent: 'Click or tap on any building, office, or point of interest to see its specific address, category, and street view (if available).',
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
            headerTitle: 'परस्परसंवादी प्रभाग नकाशा',
            headerContent: 'प्रभाग नकाशामध्ये आपले स्वागत आहे! हे साधन तुमच्या मतदारसंघाची सीमा आणि महत्त्वाच्या ठिकाणांचे भौगोलिक विहंगावलोकन प्रदान करते.',
            mapTitle: 'परस्परसंवादी सीमा',
            mapContent: 'नकाशा तुमच्या प्रभागाची अधिकृत सीमा दर्शवितो. तुम्ही विविध भागांचा मागोवा घेऊ शकता, झूम करू शकता आणि शोध घेऊ शकता.',
            detailsTitle: 'ठिकाण ओळख',
            detailsContent: 'कोणतीही इमारत, कार्यालय किंवा आवडीच्या ठिकाणावर क्लिक करा किंवा टॅप करा, जेणेकरून त्याचा पत्ता, श्रेणी आणि उपलब्ध असल्यास "स्ट्रीट व्ह्यू" पाहता येईल.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-map-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-map-container',
            content: t.mapContent,
            title: t.mapTitle,
            disableBeacon: true,
            placement: 'center',
        },
        {
            target: '.tutorial-map-container',
            content: t.detailsContent,
            title: t.detailsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-map-help',
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
                overlay: {
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
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

export default WardMapTutorial;
