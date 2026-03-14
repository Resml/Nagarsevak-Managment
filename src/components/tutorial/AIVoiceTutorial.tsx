import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const AIVoiceTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-aivoice-header',
            content: language === 'mr'
                ? 'AI व्हॉइस कॉल विभागात आपले स्वागत आहे! येथे तुम्ही एआय (AI) तंत्रज्ञानाचा वापर करून हजारो मतदारांना एकाच वेळी कॉल करू शकता.'
                : 'Welcome to AI Voice Call! Here you can use AI technology to call thousands of voters simultaneously.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-aivoice-search',
            content: language === 'mr'
                ? 'विशिष्ट मतदारांना शोधण्यासाठी शोध (Search) फिल्टरचा वापर करा आणि "सर्वांना निवडा" (Select All) बटणाद्वारे सर्वांना एकाच वेळी निवडा.'
                : 'Use the search filter to find specific voters and use "Select All" to choose them at once.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-aivoice-list',
            content: language === 'mr'
                ? 'निवडलेल्या मतदारांची यादी येथे दिसेल.'
                : 'The list of selected recipients will be displayed here.',
            placement: 'top',
        },
        {
            target: '.tutorial-aivoice-settings',
            content: language === 'mr'
                ? 'येथे तुम्ही कॉलची भाषा (मराठी, हिंदी किंवा इंग्रजी) निवडू शकता.'
                : 'Choose the language for the AI voice here (Marathi, Hindi, or English).',
            placement: 'top',
        },
        {
            target: '.tutorial-aivoice-compose',
            content: language === 'mr'
                ? 'एआयने जे बोलावे असे तुम्हाला वाटते, तो संदेश येथे टाईप करा.'
                : 'Type the message here that you want the AI to speak during the call.',
            placement: 'top',
        },
        {
            target: '.tutorial-aivoice-start',
            content: language === 'mr'
                ? 'सर्व ऑटोमेटेड कॉल सुरू करण्यासाठी या बटणावर क्लिक करा.'
                : 'Click this button to start the automated AI voice calls for all selected recipients.',
            placement: 'top',
        },
        {
            target: '.tutorial-aivoice-tabs',
            content: language === 'mr'
                ? 'नवीन कॉल सुरू करण्यासाठी आणि जुन्या ऑटोमेटेड कॉल्सचा इतिहास पाहण्यासाठी या टॅबचा वापर करा.'
                : 'Use these tabs to switch between starting new calls and viewing the history of previous automated calls.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-aivoice-help',
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

export default AIVoiceTutorial;
