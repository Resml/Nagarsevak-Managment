import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const TeamTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-team-header',
            content: language === 'mr'
                ? '"माझी टीम" मध्ये आपले स्वागत आहे! येथे तुम्ही तुमच्या कार्यालयातील आणि पक्षातील कार्यकर्त्यांचे व्यवस्थापन करू शकता.'
                : 'Welcome to "My Team"! Here you can manage your office staff and party workers.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-team-add',
            content: language === 'mr'
                ? 'नवीन टीम मेंबर जोडण्यासाठी येथे क्लिक करा. तुम्ही त्यांना लॉगिन आयडी आणि पासवर्ड देखील देऊ शकता.'
                : 'Click here to add a new team member. You can also provide them with a login ID and password.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-team-tabs',
            content: language === 'mr'
                ? 'तुमची टीम "कार्यालय" (Office) आणि "पक्ष" (Party) या विभागांमध्ये विभागली आहे. विभाग बदलण्यासाठी या टॅबचा वापर करा.'
                : 'Your team is organized into "Office" and "Party" categories. Use these tabs to switch between them.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-team-filters',
            content: language === 'mr'
                ? 'नाव, मोबाईल नंबर किंवा क्षेत्रानुसार टीम मेंबर्स शोधण्यासाठी या फिल्टरचा वापर करा.'
                : 'Use these filters to search for team members by name, mobile number, or area.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-team-view',
            content: language === 'mr'
                ? 'ग्रिड आणि रिपोर्ट व्ह्युमध्ये बदल करा. रिपोर्ट व्ह्यु प्रिंट करण्यासाठी सोयीस्कर आहे.'
                : 'Toggle between Grid and Report views. Report view is convenient for printing.',
            placement: 'left',
        },
        {
            target: '.tutorial-team-list',
            content: language === 'mr'
                ? 'येथे तुमच्या टीम मेंबर्सची यादी दिसेल. मेंबरवर क्लिक करून तुम्ही त्यांची प्रोफाईल, कार्यक्षेत्र आणि परवानग्या पाहू शकता.'
                : 'Your team members list appears here. Click on a member to view their profile, assigned area, and permissions.',
            placement: 'top',
        },
        {
            target: '.tutorial-team-help',
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

export default TeamTutorial;
