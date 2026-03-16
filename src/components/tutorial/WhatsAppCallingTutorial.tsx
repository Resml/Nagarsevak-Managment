import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const WhatsAppCallingTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-wacall-header',
            content: language === 'mr'
                ? 'व्हॉट्सॲप कॉलिंग विभागात आपले स्वागत आहे! येथे तुम्ही मतदारांना व्हॉट्सॲपद्वारे थेट कॉल करू शकता.'
                : 'Welcome to WhatsApp Call! Here you can make direct calls to your voters via WhatsApp.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-wacall-status',
            content: language === 'mr'
                ? 'येथे तुम्ही बॉट कनेक्टेड आहे की नाही हे पाहू शकता. जर बॉट डिस्कनेक्ट असेल, तर कॉल सामान्य व्हॉट्सॲप वेबद्वारे उघडला जाईल.'
                : 'Check the bot connectivity status here. If the bot is disconnected, calls will open via standard WhatsApp Web.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-wacall-list',
            content: language === 'mr'
                ? 'येथे मतदारांची यादी दिसेल. कॉल करण्यासाठी "व्हॉट्सॲप कॉल" बटणावर क्लिक करा.'
                : 'Here is the list of voters. Click the "WhatsApp Call" button to initiate a call.',
            placement: 'top',
        },
        {
            target: '.tutorial-wacall-tabs',
            content: language === 'mr'
                ? 'कॉल करण्यासाठी आणि जुन्या कॉल्सचा इतिहास पाहण्यासाठी या टॅबचा वापर करा.'
                : 'Switch between making new calls and viewing your calling history using these tabs.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-wacall-help',
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
                overlay: {
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
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

export default WhatsAppCallingTutorial;
