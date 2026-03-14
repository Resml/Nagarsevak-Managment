import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const ContentStudioTutorial: React.FC = () => {
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
            headerTitle: 'AI Content Studio',
            headerContent: 'Welcome to your AI-powered creative hub! Generate high-quality speeches, social media posts, and notices instantly.',
            inputTitle: 'Craft Your Prompt',
            inputContent: 'Enter your topic and customize the content type, tone, and language. The AI will tailor the result to your preferences.',
            generateTitle: 'Magic at Your Fingertips',
            generateContent: 'Click "Generate" and watch the AI work its magic. It only takes a few seconds to create personalized content.',
            outputTitle: 'AI Result',
            outputContent: 'Your generated content appears here. You can refine it, or use the "Copy" button to quickly use it in your communication.',
            historyTitle: 'Recent Work',
            historyContent: 'All your previously generated content is saved here. You can quickly reload any past result with a single click.',
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
            headerTitle: 'AI कंटेंट स्टुडिओ (AI Content Studio)',
            headerContent: 'तुमच्या AI-आधारित क्रिएटिव्ह हबमध्ये स्वागत आहे! भाषणे, सोशल मीडिया पोस्ट आणि सूचना त्वरित तयार करा.',
            inputTitle: 'तुमचा विषय द्या',
            inputContent: 'तुमचा विषय प्रविष्ट करा आणि कंटेंट प्रकार, टोन आणि भाषा निवडा. AI तुमच्या आवडीनुसार निकाल देईल.',
            generateTitle: 'जादू तुमच्या बोटांवर',
            generateContent: '"Generate" वर क्लिक करा आणि AI ची जादू पहा. वैयक्तिकृत मजकूर तयार करण्यासाठी फक्त काही सेकंद लागतात.',
            outputTitle: 'AI निकाल',
            outputContent: 'तुमचा तयार केलेला मजकूर येथे दिसेल. तुम्ही तो सुधारू शकता किंवा "Copy" बटण वापरून त्वरित वापरू शकता.',
            historyTitle: 'अलीकडील काम',
            historyContent: 'तुमचा पूर्वीचा सर्व मजकूर येथे सेव्ह केला जातो. तुम्ही एका क्लिकवर कोणताही जुना निकाल पुन्हा लोड करू शकता.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-ai-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-ai-input',
            content: t.inputContent,
            title: t.inputTitle,
            disableBeacon: true,
            placement: 'right',
        },
        {
            target: '.tutorial-ai-generate',
            content: t.generateContent,
            title: t.generateTitle,
            disableBeacon: true,
            placement: 'right',
        },
        {
            target: '.tutorial-ai-output',
            content: t.outputContent,
            title: t.outputTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-ai-history',
            content: t.historyContent,
            title: t.historyTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-ai-help',
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

export default ContentStudioTutorial;
