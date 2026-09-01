import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, 
    Download, 
    Printer, 
    Globe, 
    ArrowLeft, 
    Check, 
    Plus, 
    Trash2, 
    Info, 
    Briefcase, 
    ShieldCheck, 
    Sparkles, 
    MessageSquare,
    DollarSign,
    User,
    Building2,
    MapPin,
    Calendar,
    Phone,
    PlusCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { CustomSelect } from '../../components/common/CustomSelect';

interface FeatureItem {
    id: string;
    textEn: string;
    textMr: string;
    checked: boolean;
    category: 'basic' | 'pro' | 'advanced';
}

const DEFAULT_FEATURES: FeatureItem[] = [
    // Basic
    { id: 'feat_voter_search', textEn: 'Voter Search System (EPIC, Name, House No)', textMr: 'मतदार शोध प्रणाली (नाव, ओळखपत्र क्र., घर क्र. नुसार)', checked: true, category: 'basic' },
    { id: 'feat_booth_reports', textEn: 'Booth-wise Voter Reports & Statistics', textMr: 'बूथनिहाय मतदार यादी आणि सांख्यिकी अहवाल', checked: true, category: 'basic' },
    { id: 'feat_visitor_log', textEn: 'Ward Office Visitor Log & Management', textMr: 'कार्यालयीन भेट नोंदणी आणि व्यवस्थापन', checked: true, category: 'basic' },
    { id: 'feat_complaints', textEn: 'Citizen Complaint & Grievance Registration', textMr: 'नागरी तक्रार आणि निवारण प्रणाली', checked: true, category: 'basic' },
    { id: 'feat_sms_basic', textEn: 'Basic SMS Broadcast Integration', textMr: 'साधी एसएमएस प्रसारण प्रणाली', checked: true, category: 'basic' },
    { id: 'feat_ward_problems', textEn: 'Ward-wise Problem List Tracking', textMr: 'वॉर्डनिहाय प्रलंबित समस्या आणि कामांचा मागोवा', checked: true, category: 'basic' },
    
    // Pro
    { id: 'feat_wa_multi', textEn: 'WhatsApp Multi-Agent Dashboard', textMr: 'व्हॉट्सॲप मल्टी-एजंट डॅशबोर्ड (स्टाफ चॅट)', checked: false, category: 'pro' },
    { id: 'feat_surveys', textEn: 'Survey & Polling System with Analytics', textMr: 'मतदार पाहणी आणि ऑनलाइन सर्व्हेक्षण विश्लेषण', checked: false, category: 'pro' },
    { id: 'feat_events', textEn: 'Event & Invitations (RSVP Management)', textMr: 'कार्यक्रम नियोजन आणि आमंत्रण (RSVP व्यवस्थापन)', checked: false, category: 'pro' },
    { id: 'feat_budget', textEn: 'Ward Budget & Utilisation Tracker', textMr: 'वॉर्ड विकास निधी आणि बजेट नियोजन मागोवा', checked: false, category: 'pro' },
    { id: 'feat_media', textEn: 'Newspaper & Media Tracking Dashboard', textMr: 'वृत्तपत्र आणि प्रसारमाध्यमे प्रसिद्धी मागोवा', checked: false, category: 'pro' },
    { id: 'feat_content', textEn: 'AI Content Studio (Social Media Writer)', textMr: 'एआय कंटेंट स्टुडिओ (सोशल मीडिया लेखन सहाय्य)', checked: false, category: 'pro' },
    
    // Advanced
    { id: 'feat_wa_bot', textEn: 'AI WhatsApp Bot (24/7 Automated Responses)', textMr: '२४/७ स्वयंचलित एआय व्हॉट्सॲप चॅटबॉट', checked: false, category: 'advanced' },
    { id: 'feat_ai_calls', textEn: 'AI Voice Broadcasts (Interactive Robocalls)', textMr: 'एआय व्हॉईस कॉल (स्वयंचलित मतदार संवाद कॉल)', checked: false, category: 'advanced' },
    { id: 'feat_subdomain', textEn: 'Custom Subdomain Deployment (e.g., name.krishnaniti.in)', textMr: 'स्वतंत्र सबडोमेन (उदा. नाव.krishnaniti.in)', checked: false, category: 'advanced' },
    { id: 'feat_staff_roles', textEn: 'Multi-device Staff Logins & Audit Logs', textMr: 'अनेक कर्मचारी लॉगिन आणि सुरक्षा ऑडिट लॉग्स', checked: false, category: 'advanced' },
    { id: 'feat_manager', textEn: 'Dedicated Account Manager & Professional Training', textMr: 'समर्पित सपोर्ट मॅनेजर आणि व्यावसायिक प्रशिक्षण', checked: false, category: 'advanced' },
];

