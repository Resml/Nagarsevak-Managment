import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const SMSTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-sms-header',
            content: language === 'mr'
                ? 'SMS संवादात आपले स्वागत आहे! येथे तुम्ही मतदारांना महत्त्वाचे संदेश पाठवू शकता.'
                : 'Welcome to SMS Communication! Here you can send important messages to your voters.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-sms-filters',
            content: language === 'mr'
                ? 'विशिष्ट मतदारांना शोधण्यासाठी या फिल्टरचा वापर करा. तुम्ही नाव, पत्ता, वय, लिंग किंवा जातीनुसार फिल्टर करू शकता.'
                : 'Use these filters to narrow down your contacts. You can filter by name, address, age, gender, or caste.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-sms-list',
            content: language === 'mr'
                ? 'येथे मतदारांची यादी दिसेल. तुम्ही एक-एक करून किंवा "सर्वांना निवडा" (Select All) बटण वापरून मतदार निवडू शकता.'
                : 'Review the list of filtered voters here. You can select them individually or use the "Select All" button.',
            placement: 'top',
        },
        {
            target: '.tutorial-sms-compose',
            content: language === 'mr'
                ? 'तुमचा संदेश येथे टाईप करा. तो स्पष्ट आणि संक्षिप्त असावा.'
                : 'Type your message here. Ensure it is clear and concise.',
            placement: 'top',
        },
        {
            target: '.tutorial-sms-send',
            content: language === 'mr'
                ? 'संदेश पाठवण्यासाठी या बटणावर क्लिक करा. निवडलेल्या सर्व मतदारांना तो त्वरित पाठवला जाईल.'
                : 'Click here to send the SMS. It will be delivered to all selected recipients immediately.',
            placement: 'top',
        },
        {
            target: '.tutorial-sms-tabs',
            content: language === 'mr'
                ? 'नवीन संदेश पाठवण्यासाठी आणि जुन्या संदेशांचा इतिहास पाहण्यासाठी या टॅबचा वापर करा.'
                : 'Switch between sending new messages and viewing the history of previously sent SMS.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-sms-help',
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

export default SMSTutorial;
