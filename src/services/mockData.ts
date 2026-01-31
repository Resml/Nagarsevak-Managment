import { type Complaint, type ComplaintStatus, type User, type Voter, type Sadasya, type Survey, type SurveyResponse } from '../types';

const STORAGE_KEYS = {
    USERS: 'ns_users',
    VOTERS: 'ns_voters',
    COMPLAINTS: 'ns_complaints',
    TASKS: 'ns_tasks',
    CURRENT_USER: 'ns_current_user',
    SADASYA: 'ns_sadasya',
    SURVEYS: 'ns_surveys',
    SURVEY_RESPONSES: 'ns_survey_responses',
};

// Seed Data
const SEED_USERS: User[] = [
    { id: 'u1', name: 'Rajesh Patil (NS)', role: 'admin', email: 'admin@ns.com' },
    { id: 'u2', name: 'Suresh Staff', role: 'staff', email: 'staff@ns.com' },
    { id: 'u3', name: 'Amit Citizen', role: 'citizen', email: 'voter@ns.com' },
];

const SEED_VOTERS: Voter[] = [
    {
        id: 'v1',
        name: 'Ramesh Powar',
        name_marathi: 'रमेश पवार',
        name_english: 'Ramesh Powar',
        age: 45,
        gender: 'M',
        address: 'Flat 101, Ganesh Apts, Ward 12',
        address_marathi: 'फ्लॅट 101, गणेश अपार्टमेंट्स, प्रभाग 12',
        address_english: 'Flat 101, Ganesh Apts, Ward 12',
        ward: '12',
        booth: '45A',
        epicNo: 'MH12345678',
        mobile: '9876543210',
        history: [],
    },
    {
        id: 'v2',
        name: 'Suhasini Deshmukh',
        name_marathi: 'सुहासिनी देशमुख',
        name_english: 'Suhasini Deshmukh',
        age: 38,
        gender: 'F',
        address: 'House 22, Lane 4, Ward 12',
        address_marathi: 'घर 22, लेन 4, प्रभाग 12',
        address_english: 'House 22, Lane 4, Ward 12',
        ward: '12',
        booth: '45B',
        epicNo: 'MH87654321',
        mobile: '9123456789',
        history: [],
    },
    // Add more seed data as needed
];

const SEED_COMPLAINTS: Complaint[] = [
    {
        id: 'c1',
        title: 'Garbage not collected',
        description: 'Garbage van did not come to Ganesh Apts for 2 days.',
        type: 'Cleaning',
        status: 'Pending',
        ward: '12',
        location: 'Ganesh Apts',
        voterId: 'v1',
        photos: [],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
];

// Helper to initialize storage
const initStorage = () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VOTERS)) {
        localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(SEED_VOTERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
        localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(SEED_COMPLAINTS));
    }
};

// Data Access Layer
export const MockService = {
    init: initStorage,

    // Users
    getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return stored ? JSON.parse(stored) : null;
    },
    login: (email: string): User | undefined => {
        // Simple mock login by email matching
        const users = MockService.getUsers();
        const user = users.find((u) => u.email === email);
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
        return user;
    },
    logout: () => {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },

    // Voters
    getVoters: (): Voter[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.VOTERS) || '[]'),
    getVoterById: (id: string): Voter | undefined => {
        const voters = MockService.getVoters();
        return voters.find((v) => v.id === id);
    },

    // Complaints
    getComplaints: (): Complaint[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLAINTS) || '[]'),
    addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => {
        const complaints = MockService.getComplaints();
        const newComplaint: Complaint = {
            ...complaint,
            id: `c${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        complaints.unshift(newComplaint);
        localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
        return newComplaint;
    },
    updateComplaintStatus: (id: string, status: ComplaintStatus) => {
        const complaints = MockService.getComplaints();
        const idx = complaints.findIndex((c) => c.id === id);
        if (idx !== -1) {
            complaints[idx].status = status;
            complaints[idx].updatedAt = new Date().toISOString();
            if (status === 'Resolved' || status === 'Closed') {
                complaints[idx].resolvedAt = new Date().toISOString();
            }
            localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
        }
    },
    assignComplaint: (id: string, staffId: string) => {
        const complaints = MockService.getComplaints();
        const idx = complaints.findIndex((c) => c.id === id);
        if (idx !== -1) {
            complaints[idx].assignedTo = staffId;
            complaints[idx].status = 'Assigned';
            complaints[idx].updatedAt = new Date().toISOString();
            localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
        }
    },

    // Sadasya (Party Members)
    getSadasyas: (): Sadasya[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.SADASYA) || '[]'),

    addSadasya: (sadasya: Omit<Sadasya, 'id' | 'registeredAt'>) => {
        const sadasyas = MockService.getSadasyas();
        const newSadasya: Sadasya = {
            ...sadasya,
            id: Date.now().toString(),
            registeredAt: new Date().toISOString()
        };
        sadasyas.unshift(newSadasya);
        localStorage.setItem(STORAGE_KEYS.SADASYA, JSON.stringify(sadasyas));
        return newSadasya;
    },

    deleteSadasya: (id: string) => {
        const sadasyas = MockService.getSadasyas();
        const filtered = sadasyas.filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.SADASYA, JSON.stringify(filtered));
    },

    updateSadasya: (id: string, updates: Partial<Sadasya>) => {
        const sadasyas = MockService.getSadasyas();
        const idx = sadasyas.findIndex(s => s.id === id);
        if (idx !== -1) {
            sadasyas[idx] = { ...sadasyas[idx], ...updates };
            localStorage.setItem(STORAGE_KEYS.SADASYA, JSON.stringify(sadasyas));
        }
    },

    // Surveys
    getSurveys: (): Survey[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEYS) || '[]'),

    createSurvey: (survey: Omit<Survey, 'id' | 'createdAt'>) => {
        const surveys = MockService.getSurveys();
        const newSurvey: Survey = {
            ...survey,
            id: `s_${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        surveys.unshift(newSurvey);
        localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
        return newSurvey;
    },

    getSurveyById: (id: string): Survey | undefined => {
        const surveys = MockService.getSurveys();
        return surveys.find(s => s.id === id);
    },

    // Survey Responses
    saveSurveyResponse: (response: Omit<SurveyResponse, 'id' | 'submittedAt'>) => {
        const responses: SurveyResponse[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES) || '[]');
        const newResponse: SurveyResponse = {
            ...response,
            id: `sr_${Date.now()}`,
            submittedAt: new Date().toISOString()
        };
        responses.push(newResponse);
        localStorage.setItem(STORAGE_KEYS.SURVEY_RESPONSES, JSON.stringify(responses));
        return newResponse;
    },

    getSurveyResponses: (surveyId: string): SurveyResponse[] => {
        const responses: SurveyResponse[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES) || '[]');
        return responses.filter(r => r.surveyId === surveyId);
    }
};
