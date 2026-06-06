/**
 * Utility to check if a tenant plan has access to a specific feature key.
 */
export const checkFeatureAccess = (featureKey: string, plan: string): boolean => {
  const normalizedPlan = (plan || 'basic').toLowerCase();

  // Basic Plan Features
  const basicFeatures = [
    'tasks',             // Daily Work Management (रोजचे कामकाज)
    'letters',           // Letter Management (पत्र व्यवहार)
    'visitors',          // Visitor Management (भेट देणारे)
    'complaints',        // Complaint Tracking (तक्रार निवारण)
    'ward_problems',     // Ward Issues Management (प्रभाग समस्या) - Problems
    'ward_info',         // Ward Issues Management (प्रभाग समस्या) - Map
    'work_history',      // Completed Works Tracking (केलेली कामे) - History
    'social',            // Social Media Management
    'voters',            // Voter Search (मतदार शोध)
    'housing_societies', // Society Chairman Directory
    'staff',             // My Team Management (माझी टीम)
    'sms',               // SMS
    'whatsapp',          // WhatsApp
    'whatsapp_call',     // WhatsApp Calling
    'public_comm',       // Group permission
    'profile_settings',  // Profile Settings (accessible on all plans)
    'bot',               // Bot Dashboard / Admin panel
  ];

  // Pro Plan Features (Includes everything in Basic, plus these)
  const proFeatures = [
    'karyakarta_work',      // Karyakarta Work Management (कार्यकर्ता काम व्यवस्थापन)
    'schemes',              // Government Schemes (सरकारी योजना)
    'provision',            // Budget Provisions / Fund Allocation (प्रावधान तरतूद) - Provision
    'ai_content',           // AI Content Studio
    'gallery',              // Photo Gallery
    'results',              // Election Results (निवдणूक निकाल)
    'sadasya',              // Member Registration (सदस्य नोंदणी)
  ];

  // Advanced Plan Features (Includes everything in Basic and Pro, plus these)
  const advanceFeatures = [
    'improvements',         // Completed Works Tracking - Improvements (संभाव्य सुधारणा)
    'gb_register',          // Daily Diary (दैनंदिनी / GB Register)
    'opposition',           // Opposition Info (विरोधी पक्षाची माहिती)
    'social_organizations', // NGO & Mandals Info (एन.जी.ओ., क्रीडा व सार्वजनिक मंडळ माहिती)
    'voter_forms',          // Voter Forms (मतदार नोंदणी अर्ज)
    'budget',               // Budget Provisions / Fund Allocation (प्रावधान तरतूद) - Budget
    'newspaper',            // Newspaper coverage/clipping (वर्तमानपत्र कात्रणे)
    'ai_voice_call',        // AI Voice Call (AI व्हॉइस कॉल)
    'conference_room',      // Conference Room (कॉन्फरन्स रूम)
    'voice_call',           // Voice Call (व्हॉइस कॉल)
    'analysis',             // Advanced Analytics & Reports
    'surveys',              // Survey & Feedback System
    'events',               // Event Management
    'gov_office',           // Government Office / Document Repository
  ];

  // 1. Basic features are accessible to all plans
  if (basicFeatures.includes(featureKey)) {
    return true;
  }

  // 2. Pro features are accessible to Pro and Advanced plans
  if (proFeatures.includes(featureKey)) {
    return normalizedPlan === 'pro' || normalizedPlan === 'advance' || normalizedPlan === 'advanced';
  }

  // 3. Advanced features are only accessible to Advanced plan
  if (advanceFeatures.includes(featureKey)) {
    return normalizedPlan === 'advance' || normalizedPlan === 'advanced';
  }

  // Default: Require Advanced for unspecified premium features
  return normalizedPlan === 'advance' || normalizedPlan === 'advanced';
};
