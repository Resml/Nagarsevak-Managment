import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const GovOfficeTutorial: React.FC = () => {
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
            headerTitle: 'Government Offices',
            headerContent: 'Access a directory of important government offices and cooperative societies in your ward.',
            tabsTitle: 'Directory Sections',
            tabsContent: 'Switch between "Offices" to see government departments and "Cooperative" to find essential service workers.',
            addTitle: 'Add Entry',
            addContent: 'Register a new government office or a service worker to the local directory.',
            searchTitle: 'Quick Find',
            searchContent: 'Search for offices by name, officer, or area. For workers, you can search by name, role, or mobile number.',
            listTitle: 'Office Directory',
            listContent: 'View details like addresses, officer names, and contact numbers. Use the Call button for immediate contact.',
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
            headerTitle: 'सरकारी कार्यालये',
            headerContent: 'तुमच्या प्रभागातील महत्त्वाच्या सरकारी कार्यालयांची आणि सहकारी संस्थांची माहिती येथे मिळवा.',
            tabsTitle: 'डिरेक्टरी विभाग',
            tabsContent: 'सरकारी विभागांसाठी "कार्यालये" आणि आवश्यक सेवा कर्मचाऱ्यांसाठी "सहकारी" यामध्ये स्विच करा.',
            addTitle: 'माहिती जोडा',
            addContent: 'स्थानिक डिरेक्टरीमध्ये नवीन सरकारी कार्यालय किंवा सेवा कर्मचाऱ्याची नोंद करा.',
            searchTitle: 'त्वरीत शोध',
            searchContent: 'नाव, अधिकारी किंवा क्षेत्रानुसार कार्यालये शोधा. कर्मचाऱ्यांसाठी तुम्ही नाव, भूमिका किंवा मोबाईल नंबरनुसार शोधू शकता.',
            listTitle: 'कार्यालय डिरेक्टरी',
            listContent: 'पत्ता, अधिकारी आणि संपर्क क्रमांकासारखे तपशील पहा. त्वरित संपर्कासाठी "कॉल करा" बटण वापरा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-office-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-office-tabs',
            content: t.tabsContent,
            title: t.tabsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-office-add',
            content: t.addContent,
            title: t.addTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-office-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-office-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-office-help',
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

export default GovOfficeTutorial;
