import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const VoterTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-voter-header',
            content: language === 'mr'
                ? 'मतदार शोध (Voter Search) मध्ये आपले स्वागत आहे! येथे तुम्ही तुमच्या वॉर्डमधील मतदारांची माहिती शोधू शकता आणि व्यवस्थापित करू शकता.'
                : 'Welcome to Voter Search! Here you can find and manage voter information in your ward.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-voter-friends',
            content: language === 'mr'
                ? 'या बटणावर क्लिक करून तुमचे वैयक्तिक "मित्र आणि नातेवाईक" यांची यादी पहा किंवा नवीन मतदार जोडा.'
                : 'Click here to view your personal "Friends & Relatives" list or add new voters to it.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voter-caste-btn',
            content: language === 'mr'
                ? 'जातीनुसार मतदारांचे वर्गीकरण करण्यासाठी या पर्यायाचा वापर करा.'
                : 'Use this feature for smart caste-based allocation and analysis of voters.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voter-add',
            content: language === 'mr'
                ? 'यादीत नसलेला नवीन मतदार तुम्ही मॅन्युअली येथे जोडू शकता.'
                : 'You can manually add a new voter to the system from here.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voter-filters',
            content: language === 'mr'
                ? 'नाव, पत्ता, वय, लिंग किंवा जातीनुसार शोधण्यासाठी या प्रगत फिल्टरचा वापर करा. पत्ता शोधताना तुम्हाला सूचना देखील मिळतील.'
                : 'Use these advanced filters to search by name, address, age, gender, or caste. Look for smart suggestions while typing!',
            placement: 'bottom',
        },
        {
            target: '.tutorial-voter-view',
            content: language === 'mr'
                ? 'ग्रिड (Grid) आणि रिपोर्ट (Report) व्ह्यूमध्ये बदल करा. रिपोर्ट व्ह्यू प्रिंटिंगसाठी उत्तम आहे.'
                : 'Toggle between Grid and Report views. Report view is optimized for printing.',
            placement: 'left',
        },
        {
            target: '.tutorial-voter-list',
            content: language === 'mr'
                ? 'येथे मतदारांची यादी दिसेल. प्रत्येक मतदारावर क्लिक करून तुम्ही त्यांची संपूर्ण प्रोफाईल आणि इतिहास पाहू शकता.'
                : 'The list of voters appears here. Click on any voter to view their detailed profile and history.',
            placement: 'top',
        },
        {
            target: '.tutorial-voter-help',
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

export default VoterTutorial;
