import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const VoiceCallTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-voice-header',
            content: language === 'mr'
                ? 'व्हॉइस कॉल विभागात आपले स्वागत आहे! येथे तुम्ही मतदारांना थेट व्हॉइस कॉल करू शकता.'
                : 'Welcome to Voice Call! Here you can make direct voice calls to your voters.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-voice-search',
            content: language === 'mr'
                ? 'विशिष्ट मतदारांना शोधण्यासाठी शोध (Search) फिल्टरचा वापर करा.'
                : 'Use the search filter to find specific voters quickly.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voice-list',
            content: language === 'mr'
                ? 'येथे मतदारांची यादी दिसेल. प्रत्येक कार्डवर असलेल्या "आत्ता कॉल करा" (Call Now) बटणावर क्लिक करून तुम्ही कॉल करू शकता.'
                : 'Here you can see the voter cards. Click the "Call Now" button on any card to initiate a voice call.',
            placement: 'top',
        },
        {
            target: '.tutorial-voice-tabs',
            content: language === 'mr'
                ? 'कॉल करण्यासाठी आणि जुन्या कॉल्सचा इतिहास पाहण्यासाठी या टॅबचा वापर करा.'
                : 'Switch between making new calls and viewing your voice call history using these tabs.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voice-history',
            content: language === 'mr'
                ? 'येथे तुम्हाला मागील सर्व कॉल्सची यादी दिसेल.'
                : 'Here you will find a list of all your previous calls.',
            placement: 'top',
        },
        {
            target: '.tutorial-voice-help',
            content: language === 'mr'
                ? 'या पेजच्या वैशिष्ट्यांची पुन्हा माहिती हवी असल्यास "मदत" बटणावर क्लिक करा.'
                : 'Click the "Help" button anytime you want a refresher on how to use this page.',
            placement: 'bottom',
        }
    ], [language]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            stopTutorial();
        }
    };

    return (
        <Joyride
            steps={steps}
            run={runTutorial}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#0ea5e9',
                    zIndex: 1000,
                },
                spotlight: {
                    borderRadius: '16px',
                },
                tooltip: {
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                },
                tooltipContainer: {
                    textAlign: 'left',
                },
                buttonNext: {
                    borderRadius: '8px',
                    fontSize: '14px',
                },
                buttonBack: {
                    fontSize: '14px',
                    marginRight: '10px',
                }
            }}
            locale={{
                back: language === 'mr' ? 'मागे' : 'Back',
                close: language === 'mr' ? 'बंद करा' : 'Close',
                last: language === 'mr' ? 'पूर्ण' : 'Finish',
                next: language === 'mr' ? 'पुढील' : 'Next',
                skip: language === 'mr' ? 'वगळा' : 'Skip',
            }}
        />
    );
};

export default VoiceCallTutorial;