const DEFAULT_TERMS_EN = [
    'Subscription charges are billed in advance according to the selected billing cycle.',
    'Setup and onboarding fees are one-time charges payable at the time of deployment.',
    'WhatsApp API transmission and SMS charges will be billed separately based on actual usage.',
    'Standard service uptime SLA is 99.9% with server backup completed every 24 hours.',
    'All citizen and voter data is secured with enterprise-grade encryption and tenant isolation.',
    'Any custom code feature requests will be charged separately after evaluation.'
];

const DEFAULT_TERMS_MR = [
    'निवडलेल्या बिलिंग चक्रानुसार वर्गणीचे शुल्क आगाऊ (In Advance) देय असेल.',
    'सेटअप आणि ऑनबोर्डिंग फी ही वन-टाइम फी असून ती सिस्टीम सुरू करताना देय असेल.',
    'व्हॉट्सॲप API आणि एसएमएस चार्जेस प्रत्यक्ष वापरानुसार स्वतंत्रपणे आकारले जातील.',
    'सर्व्हरची उपलब्धता ९९.९% SLA सह असेल आणि दर २४ तासांनी डेटा बॅकअप घेतला जाईल.',
    'सर्व मतदार आणि नागरिक डेटा सुरक्षित कूटबद्धीकरणासह (Encryption) पूर्णपणे सुरक्षित असेल.',
    'आवश्यकतेनुसार अतिरिक्त कस्टमाइज्ड फीचर्ससाठी स्वतंत्र शुल्क आकारले जाईल.'
];

