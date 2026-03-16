import React, { useMemo } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { useLanguage } from '../../context/LanguageContext';
import { useTutorial } from '../../context/TutorialContext';

const SurveyTutorial: React.FC = () => {
    const { language } = useLanguage();
    const { runTutorial, stopTutorial } = useTutorial();

    const steps: Step[] = useMemo(() => [
        {
            target: '.tutorial-surveys-header',
            content: language === 'mr'
                ? 'नमुना सर्वेक्षणे मॉड्यूलमध्ये आपले स्वागत आहे! येथे तुम्ही तुमचे सर्व सर्वेक्षण तयार आणि व्यवस्थापित करू शकता.'
                : 'Welcome to the Sample Surveys module! Here you can create and manage all your surveys.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.tutorial-surveys-create',
            content: language === 'mr'
                ? 'काही सोप्या चरणांमध्ये नवीन सर्वेक्षण तयार करण्यासाठी या बटणावर क्लिक करा.'
                : 'Click this button to start creating a new survey in a few simple steps.',
            placement: 'left',
        },
        {
            target: '.tutorial-surveys-filters',
            content: language === 'mr'
                ? 'विशिष्ट सर्वेक्षणे शोधण्यासाठी कीवर्ड वापरून शोधा किंवा क्षेत्रानुसार फिल्टर करा.'
                : 'Search using keywords or filter by area to find specific surveys quickly.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-surveys-stats',
            content: language === 'mr'
                ? 'एकूण नागरिक, लक्ष्य नमुना आकार आणि सक्रिय सर्वेक्षणाचे त्वरित विहंगावलोकन मिळवा.'
                : 'Get a quick overview of total citizens, target sample size, and active surveys.',
            placement: 'bottom',
        },
        {
            target: '.tutorial-surveys-list',
            content: language === 'mr'
                ? 'तुमच्या सर्वेक्षणांची सूची येथे पहा. तुम्ही स्थिती आणि प्रश्नांची संख्या तपासू शकता.'
                : 'See the list of your surveys here. You can check the status and number of questions.',
            placement: 'top',
        },
        {
            target: '.tutorial-surveys-list tr:first-child button',
            content: language === 'mr'
                ? 'प्रत्येक सर्वेक्षणासाठी, तुम्ही संपादित करू शकता, हटवू शकता, अहवाल पाहू शकता किंवा व्हॉट्सॲपद्वारे पाठवू शकता.'
                : 'For each survey, you can edit, delete, view reports, or send via WhatsApp.',
            placement: 'left',
        },
        {
            target: '.tutorial-surveys-help',
            content: language === 'mr'
                ? 'टूर पुन्हा सुरू करण्यासाठी तुम्हाला कधीही मदत हवी असल्यास या बटणावर क्लिक करा.'
                : 'Click this button anytime you need help to restart the tour.',
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

export default SurveyTutorial;
