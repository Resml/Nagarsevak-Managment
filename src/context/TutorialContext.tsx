import React, { createContext, useContext, useState, useEffect } from 'react';

interface TutorialContextType {
    runTutorial: boolean;
    startTutorial: () => void;
    stopTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [runTutorial, setRunTutorial] = useState(false);

    // Optional: Auto-start tutorial on first visit (using localStorage)
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('hasSeenDashboardTutorial');
        if (!hasSeenTutorial) {
            // Uncomment to auto-start 
            // setRunTutorial(true); 
            // localStorage.setItem('hasSeenDashboardTutorial', 'true');
        }
    }, []);

    const startTutorial = () => {
        setRunTutorial(true);
    };

    const stopTutorial = () => {
        setRunTutorial(false);
        localStorage.setItem('hasSeenDashboardTutorial', 'true');
    };

    return (
        <TutorialContext.Provider value={{ runTutorial, startTutorial, stopTutorial }}>
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (!context) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
