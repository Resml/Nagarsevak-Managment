export type Role = 'admin' | 'staff' | 'citizen';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string; // acting as username for login
  avatar?: string;
  assignedWard?: string; // For staff restricted to specific wards
}

export type ComplaintType = 'Cleaning' | 'Water' | 'Road' | 'Drainage' | 'StreetLight' | 'Other' | 'Help' | 'Personal Help' | 'Complaint' | 'SelfIdentified';
export type ComplaintStatus = 'Pending' | 'Assigned' | 'InProgress' | 'Resolved' | 'Closed';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  type: ComplaintType;
  status: ComplaintStatus;
  ward: string;
  area?: string;
  location?: string;
  voterId?: string; // Optional link to a specific voter
  voter?: {
    name_english?: string;
    name_marathi?: string;
    epic_no?: string;
    mobile?: string;
  };
  assignedTo?: string; // User ID of staff
  photos: string[]; // URLs type legacy
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  createdAt: string; // ISO Date
  updatedAt: string;
  resolvedAt?: string;
}

export interface Task {
  id: string;
  complaintId: string;
  assignedTo: string; // User ID
  status: 'Pending' | 'Completed';
  dueDate?: string;
  notes: string;
}

export interface Voter {
  id: string;
  name: string;
  name_marathi?: string;
  name_english?: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  address: string;
  address_marathi?: string;
  address_english?: string;
  ward: string;
  booth: string;
  epicNo: string; // Voter ID Card Number
  mobile?: string;
  houseNo?: string;
  history: ServiceRecord[];
}

export interface ServiceRecord {
  id: string; // Usually same as Complaint ID
  title: string;
  date: string;
  status: 'Resolved' | 'Pending'; // Simplified status for history
}

export interface Staff {
  id: string;
  name: string;
  mobile: string;
  role: string;
  keywords: string[];
}

export interface Sadasya {
  id: string;
  name: string;
  name_marathi?: string;
  name_english?: string;
  mobile: string;
  age: number;
  gender?: 'M' | 'F' | 'O';
  ward?: string;
  area?: string;
  address: string;
  address_marathi?: string;
  address_english?: string;
  isVoter: boolean;
  voterId?: string; // Optional, only if isVoter is true
  registeredAt: string;
}

export type MeetingType = 'GB' | 'Standing Committee' | 'Ward Committee' | 'Special GB' | 'Other';
export type DiaryStatus = 'Raised' | 'In Discussion' | 'Resolved' | 'Action Taken';

export interface DiaryEntry {
  id: string;
  meetingDate: string;
  meetingType: MeetingType; // 'GB', 'Standing Committee', 'Ward Committee', 'Special GB', 'Other'
  subject: string;
  description?: string;
  department?: string; // e.g. 'Water', 'Road'
  area?: string;
  status: DiaryStatus;
  response?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type GalleryCategory = 'Event' | 'Work' | 'Award' | 'Newspaper';

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  imageUrl: string;
  description?: string;
  date: string;
  createdAt: string;
}

export interface BudgetRecord {
  id: string;
  financialYear: string;
  category: string;
  totalAllocation: number;
  utilizedAmount: number;
  area?: string;
  status: 'Active' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

export interface AIHistoryItem {
  id: string;
  user_id?: string;
  title: string;
  contentType: string; // Speech, Social Media Caption, etc.
  tone?: string;
  language?: string;
  generatedContent: string;
  messages?: any[]; // For future chat history
  createdAt: string;
}

export interface ElectionResult {
  id: string;
  wardName: string;
  boothNumber: string;
  boothName?: string;
  totalVoters: number;
  totalVotesCasted: number;
  candidateVotes: Record<string, number>;
  winner: string;
  margin: number;
  createdAt: string;
}

// -------------------
// Survey / Sample Survey
// -------------------

export type QuestionType = 'MCQ' | 'YesNo' | 'Rating';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For MCQ (e.g. Choice 1, Choice 2...)
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  area?: string;
  questions: Question[];
  targetSampleSize: number; // calculated as 1% of total voters (or custom)
  status: 'Draft' | 'Active' | 'Closed';
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  voterId?: string; // Optional if anonymous
  answers: Record<string, string | number>; // questionId -> answer
  submittedAt: string;
}
