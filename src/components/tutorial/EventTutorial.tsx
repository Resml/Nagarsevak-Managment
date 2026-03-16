import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const EventTutorial: React.FC = () => {
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
            headerTitle: 'Events & Invites',
            headerContent: 'Welcome! This page helps you manage public meetings, programs, and send WhatsApp invites to citizens.',
            createTitle: 'Create New Event',
            createContent: 'Admins can click here to plan a new event. You can even use AI to draft the event description!',
            filtersTitle: 'Find Events',
            filtersContent: 'Quickly search for events by name, location, or filter them by specific areas and dates.',
            viewTitle: 'Switch Views',
            viewContent: 'Toggle between the interactive "Grid View" and a printable "Report View" for your event list.',
            listTitle: 'Event Hub',
            listContent: 'Browse all upcoming and past events here. Each card shows the date, time, and location at a glance.',
            inviteTitle: 'WhatsApp Invites',
            inviteContent: 'Click here to select citizens and send personalized event invitations directly to their WhatsApp!',
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
            headerTitle: 'कार्यक्रम व आमंत्रणे (Events & Invites)',
            headerContent: 'स्वागत आहे! हे पृष्ठ तुम्हाला सार्वजनिक सभा, कार्यक्रम आयोजित करण्यात आणि नागरिकांना व्हॉट्सॲप आमंत्रणे पाठविण्यात मदत करते.',
            createTitle: 'नवीन कार्यक्रम तयार करा',
            createContent: 'अॅडमिन नवीन कार्यक्रमाचे नियोजन करण्यासाठी येथे क्लिक करू शकतात. तुम्ही कार्यक्रमाचे वर्णन लिहिण्यासाठी AI ची मदत घेऊ शकता!',
            filtersTitle: 'कार्यक्रम शोधा',
            filtersContent: 'नावाने, ठिकाणाने कार्यक्रम शोधा किंवा विशिष्ट भाग आणि तारखेनुसार फिल्टर करा.',
            viewTitle: 'व्ह्यू बदला',
            viewContent: 'तुमच्या सोयीनुसार "ग्रिड व्ह्यू" किंवा प्रिंट करण्यायोग्य "रिपोर्ट व्ह्यू" मध्ये स्विच करा.',
            listTitle: 'कार्यक्रम यादी',
            listContent: 'येथे सर्व आगामी आणि मागील कार्यक्रम पहा. प्रत्येक कार्डवर तारीख, वेळ आणि ठिकाण स्पष्टपणे दिसते.',
            inviteTitle: 'व्हॉट्सॲप आमंत्रणे',
            inviteContent: 'नागरिकांना निवडण्यासाठी आणि त्यांच्या व्हॉट्सॲपवर थेट वैयक्तिक आमंत्रणे पाठवण्यासाठी येथे क्लिक करा!',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-event-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-event-create',
            content: t.createContent,
            title: t.createTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-event-filters',
            content: t.filtersContent,
            title: t.filtersTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-event-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-event-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-event-invite',
            content: t.inviteContent,
            title: t.inviteTitle,
            disableBeacon: true,
            placement: 'left',
        },
        {
            target: '.tutorial-event-help',
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
                spotlight: {
                    borderRadius: '16px',
                },
                tooltip: {
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
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

export default EventTutorial;
