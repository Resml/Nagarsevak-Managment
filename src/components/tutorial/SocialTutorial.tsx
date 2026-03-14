import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const SocialTutorial: React.FC = () => {
    const { runTutorial, stopTutorial } = useTutorial();
    const { language } = useLanguage();

    const translations = {
        en: {
            next: 'Next',
            skip: 'Skip',
            last: 'Got it!',
            back: 'Back',
            close: 'Close',
            step: 'Step',
            of: 'of',
            headerTitle: 'Social Analytics',
            headerContent: 'Monitor your social media performance and engage with your constituency through birthdays and posts.',
            statsTitle: 'Performance Overview',
            statsContent: 'Track total reach, likes, comments, and shares across all connected platforms.',
            postsTitle: 'Social Feed',
            postsContent: 'View all recent posts from Facebook and Instagram. You can search and filter posts by platform.',
            connectTitle: 'Connect Accounts',
            connectContent: 'Link your Facebook and Instagram accounts to sync your latest posts and analytics automatically.',
            birthdaysTitle: 'Constituency Engagement',
            birthdaysContent: 'Never miss a birthday! Send personalized wishes to your voters via WhatsApp to build stronger connections.',
            helpTitle: 'Need Help?',
            helpContent: 'Click this Help button anytime to restart this tutorial.'
        },
        mr: {
            next: 'पुढे',
            skip: 'वगळा',
            last: 'समजले!',
            back: 'मागे',
            close: 'बंद करा',
            step: 'टप्पा',
            of: 'पैकी',
            headerTitle: 'सोशल मीडिया विश्लेषण (Social Analytics)',
            headerContent: 'तुमच्या सोशल मीडिया कामगिरीवर लक्ष ठेवा आणि वाढदिवस आणि पोस्टद्वारे तुमच्या मतदारसंघाशी संवाद साधा.',
            statsTitle: 'कामगिरीचा सारांश',
            statsContent: 'सर्व कनेक्ट केलेल्या प्लॅटफॉर्मवर एकूण पोहोच (Reach), लाईक्स, कमेंट्स आणि शेअर्सचा मागोवा घ्या.',
            postsTitle: 'सोशल फीड',
            postsContent: 'फेसबुक आणि इंस्टाग्रामवरील सर्व अलीकडील पोस्ट पहा. तुम्ही प्लॅटफॉर्मनुसार पोस्ट शोधू शकता आणि फिल्टर करू शकता.',
            connectTitle: 'खाती कनेक्ट करा',
            connectContent: 'तुमच्या नवीनतम पोस्ट आणि विश्लेषण स्वयंचलितपणे सिंक करण्यासाठी फेसबुक आणि इंस्टाग्राम खाती लिंक करा.',
            birthdaysTitle: 'मतदारांशी संवाद',
            birthdaysContent: 'कोणाचाही वाढदिवस विसरू नका! अधिक घट्ट नाते निर्माण करण्यासाठी तुमच्या मतदारांना व्हॉट्सॲपद्वारे वैयक्तिक शुभेच्छा पाठवा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-social-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-social-stats',
            content: t.statsContent,
            title: t.statsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-social-connect',
            content: t.connectContent,
            title: t.connectTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-social-posts',
            content: t.postsContent,
            title: t.postsTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-social-birthdays',
            content: t.birthdaysContent,
            title: t.birthdaysTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-social-help',
            content: t.helpContent,
            title: t.helpTitle,
            disableBeacon: true,
            placement: 'bottom',
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            stopTutorial();
        }
    };

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous={true}
            run={runTutorial}
            scrollToFirstStep={true}
            showProgress={true}
            showSkipButton={true}
            steps={steps}
            locale={{
                back: t.back,
                close: t.close,
                last: t.last,
                next: t.next,
                skip: t.skip,
                nextLabelWithProgress: `${t.next} (${t.step} {step} ${t.of} {steps})`
            }}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#0369a1', // Match theme (sky-700)
                    textColor: '#334155', // slate-700
                    backgroundColor: '#ffffff',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#0369a1',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontFamily: 'inherit',
                },
                buttonBack: {
                    marginRight: '10px',
                    color: '#64748b',
                },
                buttonSkip: {
                    color: '#64748b',
                }
            }}
        />
    );
};

export default SocialTutorial;
