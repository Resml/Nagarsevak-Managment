import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const VoterFormTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-voterforms-header',
            content: language === 'mr'
                ? 'मतदार फॉर्म विभागात आपले स्वागत आहे! येथे तुम्ही नवीन मतदारांची नोंदणी, नाव बदलणे किंवा नाव कमी करण्यासाठी आवश्यक फॉर्म शोधू शकता.'
                : 'Welcome to Voter Forms! Here you can find essential forms for new voter registration, name correction, or deletion.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-voterforms-cards',
            content: language === 'mr'
                ? 'येथे तुम्हाला फॉर्म ६, ७, ८ आणि मतदार शोध (Electoral Search) च्या लिंक मिळतील. "आत्ताच लागू करा" (Apply Now) वर क्लिक करून तुम्ही अधिकृत वेबसाइटवर फॉर्म भरू शकता.'
                : 'Here you can find links for Form 6, 7, 8, and Electoral Search. Click "Apply Now" to fill the form on the official ECI website.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voterforms-log',
            content: language === 'mr'
                ? 'जेव्हा कोणी तुमच्या ऑफिसमध्ये फॉर्म भरते, तेव्हा त्याची नोंद ठेवण्यासाठी या बटणाचा वापर करा. यामुळे तुम्हाला अर्जाचा मागोवा ठेवणे सोपे जाईल.'
                : 'When someone fills a form at your office, use this button to log it. This helps you track the status of applications easily.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voterforms-tabs',
            content: language === 'mr'
                ? 'फॉर्मच्या लिंक आणि तुम्ही आधी भरलेल्या अर्जांचा इतिहास (History) यांमध्ये बदल करण्यासाठी या टॅबचा वापर करा.'
                : 'Use these tabs to switch between form links and your previous application history.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voterforms-history',
            content: language === 'mr'
                ? 'येथे तुम्हाला पूर्वी लॉग केलेल्या सर्व अर्जांची यादी दिसेल. तुम्ही त्यांचा सद्यस्थिती (Status) पाहू शकता.'
                : 'Here you will see a list of all previously logged applications. You can monitor their current status from here.',
            placement: 'top',
        },
        {
            target: '.tutorial-voterforms-filters',
            content: language === 'mr'
                ? 'विशिष्ट अर्ज शोधण्यासाठी शोध (Search) आणि फिल्टरचा वापर करा.'
                : 'Use search and filters to find specific applications quickly.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voterforms-help',
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

export default VoterFormTutorial;
