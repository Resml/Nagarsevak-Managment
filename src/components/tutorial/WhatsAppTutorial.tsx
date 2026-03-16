import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const WhatsAppTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-wa-header',
            content: language === 'mr'
                ? 'व्हॉट्सॲप संवादात आपले स्वागत आहे! येथे तुम्ही मतदारांना थेट व्हॉट्सॲप संदेश पाठवू शकता.'
                : 'Welcome to WhatsApp Communication! Here you can send direct WhatsApp messages to your voters.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-wa-status',
            content: language === 'mr'
                ? 'येथे तुम्ही व्हॉट्सॲप बॉटची स्थिती पाहू शकता. संदेश पाठवण्यासाठी बॉट "सक्रिय" (Active) असणे आवश्यक आहे.'
                : 'Check the WhatsApp bot status here. The bot must be "Active" to send messages successfully.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-wa-filters',
            content: language === 'mr'
                ? 'विशिष्ट मतदारांना शोधण्यासाठी शोध (Search) आणि फिल्टरचा वापर करा. तुम्ही वय, लिंग, पत्ता किंवा जातीनुसार फिल्टर करू शकता.'
                : 'Use search and filters to find specific voters. You can filter by age, gender, address, or caste.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-wa-list',
            content: language === 'mr'
                ? 'येथे मतदारांची यादी दिसेल. तुम्ही एक-एक करून किंवा एकाच वेळी सर्व दृश्यमान मतदार निवडू शकता.'
                : 'Review your filtered voter list here. Select recipients individually or use the select all option.',
            placement: 'top',
        },
        {
            target: '.tutorial-wa-compose',
            content: language === 'mr'
                ? 'तुमचा व्हॉट्सॲप संदेश येथे टाईप करा. तुम्ही यात इमोजी आणि लिंक्स देखील वापरू शकता.'
                : 'Compose your WhatsApp message here. You can include emojis and links for better engagement.',
            placement: 'top',
        },
        {
            target: '.tutorial-wa-send',
            content: language === 'mr'
                ? 'संदेश पाठवण्यासाठी या बटणावर क्लिक करा. बॉटद्वारे निवडलेल्या सर्व मतदारांना संदेश पाठवला जाईल.'
                : 'Click here to send your message. The bot will deliver it to all selected recipients.',
            placement: 'top',
        },
        {
            target: '.tutorial-wa-tabs',
            content: language === 'mr'
                ? 'नवीन संदेश पाठवण्यासाठी आणि जुन्या संदेशांचा इतिहास पाहण्यासाठी या टॅबचा वापर करा.'
                : 'Switch between sending new messages and viewing your WhatsApp message history.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-wa-help',
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

export default WhatsAppTutorial;
