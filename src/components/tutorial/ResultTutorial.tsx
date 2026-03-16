import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import type { CallBackProps, Step } from 'react-joyride';
import { useTutorial } from '../../context/TutorialContext';
import { useLanguage } from '../../context/LanguageContext';

export const ResultTutorial: React.FC = () => {
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
            headerTitle: 'Result Analytics',
            headerContent: 'Welcome! This page provides a deep dive into election results, booth performance, and vote share analytics.',
            wardTitle: 'Select ward',
            wardContent: 'Switch between different wards to see how candidates performed in specific administrative areas.',
            candidateTitle: 'Analyze Candidates',
            candidateContent: 'Pick a specific candidate to see their detailed performance report, including vote share and booth-wise wins.',
            statsTitle: 'Key Statistics',
            statsContent: 'Get a quick overview of total votes, percentage share, and the number of winning vs losing booths.',
            detailedTitle: 'Booth Performance',
            detailedContent: 'This table shows a booth-by-booth breakdown of every candidate\'s votes. Winning booths are highlighted in green.',
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
            headerTitle: 'निकाल विश्लेषण (Result Analytics)',
            headerContent: 'स्वागत आहे! हे पृष्ठ निवडणुकीच्या निकालांचे, मतदान केंद्रावरील कामगिरीचे आणि मतांच्या टक्केवारीचे सखोल विश्लेषण देते.',
            wardTitle: 'प्रभाग निवडा',
            wardContent: 'विशिष्ट प्रशासकीय क्षेत्रातील उमेदवारांची कामगिरी पाहण्यासाठी वेगवेगळ्या प्रभागांमध्ये स्विच करा.',
            candidateTitle: 'उमेदवारांचे विश्लेषण',
            candidateContent: 'विशिष्ट उमेदवाराचा तपशीलवार कामगिरी अहवाल, मतांचा वाटा आणि केंद्रनिहाय विजय पाहण्यासाठी उमेदवार निवडा.',
            statsTitle: 'प्रमुख आकडेवारी',
            statsContent: 'एकूण मते, मतांची टक्केवारी आणि विजयी विरुद्ध पराभूत मतदान केंद्रांच्या संख्येचा झटपट आढावा घ्या.',
            detailedTitle: 'केंद्रनिहाय कामगिरी',
            detailedContent: 'ही सारणी प्रत्येक उमेदवाराच्या मतांचे केंद्रनिहाय विभाजन दर्शवते. विजयी मतदान केंद्रे हिरव्या रंगात हायलाइट केली आहेत.',
            helpTitle: 'मदत हवी आहे?',
            helpContent: 'हे ट्यूटोरियल पुन्हा सुरू करण्यासाठी कधीही या "मदत" बटणावर क्लिक करा.'
        }
    };

    const t = translations[language as 'en' | 'mr'] || translations.en;

    const steps: Step[] = [
        {
            target: '.tutorial-result-header',
            content: t.headerContent,
            title: t.headerTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-result-ward',
            content: t.wardContent,
            title: t.wardTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-result-candidate',
            content: t.candidateContent,
            title: t.candidateTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-result-stats',
            content: t.statsContent,
            title: t.statsTitle,
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tutorial-result-detailed',
            content: t.detailedContent,
            title: t.detailedTitle,
            disableBeacon: true,
            placement: 'top',
        },
        {
            target: '.tutorial-result-help',
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

export default ResultTutorial;
