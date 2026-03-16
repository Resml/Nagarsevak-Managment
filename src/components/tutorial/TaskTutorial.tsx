import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const TaskTutorial: React.FC = () => {
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
            headerTitle: 'Diary Management',
            headerContent: 'Manage your daily tasks, appointments, and official records here.',
            scanTitle: 'Scan Document',
            scanContent: 'Quickly create tasks by scanning documents or photos using AI.',
            addTitle: 'New Entry',
            addContent: 'Manually add a new task, meeting, or event to your diary.',
            searchTitle: 'Search Records',
            searchContent: 'Find specific entries by title, description, or keywords.',
            areaTitle: 'Area Filter',
            areaContent: 'Filter your diary entries by specific wards or locations.',
            dateTitle: 'Date Filter',
            dateContent: 'Quickly find entries scheduled for specific dates.',
            viewTitle: 'Display Mode',
            viewContent: 'Switch between a Grid view or a professional Report view for printing.',
            listTitle: 'Diary Entries',
            listContent: 'Review and manage all your entries. You can edit, delete, or update their status from here.',
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
            headerTitle: 'दैनंदिनी व्यवस्थापन',
            headerContent: 'तुमची दैनंदिन कामे, भेटीगाठी आणि अधिकृत नोंदी येथे व्यवस्थापित करा.',
            scanTitle: 'कागदपत्र स्कॅन करा',
            scanContent: 'AI वापरून कागदपत्रे किंवा फोटो स्कॅन करून त्वरित नोंदी तयार करा.',
            addTitle: 'नवीन नोंद',
            addContent: 'तुमच्या दैनंदिनीमध्ये नवीन काम, सभा किंवा कार्यक्रम मॅन्युअली जोडा.',
            searchTitle: 'नोंदी शोधा',
            searchContent: 'शीर्षक, वर्णन किंवा कीवर्डनुसार विशिष्ट नोंदी शोधा.',
            areaTitle: 'भागांनुसार फिल्टर',
            areaContent: 'ठराविक प्रभाग किंवा ठिकाणांनुसार तुमच्या नोंदी फिल्टर करा.',
            dateTitle: 'तारखेनुसार फिल्टर',
            dateContent: 'विशिष्ट तारखांसाठी नियोजित असलेल्या नोंदी त्वरित शोधा.',
            viewTitle: 'प्रदर्शन पद्धत',
            viewContent: 'ग्रीड व्ह्यू किंवा प्रिंट करण्यासाठी प्रोफेशन रिपोर्ट व्ह्यू दरम्यान स्विच करा.',
            listTitle: 'दैनंदिनीतील नोंदी',
            listContent: 'तुमच्या सर्व नोंदी तपासा आणि व्यवस्थापित करा. येथून तुम्ही नोंदी संपादित करू शकता, हटवू शकता किंवा त्यांची स्थिती (Status) अपडेट करू शकता.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-task-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-task-scan',
            content: t.scanContent,
            title: t.scanTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-task-add',
            content: t.addContent,
            title: t.addTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-task-search',
            content: t.searchContent,
            title: t.searchTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-task-area',
            content: t.areaContent,
            title: t.areaTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-task-date',
            content: t.dateContent,
            title: t.dateTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-task-view',
            content: t.viewContent,
            title: t.viewTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-task-list',
            content: t.listContent,
            title: t.listTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-task-help',
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

export default TaskTutorial;