const SalesProposalGenerator = () => {
    const navigate = useNavigate();
    const { language: currentAppLang } = useLanguage();
    
    // Proposal language can be independent of app language
    const [propLang, setPropLang] = useState<'en' | 'mr'>('mr');
    const [activeTab, setActiveTab] = useState<'info' | 'plan' | 'letter' | 'terms'>('info');

    // Corporate info
    const [corpName, setCorpName] = useState('Krishnaniti Software Solutions');
    const [corpTaglineEn, setCorpTaglineEn] = useState('Electoral Intelligence & Representative Management Suite');
    const [corpTaglineMr, setCorpTaglineMr] = useState('डिजिटल निवडणूक आणि लोकप्रतिनिधी जनसंपर्क व्यवस्थापन प्रणाली');
    const [corpEmail, setCorpEmail] = useState('sales@krishnaniti.in');
    const [corpPhone, setCorpPhone] = useState('+91 91584 94949');
    const [corpWebsite, setCorpWebsite] = useState('www.krishnaniti.in');
    const [corpAddress, setCorpAddress] = useState('Pune, Maharashtra, India');

    // Client Info
    const [clientName, setClientName] = useState('Hon. Rajesh Patil');
    const [clientRole, setClientRole] = useState<'nagarsevak' | 'amdar' | 'khasdar' | 'minister' | 'custom'>('nagarsevak');
    const [clientRoleCustomEn, setClientRoleCustomEn] = useState('Municipal Corporator');
    const [clientRoleCustomMr, setClientRoleCustomMr] = useState('नगरसेवक (महानगरपालिका)');
    const [clientConstituency, setClientConstituency] = useState('Ward No. 12, Kothrud');
    const [clientCity, setClientCity] = useState('Pune');
    const [clientParty, setClientParty] = useState('Shiv Sena / BJP');
    const [clientMobile, setClientMobile] = useState('+91 98810 XXXXX');

    // Subscription & Plan details
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'advanced' | 'custom'>('pro');
    const [monthlyFee, setMonthlyFee] = useState('12000');
    const [setupFee, setSetupFee] = useState('15000');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [offerValidityDays, setOfferValidityDays] = useState('30');
    const [customPlanNameEn, setCustomPlanNameEn] = useState('Premium Bundle');
    const [customPlanNameMr, setCustomPlanNameMr] = useState('प्रीमियम पॅकेज');

    // Features
    const [features, setFeatures] = useState<FeatureItem[]>(DEFAULT_FEATURES);
    
    // Terms & Conditions
    const [termsEn, setTermsEn] = useState<string[]>(DEFAULT_TERMS_EN);
    const [termsMr, setTermsMr] = useState<string[]>(DEFAULT_TERMS_MR);
    const [newTerm, setNewTerm] = useState('');

    // Letter Content
    const [subjectEn, setSubjectEn] = useState('Proposal for Deployment of Krishnaniti Digital Management & Communication System');
    const [subjectMr, setSubjectMr] = useState('कृष्णनीती डिजिटल व्यवस्थापन आणि मतदार जनसंपर्क प्रणाली सुरू करणेबाबत प्रस्ताव');

    const [letterIntroEn, setLetterIntroEn] = useState(
        "Respected Sir/Madam,\n\nWe are pleased to submit this commercial proposal for the deployment of 'Krishnaniti' — a state-of-the-art Electoral Intelligence and Representative Office Management System. Our platform is specifically designed to help political leaders effectively manage citizen complaints, digitize daily office operations, build deep connections with voters, and execute targeted public campaigns."
    );
    const [letterIntroMr, setLetterIntroMr] = useState(
        "आदरणीय महोदय / महोदया,\n\nआपल्या मतदारसंघामध्ये कार्यालयीन कामकाज डिजिटल करण्यासाठी, नागरिकांच्या समस्यांचे प्रभावीपणे निवारण करण्यासाठी आणि मतदारांशी थेट संपर्क प्रस्थापित करण्यासाठी 'कृष्णनीती' डिजिटल मॅनेजमेंट आणि जनसंपर्क प्रणाली कार्यान्वित करण्याचा व्यावसायिक प्रस्ताव सादर करताना आम्हाला आनंद होत आहे. ही प्रणाली लोकप्रतिनिधींचे कार्यालयीन कार्य सुलभ आणि लोकाभिमुख करण्यासाठी अत्यंत उपयुक्त आहे."
    );

    const [letterConclusionEn, setLetterConclusionEn] = useState(
        "We are confident that Krishnaniti will serve as an invaluable asset in streamlining your public services and political strategy. We look forward to partnering with you to empower your leadership.\n\nSincerely,"
    );
    const [letterConclusionMr, setLetterConclusionMr] = useState(
        "आम्हाला पूर्ण विश्वास आहे की, आपल्या मतदारसंघातील जनसंपर्क आणि विकासकामांचा मागोवा घेण्यासाठी 'कृष्णनीती' प्रणाली अत्यंत मोलाची भूमिका बजावेल. आपल्या नेतृत्वाला अधिक बळकट करण्यासाठी आम्ही आपल्यासोबत भागीदारी करण्यास उत्सुक आहोत.\n\nआपला नम्र,"
    );

    const previewRef = useRef<HTMLDivElement>(null);

    // Apply features automatically when plan changes
    useEffect(() => {
        if (selectedPlan === 'basic') {
            setMonthlyFee('5000');
            setSetupFee('10000');
            setFeatures(prev => prev.map(f => ({
                ...f,
                checked: f.category === 'basic'
            })));
        } else if (selectedPlan === 'pro') {
            setMonthlyFee('12000');
            setSetupFee('15000');
            setFeatures(prev => prev.map(f => ({
                ...f,
                checked: f.category === 'basic' || f.category === 'pro'
            })));
        } else if (selectedPlan === 'advanced') {
            setMonthlyFee('25000');
            setSetupFee('30000');
            setFeatures(prev => prev.map(f => ({
                ...f,
                checked: true
            })));
        }
    }, [selectedPlan]);

    const handleFeatureToggle = (id: string) => {
        setFeatures(prev => prev.map(f => f.id === id ? { ...f, checked: !f.checked } : f));
    };

    const addCustomTerm = () => {
        if (!newTerm.trim()) return;
        if (propLang === 'en') {
            setTermsEn(prev => [...prev, newTerm.trim()]);
        } else {
            setTermsMr(prev => [...prev, newTerm.trim()]);
        }
        setNewTerm('');
        toast.success(propLang === 'mr' ? 'अट यशस्वीरित्या जोडली गेली' : 'Term added successfully');
    };

    const deleteTerm = (index: number) => {
        if (propLang === 'en') {
            setTermsEn(prev => prev.filter((_, i) => i !== index));
        } else {
            setTermsMr(prev => prev.filter((_, i) => i !== index));
        }
    };

    const getPlanName = () => {
        if (selectedPlan === 'basic') return propLang === 'mr' ? 'मूलभूत योजना (Basic Plan)' : 'Basic Plan';
        if (selectedPlan === 'pro') return propLang === 'mr' ? 'व्यावसायिक योजना (Pro Plan)' : 'Pro Plan';
        if (selectedPlan === 'advanced') return propLang === 'mr' ? 'प्रगत योजना (Advanced Plan)' : 'Advanced Plan';
        return propLang === 'mr' ? customPlanNameMr : customPlanNameEn;
    };

    const getClientDesignation = () => {
        if (clientRole === 'nagarsevak') return propLang === 'mr' ? 'नगरसेवक / नगरसेविका' : 'Municipal Corporator';
        if (clientRole === 'amdar') return propLang === 'mr' ? 'आमदार (MLA)' : 'Member of Legislative Assembly (MLA)';
        if (clientRole === 'khasdar') return propLang === 'mr' ? 'खासदार (MP)' : 'Member of Parliament (MP)';
        if (clientRole === 'minister') return propLang === 'mr' ? 'माननीय मंत्री महोदय' : 'Honorable Cabinet Minister';
        return propLang === 'mr' ? clientRoleCustomMr : clientRoleCustomEn;
    };

    const getBillingCycleText = () => {
        if (billingCycle === 'monthly') return propLang === 'mr' ? 'मासिक शुल्क' : 'Monthly Fee';
        if (billingCycle === 'quarterly') return propLang === 'mr' ? 'त्रैमासिक शुल्क' : 'Quarterly Fee';
        return propLang === 'mr' ? 'वार्षिक शुल्क' : 'Yearly Fee';
    };

    // Print functionality
    const handlePrint = () => {
        window.print();
    };

    // PDF Download using html2canvas and jsPDF
    const handleDownloadPDF = async () => {
        if (!previewRef.current) return;
        
        toast.loading(propLang === 'mr' ? 'पीडीएफ तयार होत आहे...' : 'Generating PDF...', { id: 'pdf-gen' });
        
        try {
            const element = previewRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 794, // Standard A4 width pixel equivalent
            });

            const imgData = canvas.toDataURL('image/png');
            
            // A4 dimensions in mm: 210 x 297
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Handle multi-page PDFs if the content extends beyond one A4 page
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Krishnaniti_Proposal_${clientName.replace(/\s+/g, '_')}.pdf`);
            toast.success(propLang === 'mr' ? 'पीडीएफ डाउनलोड पूर्ण!' : 'PDF downloaded successfully!', { id: 'pdf-gen' });
        } catch (error) {
            console.error('PDF generation failed', error);
            toast.error(propLang === 'mr' ? 'पीडीएफ डाउनलोड अयशस्वी.' : 'PDF generation failed.', { id: 'pdf-gen' });
        }
    };

    const activeTerms = propLang === 'en' ? termsEn : termsMr;
    const activeSubject = propLang === 'en' ? subjectEn : subjectMr;
    const activeIntro = propLang === 'en' ? letterIntroEn : letterIntroMr;
    const activeConclusion = propLang === 'en' ? letterConclusionEn : letterConclusionMr;
    const activeTagline = propLang === 'en' ? corpTaglineEn : corpTaglineMr;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Styles for print media */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-proposal-preview, #print-proposal-preview * {
                        visibility: visible;
                    }
                    #print-proposal-preview {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                }
            `}</style>

            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm notranslate">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-all border border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-brand-700" />
                            {propLang === 'mr' ? 'प्रस्ताव लेटरहेड निर्माता' : 'Sales Proposal Letterhead'}
                        </h1>
                        <p className="text-xs text-slate-500">
                            {propLang === 'mr' ? 'कृष्णनीती सॉफ्टवेअर विक्री आणि मासिक सबस्क्रिप्शन शुल्क प्रस्तावासाठी' : 'For selling Krishnaniti software with monthly subscription charges'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Language Toggle */}
                    <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/50 flex">
                        <button
                            onClick={() => setPropLang('en')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${propLang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Globe className="w-3.5 h-3.5" /> English
                        </button>
                        <button
                            onClick={() => setPropLang('mr')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${propLang === 'mr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Globe className="w-3.5 h-3.5" /> मराठी
                        </button>
                    </div>

                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Printer className="w-4 h-4" /> 
                        {propLang === 'mr' ? 'प्रिंट काढा' : 'Print'}
                    </button>

                    <button 
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        {propLang === 'mr' ? 'पीडीएफ डाउनलोड' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Control Panel (Left 5 cols) */}
                <div className="lg:col-span-5 space-y-6 notranslate">
                    
                    {/* Navigation Tabs */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200/50 flex shadow-sm">
                        {[
                            { id: 'info', label: propLang === 'mr' ? 'माहिती' : 'Client Info' },
                            { id: 'plan', label: propLang === 'mr' ? 'शुल्क व पॅकेज' : 'Plan & Price' },
                            { id: 'letter', label: propLang === 'mr' ? 'पत्राचा मजकूर' : 'Letter Text' },
                            { id: 'terms', label: propLang === 'mr' ? 'अटी व शर्ती' : 'Terms' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        
                        {/* TAB 1: CLIENT INFO */}
                        {activeTab === 'info' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                                    {propLang === 'mr' ? 'क्लायंट (लोकप्रतिनिधी) तपशील' : 'Client Representative Info'}
                                </h2>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'नाव (उदा. मा. राजेश पाटील)' : 'Client Name'}</label>
                                    <input 
                                        type="text" 
                                        className="ns-input bg-slate-50/50 w-full"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'पद / पदभार वर्गवारी' : 'Designation Category'}</label>
                                    <CustomSelect
                                        className="ns-input bg-slate-50/50 w-full"
                                        value={clientRole}
                                        onChange={e => setClientRole(e.target.value as any)}
                                    >
                                        <option value="nagarsevak">{propLang === 'mr' ? 'नगरसेवक / Corporator' : 'Municipal Corporator'}</option>
                                        <option value="amdar">{propLang === 'mr' ? 'आमदार / MLA' : 'Member of Legislative Assembly (MLA)'}</option>
                                        <option value="khasdar">{propLang === 'mr' ? 'खासदार / MP' : 'Member of Parliament (MP)'}</option>
                                        <option value="minister">{propLang === 'mr' ? 'मंत्री / Cabinet Minister' : 'Cabinet Minister'}</option>
                                        <option value="custom">{propLang === 'mr' ? 'इतर सानुकूल / Custom Role' : 'Custom Designation'}</option>
                                    </CustomSelect>
                                </div>

                                {clientRole === 'custom' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">English Role</label>
                                            <input 
                                                type="text" 
                                                className="ns-input bg-slate-50/50 w-full"
                                                value={clientRoleCustomEn}
                                                onChange={e => setClientRoleCustomEn(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">मराठी पद</label>
                                            <input 
                                                type="text" 
                                                className="ns-input bg-slate-50/50 w-full"
                                                value={clientRoleCustomMr}
                                                onChange={e => setClientRoleCustomMr(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'वॉर्ड किंवा मतदारसंघाचे नाव' : 'Ward / Constituency'}</label>
                                    <input 
                                        type="text" 
                                        className="ns-input bg-slate-50/50 w-full"
                                        value={clientConstituency}
                                        onChange={e => setClientConstituency(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'शहर / तालुका' : 'City'}</label>
                                        <input 
                                            type="text" 
                                            className="ns-input bg-slate-50/50 w-full"
                                            value={clientCity}
                                            onChange={e => setClientCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'राजकीय पक्ष' : 'Political Party'}</label>
                                        <input 
                                            type="text" 
                                            className="ns-input bg-slate-50/50 w-full"
                                            value={clientParty}
                                            onChange={e => setClientParty(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'भ्रमणध्वनी (Mobile)' : 'Mobile Number'}</label>
                                        <input 
                                            type="text" 
                                            className="ns-input bg-slate-50/50 w-full"
                                            value={clientMobile}
                                            onChange={e => setClientMobile(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'प्रस्ताव वैधता (दिवस)' : 'Validity Days'}</label>
                                        <input 
                                            type="number" 
                                            className="ns-input bg-slate-50/50 w-full"
                                            value={offerValidityDays}
                                            onChange={e => setOfferValidityDays(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: PLANS & PRICES */}
                        {activeTab === 'plan' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                                    {propLang === 'mr' ? 'सबस्क्रिप्शन पॅकेज आणि किमती' : 'Subscription Plans & Pricing'}
                                </h2>

                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'basic', label: propLang === 'mr' ? 'बेसिक / Basic' : 'Basic Plan' },
                                        { id: 'pro', label: propLang === 'mr' ? 'प्रो / Pro' : 'Pro Plan' },
                                        { id: 'advanced', label: propLang === 'mr' ? 'अडव्हान्स / Advance' : 'Advanced Plan' },
                                        { id: 'custom', label: propLang === 'mr' ? 'सानुकूल / Custom' : 'Custom Plan' },
                                    ].map(planOption => (
                                        <button
                                            key={planOption.id}
                                            onClick={() => setSelectedPlan(planOption.id as any)}
                                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${selectedPlan === planOption.id ? 'border-brand-600 bg-brand-50/50 text-brand-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {planOption.label}
                                        </button>
                                    ))}
                                </div>

                                {selectedPlan === 'custom' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">Plan Name (En)</label>
                                            <input 
                                                type="text" 
                                                className="ns-input bg-slate-50/50 w-full"
                                                value={customPlanNameEn}
                                                onChange={e => setCustomPlanNameEn(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500">योजनेचे नाव (मराठी)</label>
                                            <input 
                                                type="text" 
                                                className="ns-input bg-slate-50/50 w-full"
                                                value={customPlanNameMr}
                                                onChange={e => setCustomPlanNameMr(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">
                                            {propLang === 'mr' ? 'मासिक सबस्क्रिप्शन शुल्क (₹)' : 'Monthly Subscription Fee (₹)'}
                                        </label>
                                        <input 
                                            type="number" 
                                            className="ns-input bg-slate-50/50 w-full font-bold"
                                            value={monthlyFee}
                                            onChange={e => setMonthlyFee(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500">
                                            {propLang === 'mr' ? 'वन-टाइम सेटअप शुल्क (₹)' : 'One-time Setup Fee (₹)'}
                                        </label>
                                        <input 
                                            type="number" 
                                            className="ns-input bg-slate-50/50 w-full font-bold"
                                            value={setupFee}
                                            onChange={e => setSetupFee(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'बिलिंग चक्र (Billing Cycle)' : 'Billing Cycle'}</label>
                                    <CustomSelect
                                        className="ns-input bg-slate-50/50 w-full"
                                        value={billingCycle}
                                        onChange={e => setBillingCycle(e.target.value as any)}
                                    >
                                        <option value="monthly">{propLang === 'mr' ? 'मासिक / Monthly' : 'Monthly'}</option>
                                        <option value="quarterly">{propLang === 'mr' ? 'त्रैमासिक / Quarterly' : 'Quarterly'}</option>
                                        <option value="yearly">{propLang === 'mr' ? 'वार्षिक / Yearly' : 'Yearly'}</option>
                                    </CustomSelect>
                                </div>

                                {/* Included Features Checklist */}
                                <div className="space-y-3 pt-2">
                                    <label className="text-xs font-bold text-slate-700 block border-b border-slate-100 pb-1">
                                        {propLang === 'mr' ? 'प्रस्तावात समाविष्ट असणारे फीचर्स:' : 'Included Features:'}
                                    </label>
                                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-2">
                                        {features.map((feat) => (
                                            <label 
                                                key={feat.id}
                                                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-all border border-slate-100"
                                            >
                                                <input 
                                                    type="checkbox"
                                                    className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300"
                                                    checked={feat.checked}
                                                    onChange={() => handleFeatureToggle(feat.id)}
                                                />
                                                <div className="text-xs text-slate-700">
                                                    <span className="font-semibold text-[10px] uppercase block mb-0.5 text-slate-400">
                                                        {feat.category}
                                                    </span>
                                                    {propLang === 'en' ? feat.textEn : feat.textMr}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: LETTER CONTENT */}
                        {activeTab === 'letter' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                                    {propLang === 'mr' ? 'प्रस्ताव पत्राचा मजकूर' : 'Proposal Letter Content'}
                                </h2>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'पत्राचा विषय' : 'Letter Subject'}</label>
                                    <input 
                                        type="text"
                                        className="ns-input bg-slate-50/50 w-full text-xs font-semibold"
                                        value={propLang === 'en' ? subjectEn : subjectMr}
                                        onChange={e => {
                                            if (propLang === 'en') setSubjectEn(e.target.value);
                                            else setSubjectMr(e.target.value);
                                        }}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'प्रस्ताव पत्र प्रस्तावना (Introduction)' : 'Letter Introduction'}</label>
                                    <textarea
                                        rows={6}
                                        className="ns-input bg-slate-50/50 w-full text-xs leading-relaxed"
                                        value={propLang === 'en' ? letterIntroEn : letterIntroMr}
                                        onChange={e => {
                                            if (propLang === 'en') setLetterIntroEn(e.target.value);
                                            else setLetterIntroMr(e.target.value);
                                        }}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">{propLang === 'mr' ? 'पत्र समारोप (Conclusion)' : 'Letter Conclusion'}</label>
                                    <textarea
                                        rows={4}
                                        className="ns-input bg-slate-50/50 w-full text-xs leading-relaxed"
                                        value={propLang === 'en' ? letterConclusionEn : letterConclusionMr}
                                        onChange={e => {
                                            if (propLang === 'en') setLetterConclusionEn(e.target.value);
                                            else setLetterConclusionMr(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 4: TERMS & CONDITIONS */}
                        {activeTab === 'terms' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                                    {propLang === 'mr' ? 'नियम आणि अटी' : 'Terms & Conditions'}
                                </h2>

                                <div className="space-y-3">
                                    {activeTerms.map((term, index) => (
                                        <div key={index} className="flex gap-2.5 items-start justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-xs text-slate-700 leading-normal flex-1">
                                                {index + 1}. {term}
                                            </span>
                                            <button
                                                onClick={() => deleteTerm(index)}
                                                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                                                title="Delete Term"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    <label className="text-xs font-bold text-slate-700">
                                        {propLang === 'mr' ? 'नवीन अट जोडा:' : 'Add Custom Term:'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={propLang === 'mr' ? 'उदा. व्हॉट्सॲप मेसेज शुल्क वेगळे असेल.' : 'e.g. WhatsApp message charges extra.'}
                                            className="ns-input bg-slate-50/50 flex-1 text-xs"
                                            value={newTerm}
                                            onChange={e => setNewTerm(e.target.value)}
                                        />
                                        <button
                                            onClick={addCustomTerm}
                                            className="px-3 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1 shrink-0"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* A4 Document Live Preview Panel (Right 7 cols) */}
                <div className="lg:col-span-7 flex flex-col items-center">
                    
                    {/* Floating Info */}
                    <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-3 px-2 notranslate">
                        <span>{propLang === 'mr' ? 'A4 प्रिंट लेआउट पूर्वावलोकन (Preview)' : 'A4 Print Layout Preview'}</span>
                        <span className="flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            {propLang === 'mr' ? 'प्रिंट आणि डाउनलोड करण्यासाठी हाच लेआउट वापरला जाईल' : 'This exact page format will be generated as PDF'}
                        </span>
                    </div>

                    {/* Styled A4 Container */}
                    <div 
                        id="print-proposal-preview"
                        ref={previewRef}
                        className="w-[794px] min-h-[1123px] bg-white border border-slate-200/80 shadow-2xl p-[48px_60px] flex flex-col justify-between box-border rounded-xl origin-top"
                        style={{ transform: 'scale(1)', transformOrigin: 'top center' }}
                    >
                        {/* 1. Header (Letterhead styling) */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                {/* Corporate Logo & Branding */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-lg">
                                            K
                                        </div>
                                        <span className="font-extrabold text-slate-950 text-xl tracking-tight">
                                            {corpName}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-indigo-600/90 tracking-wide uppercase">
                                        {activeTagline}
                                    </p>
                                </div>

                                {/* Contact Grid */}
                                <div className="text-right text-[10px] text-slate-500 space-y-0.5 font-medium leading-relaxed">
                                    <p className="font-semibold text-slate-800">{corpWebsite}</p>
                                    <p>{corpEmail}</p>
                                    <p>{corpPhone}</p>
                                    <p>{corpAddress}</p>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="h-1 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-600 rounded-full" />
                        </div>

                        {/* 2. Proposal Body */}
                        <div className="flex-1 mt-6 space-y-5">
                            
                            {/* Date, Ref, and Client Info */}
                            <div className="flex justify-between items-start text-xs text-slate-700">
                                <div>
                                    <p className="font-bold text-slate-900">{propLang === 'mr' ? 'प्रति,' : 'To,'}</p>
                                    <p className="font-bold text-slate-950 mt-1">{clientName}</p>
                                    <p className="text-slate-600 font-semibold">{getClientDesignation()}</p>
                                    <p className="text-slate-500">{clientConstituency}, {clientCity}</p>
                                    {clientParty && <p className="text-slate-400 text-[10px] font-bold uppercase">{clientParty}</p>}
                                </div>
                                <div className="text-right text-[11px] font-semibold text-slate-500 space-y-0.5">
                                    <p><span className="text-slate-400">Date:</span> {format(new Date(), 'dd/MM/yyyy')}</p>
                                    <p><span className="text-slate-400">Ref:</span> KN-{format(new Date(), 'yyyy-MM-dd')}-01</p>
                                    <p><span className="text-slate-400">Validity:</span> {offerValidityDays} Days</p>
                                </div>
                            </div>

                            {/* Subject Line */}
                            <div className="bg-slate-50 border-l-4 border-slate-900 p-2.5 rounded-r-lg">
                                <p className="text-xs text-slate-900 font-bold leading-normal">
                                    {propLang === 'mr' ? 'विषय:' : 'Subject:'} <span className="underline decoration-slate-400">{activeSubject}</span>
                                </p>
                            </div>

                            {/* Opening letter */}
                            <p className="text-xs text-slate-700 leading-relaxed white-space-pre-wrap">
                                {activeIntro}
                            </p>

                            {/* Commercial Summary Table */}
                            <div className="space-y-2">
                                <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1">
                                    <DollarSign className="w-4 h-4 text-slate-800" />
                                    {propLang === 'mr' ? 'व्यावसायिक अटी आणि सबस्क्रिप्शन फी:' : 'Commercial Pricing Details:'}
                                </h3>

                                <div className="grid grid-cols-3 gap-4 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50/20">
                                    {/* Setup Fee */}
                                    <div className="p-3 text-center border-r border-slate-200">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            {propLang === 'mr' ? 'सेटअप व ऑनबोर्डिंग फी' : 'One-Time Setup Fee'}
                                        </span>
                                        <p className="text-lg font-black text-slate-950 mt-1">
                                            ₹{parseFloat(setupFee).toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            {propLang === 'mr' ? 'फक्त एकदाच देय' : 'One-time investment'}
                                        </span>
                                    </div>

                                    {/* Monthly Fee */}
                                    <div className="p-3 text-center border-r border-slate-200">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            {getBillingCycleText()}
                                        </span>
                                        <p className="text-lg font-black text-indigo-700 mt-1">
                                            ₹{parseFloat(monthlyFee).toLocaleString('en-IN')}
                                        </p>
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            {propLang === 'mr' ? 'निवडलेल्या योजनेनुसार' : 'As per subscription'}
                                        </span>
                                    </div>

                                    {/* Selected Plan */}
                                    <div className="p-3 text-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            {propLang === 'mr' ? 'निवडलेले पॅकेज' : 'Selected Plan'}
                                        </span>
                                        <p className="text-xs font-bold text-slate-800 mt-2 truncate max-w-full">
                                            {getPlanName()}
                                        </p>
                                        <span className="text-[9px] text-slate-400 font-bold">
                                            {propLang === 'mr' ? 'फीचर्स समाविष्ट' : 'Features bundled'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Features list */}
                            <div className="space-y-2">
                                <h3 className="text-[13px] font-bold text-slate-900 border-b border-slate-100 pb-1">
                                    {propLang === 'mr' ? 'प्रस्तावात समाविष्ट असणारे फीचर्स:' : 'Included Software Features:'}
                                </h3>

                                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                    {features.filter(f => f.checked).map((feat) => (
                                        <div key={feat.id} className="flex items-start gap-1.5 text-xs text-slate-700">
                                            <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                                            <span>
                                                {propLang === 'en' ? feat.textEn : feat.textMr}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Terms of Service */}
                            {activeTerms.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <h3 className="text-[13px] font-bold text-slate-900 border-b border-slate-100 pb-1">
                                        {propLang === 'mr' ? 'नियम आणि अटी:' : 'Terms & Conditions:'}
                                    </h3>
                                    <ul className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed pl-1">
                                        {activeTerms.map((term, index) => (
                                            <li key={index} className="pl-1">
                                                {term}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Conclusion */}
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pt-2">
                                {activeConclusion}
                            </p>
                        </div>

                        {/* 3. Signature Grid */}
                        <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 gap-12 text-xs text-slate-700">
                            <div>
                                <p className="font-semibold text-slate-500 uppercase tracking-wide text-[9px] mb-8">
                                    {propLang === 'mr' ? 'ग्राहकाची सही व शिक्का (कस्टमर)' : 'Accepted & Confirmed by Client'}
                                </p>
                                <div className="h-12 border-b border-dashed border-slate-300 w-48 mb-2" />
                                <p className="font-bold text-slate-800">{clientName}</p>
                                <p className="text-[10px] text-slate-500">{getClientDesignation()}</p>
                            </div>

                            <div className="text-right flex flex-col items-end">
                                <p className="font-semibold text-slate-500 uppercase tracking-wide text-[9px] mb-8">
                                    {propLang === 'mr' ? 'कृष्णनीती सॉफ्टवेअर तर्फे' : 'For Krishnaniti Software Solutions'}
                                </p>
                                <div className="h-12 border-b border-dashed border-slate-300 w-48 mb-2 relative flex items-center justify-end">
                                    {/* Mock Signature text */}
                                    <span className="font-display italic text-slate-400 absolute text-sm pr-4 select-none">
                                        Authorized Sign
                                    </span>
                                </div>
                                <p className="font-bold text-slate-800">Krishnaniti Sales Team</p>
                                <p className="text-[10px] text-slate-500">Sales & Deployments Division</p>
                            </div>
                        </div>

                        {/* 4. Footer */}
                        <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-4 notranslate">
                            <p>Powered by Krishnaniti Digital Platform © {new Date().getFullYear()}. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SalesProposalGenerator;
