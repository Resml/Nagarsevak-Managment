import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const VisitorTutorial: React.FC = () => {
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
            headerTitle: 'Visitor Log Management',
            headerContent: 'Welcome to the Visitor Log! Here you can track all citizens, delegates, or officials who visit your office.',
            formTitle: 'Check-in Visitor',
            formContent: 'Quickly record visitor details like Name, Mobile, and Purpose of visit here.',
            voterSearchTitle: 'Voter Lookup',
            voterSearchContent: 'Save time by searching the official Voter List to automatically fill in names and addresses.',
            searchTitle: 'Quick Search',
            searchContent: 'Find previous visitors instantly by searching their name or mobile number.',
            areaTitle: 'Area Filter',
            areaContent: 'Filter visitor logs by specific wards or locations to see where your support is coming from.',
            dateTitle: 'Date Filter',
            dateContent: 'Find logs for specific days or re-examine busy periods using the date filter.',
            viewTitle: 'Display Toggle',
            viewContent: 'Switch between a Grid view of profiles or a Report view for printing and analysis.',
            listTitle: 'Recent Visitors',
            listContent: 'Review all visitors here. You can click on any card to see more details, remarks, or specific requests.',
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
            headerTitle: 'अभ्यागत नोंदवही (Visitor Log)',
            headerContent: 'अभ्यागत नोंदवहीमध्ये आपले स्वागत आहे! येथे तुम्ही तुमच्या कार्यालयाला भेट देणाऱ्या नागरिकांच्या आणि अधिकार्‍यांच्या नोंदी ठेवू शकता.',
            formTitle: 'नवीन नोंद (Check-in)',
            formContent: 'येथे नाव, मोबाईल आणि भेटीचा उद्देश यांसारखा अभ्यागतांचा तपशील त्वरित नोंदवा.',
            voterSearchTitle: 'मतदार यादी शोध',
            voterSearchContent: 'नाव आणि पत्ता आपोआप भरण्यासाठी अधिकृत मतदार यादीतून शोध घेऊन वेळ वाचवा.',
            searchTitle: 'त्वरित शोध',
            searchContent: 'नाव किंवा मोबाईल नंबर टाकून आधीच्या अभ्यागतांच्या नोंदी त्वरित शोधा.',
            areaTitle: 'भागांनुसार फिल्टर',
            areaContent: 'तुमचा पाठिंबा कोणत्या भागातून येत आहे हे पाहण्यासाठी विशिष्ट प्रभाग किंवा ठिकाणांनुसार नोंदी फिल्टर करा.',
            dateTitle: 'तारखेनुसार फिल्टर',
            dateContent: 'विशिष्ट दिवसांच्या नोंदी शोधण्यासाठी किंवा व्यस्त कालावधी तपासण्यासाठी तारीख फिल्टर वापरा.',
            viewTitle: 'प्रदर्शन प्रकार',
            viewContent: 'प्रोफाइल्स पाहण्यासाठी "ग्रीड व्ह्यू" किंवा प्रिंट आणि विश्लेषणासाठी "रिपोर्ट व्ह्यू" मध्ये स्विच करा.',
            listTitle: 'अलीकडील अभ्यागत',
            listContent: 'येथे सर्व अभ्यागतांच्या नोंदी तपासा. अधिक तपशील, शेरे किंवा विशिष्ट विनंत्या पाहण्यासाठी कोणत्याही कार्डवर क्लिक करा.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-visitor-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-visitor-form',
            content: t.formContent,
            title: t.formTitle,
            disableBeacon: true,
            placement: 'right',
        },
        {
            target: '.tutorial-visitor-voter-search',
            content: t.voterSearchContent,
            title: t.voterSearchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-visitor-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-visitor-area',
            content: t.areaContent,
            title: t.areaTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-visitor-date',
            content: t.dateContent,
            title: t.dateTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-visitor-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-visitor-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-visitor-help',
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
                    primaryColor: '#0369a1',
                    textColor: '#334155',
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

export default VisitorTutorial;
