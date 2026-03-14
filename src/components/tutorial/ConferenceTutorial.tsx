import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const ConferenceTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-conference-header',
            content: language === 'mr'
                ? 'कॉन्फरन्स रूममध्ये आपले स्वागत आहे! येथे तुम्ही व्हर्च्युअल मीटिंग रूम तयार करू शकता आणि त्यात सामील होऊ शकता.'
                : 'Welcome to the Conference Room! Here you can create and join virtual meeting rooms.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-conference-create',
            content: language === 'mr'
                ? 'नवीन मीटिंग रूम तयार करण्यासाठी या बटणावर क्लिक करा.'
                : 'Click this button to create a new virtual meeting room.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-conference-tabs',
            content: language === 'mr'
                ? 'सध्याच्या सक्रिय मीटिंग्स आणि जुन्या मीटिंग्सचा इतिहास तपासण्यासाठी या टॅबचा वापर करा.'
                : 'Use these tabs to switch between active meeting rooms and the history of past meetings.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-conference-list',
            content: language === 'mr'
                ? 'येथे तुम्हाला सक्रिय रूम्सची यादी दिसेल. मीटिंगमध्ये सामील होण्यासाठी "रूममध्ये सामील व्हा" (Join Room) वर क्लिक करा.'
                : 'Here is the list of active rooms. Click "Join Room" to enter a virtual meeting.',
            placement: 'top',
        },
        {
            target: '.tutorial-conference-help',
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

export default ConferenceTutorial;
