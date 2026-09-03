import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { SecureStorageService } from '../../services/secureStorageService';
import { type ComplaintType, type Voter } from '../../types';
import { type Staff } from '../../types/staff';
import { ArrowLeft, Camera, X, Sparkles, AlertTriangle, Search, User, Phone, Check, Loader2, PlusCircle, ChevronDown } from 'lucide-react';
import { AIAnalysisService } from '../../services/aiService';
import { useLanguage } from '../../context/LanguageContext';
import { useTenant } from '../../context/TenantContext';
import { useFormDraft } from '../../hooks/useFormDraft';
import { CustomSelect } from '../../components/common/CustomSelect';
import { MultiFileUpload } from '../../components/common/MultiFileUpload';
import { formatAreaName } from '../../utils/formatters';

const SECTOR_5_SOCIETIES = [
    'SHANTIDOOT APT', 'OMKAR CHS', 'MAYNAK CHS', 'VANRAI APT', 'PRATHAMESH CHS', 
    'SHIVKRUPA APT', 'SAHAYOG CHS', 'SUYOG CHS', 'AASHIYANA', 'MORYA', 
    'PANCHSHEEL ARKED', 'BALAJI SOCIETY', 'PANCHSHEEL PLAZA'
];

const SECTOR_6_SOCIETIES = [
    'EXCEL RESIDENCY', 'GHARKUL CHS', 'ROOPMAYA CHS', 'YASH RESIDANCY', 'MANAS CHS', 
    'MERCURY', 'DYNASTY', 'EXCEL PARK', 'MADHURI', 'SHIV SHANKAR CHS', 
    'BLACK SMITH TOWER', 'ARIHANT CHS', 'UMAGEETA', 'MANGAL MOORTHY', 
    'SANSKRUTI NAVAVIDYUT CHS', 'SUKHMANI CHS', 'PARIJAT DHRUV CHS', 'MIHIR TOWER', 
    'CHINMAY CHS', 'CELEBRATION CHS', 'SWANAND', 'MADHUBAN CHS', 'VENUS CHS', 
    'RAJSTHAN CHS', 'SHREE SWAMI DARSHAN', 'RUSHI CHS', 'GOODWILL RESIDENCY', 
    'SWAMI ASHIRWAD', 'AMRIT CHS', 'JUPITER CHS', 'GREEN PARK', 'SHREE SWAMI CHARAN', 
    'SAI RAJ'
];

const SECTOR_7_SOCIETIES = [
    'SHIVSHANKAR PLAZA II', 'AJAY CHS', 'RAKESH PARK', 'DEVIPRASAD CHS',
    'NEW BOMBAY SAPHALY', 'SHIVESH EMERALD', 'PANCHASHIL', 'KARAN CHS', 'GEETSONALI CHS',
    'SUNDARBAN', 'RUDRAKSHA', 'LOTUS CHS', 'PAMSPRING', 'SHREE DURGA', 
    'DNYANDEEP DARSHAN', 'VISHAL', 'NAYAN TARA', 'SUPERIOR MICRON', 'OM ARCHADE',
    'SUPERIOUR (UNDER CONSTRUCTION)'
];

const SECTOR_10_SOCIETIES = [
    'SHIVDARSHAN', 'SWARAJYA', 'JAI OMKAR', 'SHRE GANESH KRUPA', 'TAPSYA',
    'SHIVNERI', 'SAGARDARSHAN', 'SUKHSHANTI', 'MANGAL DARSHAN', 'OMKAR',
    'BRIDGEVIEW', 'SAGAR', 'PRATIK'
];

const SECTOR_14_SOCIETIES = [
    'Ajantha Sea Breeze', 'Sunteck Signia Oceans', 'Bhumikocolosa - 2',
    'Matoshree Apt', 'Purna CHS', 'Prabhat Kiran CHS', 'Lake View CHS',
    'Kalptaru CSH', 'MangalDeep CHS'
];

const SECTOR_15_SOCIETIES = [
    'Dakshina CHS', 'Akshay CHS', 'Vaitrna CHS', 'Shree Samrth CHS', 'Panchtara CHS',
    'Aashirvad CHS', 'Suprabhat CHS', 'Triveni CHS', 'Ashtavinayak CHS', 'Saptshrungi CHS',
    'Navjivan CHS', 'Puja CHS', 'Darshan CHS', 'Shiv Shakti CHS', 'Shri Gajajnan CHS',
    'Om Sai CHS', 'Himalay CHS', 'Amey CHS'
];

const SECTOR_8_SAIBABA_SOCIETIES = [
    'SOMESHWAR TOWER', 'DATTATREY MAHARAJ', 'KALPRATNA', 'SUKH SHANTI', 'MARUTI ENCLAVE',
    'EDEN PARK', 'NEW EKTA', 'SHREE RAM DARSHAN', 'ALANKAR', 'BINDAL',
    'AGRAWAL PARK', 'KRISHNA KANIYA', 'SWAMI NAVSHARANAM', 'SHREE DURGA PRASAD',
    'MAULI KRUPA', 'APURVA', 'SHREE SWAMI SADGURU', 'KASTURI TOWER', 'KASTURI GARDAN',
    'NEW CONSTRUCTION', 'SAMTA', 'EDEN TOWER', 'SAI BABA TEMPLE'
];

const SECTOR_8_DEVA_BUNGLOW_SOCIETIES = [
    'GURUKUL', 'SHASHWAT', 'EKVIRA DARSHAN', 'YASH PARADISE', 'SHUBHARAMBH',
    'BRAMHRAJ', 'SAI PRERNA', 'SHREE SWAMI SAMARTH', 'SAI SABURI', 'SHREE SIDDHIVINAYAK',
    'LAXMI SAWALI', 'JYOTI', 'OPEN PLOT', 'BHAJI MARKET', 'YOGESH', 'SILVIYA',
    'VASTU VRUNDAVAN', 'SAI', 'GANESH', 'MAJJUDDIN SCHOOL', 'RAJGOPAL', 'RAJLAXMI',
    'KAMTI PLAZA', 'SAI SHRADDHA', 'MORESHWAR', 'VARDVINAYAK', 'SHRIMAN', 'SHRIKRUPA',
    'KRISHNA HIGHTS', 'SUSHILA', 'BLOSOM', 'SHREEJI DHAM'
];

const SECTOR_9_SOCIETIES = [
    'bramharaj annex', 'swami Samarth chs', 'Shanti villa', 'ananta niwas', 'parvati apt',
    'janabai apt', 'vighnaharta apt', 'mankubai apt', 'shantai niwas', 'manjula apt',
    'radhe shyam apt', 'Vighnahar chs', 'divyal chs', 'siddhivinayak chs', 'sea side chs',
    'mangalmurti apt', 'shree sai apt', 'jai kalika apt', 'vitthal niwas', 'balkrishna apt',
    'Pratham Plaza', 'Kasturi Valley', 'Shri Krishna Vaibhav', 'Krishna chs', 'Matruchaya',
    'Sai Sharan', 'sea Sai chs', 'Aayush Apt', 'Vinashree', 'Sachidanand',
    'Sai Satish', 'Balaji', 'Vinit', 'Tulsi', 'Radha Krishna',
    'Sai Apartment', 'Tukaram niwas', 'narmada apt', 'nike height', 'Gangaram plaza',
    'nice mension', 'balaji park', 'gajanan villla', 'pandurang apt', 'vitthal keni niwas',
    'akhadya villa', 'sitaram park', 'posha niwas', 'siddhu keni niwas', 'venubai rama niwas',
    'ganpat niwas', 'laxmi niwas', 'Ambo niwas', 'bapu niwas', 'mukunda niwas',
    'vasanti niwas', 'Heena Mension', 'Riddhi', 'Sadguru', 'Shravan',
    'Matruchaya (2)', 'Shraddha Neha', 'Shree Vighnahar', 'Chintamani Chs', 'Sai Bramhan',
    'Shakti Krupa', 'Shri Prasad', 'Abhishek', 'Ashirwad', 'Shiv Parvati',
    'Savitri', 'Sayli', 'mansi chs', 'C K P sadan', 'varad ashish chs',
    'Ratna Apt', 'kulswamini niwas', 'vasanti vitthal niwas', 'vaishnavi apt', 'Diva gaon 1',
    'chagan bhagirath patil niwas', 'madhvi house', 'etwar bapu patil niwas', 'hirubai patil niwas', 'maruti bhawan niwas',
    'Kunal chs', 'Matoshree chs', 'sai Sagar chs', 'Airoli Sai shradha chs', 'Sai deep chs',
    'Vishwaspatra chs', 'shrawan chs', 'Kajal', 'Sai Prasad', 'Sai Vilas',
    'Sai Apartment (2)', 'My choice', 'Om Shrushti Villa', 'Chinmay', 'Sai Mauli',
    'Sai Saily', 'Shri Sakshi', 'Ram Krishna', 'Icchapurti', 'Suman',
    'Space Plaza', 'My Apartment', 'Vishnu'
];

const SECTOR_9_BHAVANI_MATA_SOCIETIES = [
    'GANESH', 'PRANAY', 'SHIVAM', 'PRATHMESH', 'SHREE PRASAD', 'RAM KRISHNA', 'OPEN PLOT',
    'SAI SATISH', 'SHREE SAKSHI', 'SHAKTI KRUPA', 'SAI SAILY', 'SAI BRAMHAN', 'VEENA CHS',
    'SAI MAULI', 'BHAVANI MATA MANDIR', 'OPEN MAIDAN (CONTAINER)', 'AAYUSH APARTMENT',
    'SIDDHIVINAYAK CHS', 'SIDDHI ARCADE', 'BALAJI'
];

const SECTOR_9_GANPATI_BAPPA_SOCIETIES = [
    'KAJAL', 'OM SHRUSHTI VILLA', 'SHRADDHA NEHA', 'SAI SHARAN', 'MATRUCHAYA', 
    'ICCHAPURTI', 'ABHISHEK', 'OPEN PLOT', 'CHINTAMANI', 'CONSTRUCTION', 
    'SAI APARTMENT', 'MY APARTMENT', 'SAVITRI', 'RADHA KRISHNA', 'TULSI', 
    'SHIV PARVATI', 'SPACE PLAZA', 'SUMAN', 'ASHIRWAD', 'VINIT', 'KRISHNA', 
    'KRISHNA CHS', 'SHREE KRISHNA VAIBHAV', 'KASTURI VALLY', 'PRATHAM PLAZA', 
    'SADGURU', 'HEENA MENSION', 'RIDDHI', 'SHRAVAN', 'SAI PRASAD', 'SAI VILAS', 
    'MY CHOICE'
];

const SECTOR_9_SAILY_SOCIETIES = [
    'SOHAM', 'PRERNA CHAYA', 'RADHA KRISHNA', 'KALPATARU', 'GURUDEV', 'OPEN',
    'SAI VIRAJ', 'SAPTAGIRI', 'GIRNAR', 'ADITI', 'NAV ARIHANT', 'SAI DRUSHTI',
    'NEW OMKAR', 'EVERGREEN', 'SACCHIDANAND', 'VISHNU', 'SAILY', 'HOLI MAIDAN',
    'SAI APARTMENT', 'MANGAL MURTI', 'JAI KALIKA'
];

const SECTOR_9_SANE_GURUJI_SOCIETIES = [
    'VIGHNAHAR', 'DIVYAL', 'SIDDHIVINAYAK', 'SHREE SAI', 'BALAJI PARK',
    'CHINMAY', 'SHANKAR KRUPA', 'VIGHNESHWAR', 'OPEN'
];

const SOCIETIES_BY_WARD: Record<string, string[]> = {
    'Sector 5': SECTOR_5_SOCIETIES,
    'Sector 6': SECTOR_6_SOCIETIES,
    'Sector 7': SECTOR_7_SOCIETIES,
    'Sector 8 - Saibaba Temple Area': SECTOR_8_SAIBABA_SOCIETIES,
    'Sector 8 - Deva Bunglow Back Side Area': SECTOR_8_DEVA_BUNGLOW_SOCIETIES,
    'Sector 9': SECTOR_9_SOCIETIES,
    'Sector 9 - Bhavani Mata Temple': SECTOR_9_BHAVANI_MATA_SOCIETIES,
    'Sector 9 - Ganpati Bappa Chauk To D Mart': SECTOR_9_GANPATI_BAPPA_SOCIETIES,
    'Sector 9 - Saily Society': SECTOR_9_SAILY_SOCIETIES,
    'Sector 9 - Sane Guruji Mandal': SECTOR_9_SANE_GURUJI_SOCIETIES,
    'Sector 10': SECTOR_10_SOCIETIES,
    'Sector 14': SECTOR_14_SOCIETIES,
    'Sector 15': SECTOR_15_SOCIETIES
};

const ComplaintForm = () => {
    const { t, language } = useLanguage();
    const { tenant, tenantId } = useTenant();
    const navigate = useNavigate();
    const location = useLocation();
    const isWardProblemForm = location.pathname.includes('/ward/problems/new') || location.search.includes('type=SelfIdentified');

    // Pre-fill if coming from Voter Profile
    const prefillVoterId = location.state?.voterId || '';
    const prefillVoterName = location.state?.voterName || '';

    // State for linked voter
    const [selectedVoterId, setSelectedVoterId, clearVoterIdDraft] = useFormDraft<string | null>('draft_complaint_voter_id', prefillVoterId || null);

    // Form State
    const [title, setTitle, clearTitleDraft] = useFormDraft('draft_complaint_title', '');
    const [description, setDescription, clearDescDraft] = useFormDraft('draft_complaint_desc', '');
    const [type, setType, clearTypeDraft] = useFormDraft<ComplaintType>('draft_complaint_type', 'Other');
    const [ward, setWard, clearWardDraft] = useFormDraft('draft_complaint_ward', '5'); // Default to 5
    const [area, setArea, clearAreaDraft] = useFormDraft('draft_complaint_area', '');
    const [society, setSociety, clearSocietyDraft] = useFormDraft('draft_complaint_society', '');
    const [peopleAffected, setPeopleAffected, clearAffectedDraft] = useFormDraft('draft_complaint_affected', '');

    // Media State (not drafted because File objects can't be easily JSON serialized)
    const [desktopFiles, setDesktopFiles] = useState<globalThis.File[]>([]);
    const [mediaFiles, setMediaFiles] = useState<globalThis.File[]>([]);
    const [docFiles, setDocFiles] = useState<globalThis.File[]>([]);
    const [uploading, setUploading] = useState(false);

    // Voter Details State
    const [firstName, setFirstName, clearFNameDraft] = useFormDraft('draft_complaint_fname', '');
    const [middleName, setMiddleName, clearMNameDraft] = useFormDraft('draft_complaint_mname', '');
    const [lastName, setLastName, clearLNameDraft] = useFormDraft('draft_complaint_lname', '');
    const [mobile, setMobile, clearMobileDraft] = useFormDraft('draft_complaint_mobile', '+91 ');

    // Voter Search Modal State
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Advanced Search State
    const [nameFilter, setNameFilter] = useState('');
    const [houseNoFilter, setHouseNoFilter] = useState('');
    const [ageFilter, setAgeFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');

    // Suggestions State
    const [houseNoSuggestions, setHouseNoSuggestions] = useState<{ house_no: string; count: number }[]>([]);
    const [showHouseNoSuggestions, setShowHouseNoSuggestions] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<{ address: string; count: number }[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [addedByStaffId, setAddedByStaffId] = useState('');

    // Society Combobox State
    const [isSocietyDropdownOpen, setIsSocietyDropdownOpen] = useState(false);
    const [societySearchQuery, setSocietySearchQuery] = useState('');
    const societyDropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!tenantId) return;
        const fetchStaff = async () => {
            const { data } = await supabase.from('staff').select('*').eq('tenant_id', tenantId);
            if (data) setStaffList(data);
        };
        fetchStaff();
    }, [tenantId]);

    const houseNoWrapperRef = React.useRef<HTMLDivElement>(null);
    const addressWrapperRef = React.useRef<HTMLDivElement>(null);

    const [searchResults, setSearchResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // AI States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [translationData, setTranslationData] = useState<any>(null);

    // Fetch Stats for Suggestions
    useEffect(() => {
        if (!isSearchOpen) return;
        const fetchStats = async () => {
            try {
                const { data: votersData } = await supabase
                    .from('voters')
                    .select('address_english, address_marathi, house_no')
                    .eq('tenant_id', tenantId)
                    .limit(1000);

                if (votersData) {
                    const addrs = new Map<string, number>();
                    const houses = new Map<string, number>();

                    votersData.forEach((v: any) => {
                        const addr = language === 'mr' ? (v.address_marathi || v.address_english) : v.address_english;
                        if (addr) addrs.set(addr, (addrs.get(addr) || 0) + 1);

                        if (v.house_no) houses.set(v.house_no, (houses.get(v.house_no) || 0) + 1);
                    });

                    setAddressSuggestions(Array.from(addrs).map(([address, count]) => ({ address, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                    setHouseNoSuggestions(Array.from(houses).map(([house_no, count]) => ({ house_no, count })).sort((a, b) => b.count - a.count).slice(0, 50));
                }
            } catch (err) {
                console.error('Error fetching suggestions:', err);
            }
        };
        fetchStats();
    }, [isSearchOpen, language]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addressWrapperRef.current && !addressWrapperRef.current.contains(event.target as Node)) {
                setShowAddressSuggestions(false);
            }
            if (houseNoWrapperRef.current && !houseNoWrapperRef.current.contains(event.target as Node)) {
                setShowHouseNoSuggestions(false);
            }
            if (societyDropdownRef.current && !societyDropdownRef.current.contains(event.target as Node)) {
                setIsSocietyDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredHouseNos = houseNoSuggestions.filter(item =>
        item.house_no.toLowerCase().includes(houseNoFilter.toLowerCase())
    ).slice(0, 50);

    const filteredAddresses = addressSuggestions.filter(item =>
        item.address.toLowerCase().includes(addressFilter.toLowerCase())
    ).slice(0, 50);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (title.length > 5 || description.length > 10) {
                setIsAnalyzing(true);
                const result = await AIAnalysisService.analyzeComplaint(title, description);

                if (result.category && result.category !== 'Other' && !isWardProblemForm) {
                    // Only auto-categorize if it's not a personal help type (which shouldn't be here anyway now)
                    const allowedTypes: ComplaintType[] = ['Cleaning', 'Water', 'Road', 'Drainage', 'StreetLight', 'SelfIdentified', 'Other'];
                    if (allowedTypes.includes(result.category as ComplaintType)) {
                        setType(result.category as ComplaintType);
                    }
                }
                setUrgency(result.urgency);

                setTranslationData({
                    en: {
                        title: result.translated_title_en,
                        description: result.translated_description_en
                    },
                    mr: {
                        title: result.translated_title_mr,
                        description: result.translated_description_mr
                    },
                    detected_lang: result.original_language
                });

                setIsAnalyzing(false);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [title, description]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!isSearchOpen) return;
            setIsSearching(true);
            try {
                let query = supabase
                    .from('voters')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .limit(20);

                if (nameFilter) {
                    if (/^\d+$/.test(nameFilter)) {
                        query = query.ilike('mobile', `%${nameFilter}%`);
                    } else {
                        query = query.or(`name_english.ilike.%${nameFilter}%,name_marathi.ilike.%${nameFilter}%,epic_no.ilike.%${nameFilter}%`);
                    }
                }

                if (addressFilter) {
                    query = query.or(`address_english.ilike.%${addressFilter}%,address_marathi.ilike.%${addressFilter}%`);
                }

                if (houseNoFilter) {
                    query = query.ilike('house_no', `%${houseNoFilter}%`);
                }

                if (ageFilter) {
                    if (ageFilter.includes('-')) {
                        const [minAge, maxAge] = ageFilter.split('-').map(a => parseInt(a.trim()));
                        if (!isNaN(minAge) && !isNaN(maxAge)) {
                            query = query.gte('age', minAge).lte('age', maxAge);
                        }
                    } else {
                        const age = parseInt(ageFilter);
                        if (!isNaN(age)) {
                            query = query.eq('age', age);
                        }
                    }
                }

                if (genderFilter) {
                    query = query.eq('gender', genderFilter);
                }

                const { data, error } = await query;
                if (error) throw error;

                const mappedVoters: Voter[] = (data || []).map((row: any) => ({
                    id: row.id.toString(),
                    name: row.name_english || row.name_marathi,
                    name_english: row.name_english,
                    name_marathi: row.name_marathi,
                    age: row.age,
                    gender: row.gender,
                    address: row.address_english || row.address_marathi,
                    address_english: row.address_english,
                    address_marathi: row.address_marathi,
                    ward: row.ward_no || '-',
                    booth: row.part_no?.toString() || '-',
                    epicNo: row.epic_no,
                    mobile: row.mobile,
                    houseNo: row.house_no,
                    history: []
                }));

                setSearchResults(mappedVoters);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nameFilter, houseNoFilter, ageFilter, genderFilter, addressFilter, isSearchOpen]);

    const handleVoterSelect = (voter: Voter) => {
        setSelectedVoterId(voter.id);
        const fullName = voter.name_english || voter.name_marathi || '';
        const parts = fullName.trim().split(/\s+/);

        let f = '', m = '', l = '';
        if (parts.length > 0) f = parts[0];
        if (parts.length === 2) l = parts[1];
        if (parts.length >= 3) {
            m = parts[1];
            l = parts.slice(2).join(' ');
        }

        setFirstName(f);
        setMiddleName(m);
        setLastName(l);
        if (voter.mobile) {
            setMobile(voter.mobile.startsWith('+91') ? voter.mobile : `+91 ${voter.mobile}`);
        } else {
            setMobile('+91 ');
        }

        setIsSearchOpen(false);
        toast.success(`Linked voter: ${fullName}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

            const allFiles = [...desktopFiles, ...mediaFiles, ...docFiles];
            // Upload all attachments concurrently
            const uploadedAttachments = await Promise.all(
                allFiles.map(async (file) => {
                    const relativePath = await SecureStorageService.uploadFile('documents', 'complaints', file);
                    return {
                        url: relativePath,
                        type: file.type,
                        name: file.name,
                        size: file.size
                    };
                })
            );

            // Backwards compatibility for image_url
            const firstImage = uploadedAttachments.find(a => a.type.startsWith('image/'));
            const imageUrl = firstImage ? firstImage.url : null;

            // 2. Submit directly to Supabase
            const { error } = await supabase.from('complaints').insert([{
                tenant_id: tenantId,
                problem: title + '\n' + description,
                category: isWardProblemForm ? 'SelfIdentified' : type,
                priority: urgency,
                location: 'Ward ' + ward,
                area: SOCIETIES_BY_WARD[ward] && society ? (area ? `${society}, ${area}` : society) : area,
                source: 'Website',
                image_url: imageUrl,
                attachments: uploadedAttachments,
                voter_id: selectedVoterId,
                added_by_staff_id: addedByStaffId || null,
                description_meta: {
                    submitter_name: fullName,
                    submitter_mobile: mobile,
                    people_affected: peopleAffected,
                    translation: translationData,
                    original_title: title,
                    original_description: description
                }
            }]);

            if (error) {
                throw error;
            }
            toast.success('Complaint submitted successfully!');

            // Clear all drafts upon success
            clearVoterIdDraft();
            clearTitleDraft();
            clearDescDraft();
            clearTypeDraft();
            clearWardDraft();
            clearAreaDraft();
            clearSocietyDraft();
            clearAffectedDraft();
            clearFNameDraft();
            clearMNameDraft();
            clearLNameDraft();
            clearMobileDraft();
            setDesktopFiles([]);
            setMediaFiles([]);
            setDocFiles([]);

            if (isWardProblemForm) {
                navigate('/dashboard/ward/problems');
            } else {
                navigate('/dashboard/complaints');
            }
        } catch (err) {
            console.error('Error submitting complaint:', err);
            toast.error('Failed to submit complaint');
        } finally {
            setUploading(false);
        }
    };






    useEffect(() => {
        const cookies = document.cookie.split(';');
        const transCookie = cookies.find(c => c.trim().startsWith('googtrans='));
        if (transCookie && transCookie.includes('/en/mr')) {
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
            window.location.reload();
        }
    }, []);

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <button
                onClick={() => {
                    if (isWardProblemForm) {
                        navigate('/dashboard/ward/problems');
                    } else {
                        navigate('/dashboard/complaints');
                    }
                }}
                className="ns-btn-ghost px-0 py-0 text-slate-600 hover:text-brand-700 mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
            </button>

            <div className="ns-card overflow-hidden">
                <div className="p-6 border-b border-slate-200/70 bg-gradient-to-br from-brand-50 to-white">
                    <h1 className="text-xl font-bold text-slate-900">
                        {isWardProblemForm ? (t('permissions.ward_problems') || 'Add Ward Problem') : t('complaints.form.title')}
                    </h1>
                    {prefillVoterName && (
                        <p className="text-sm text-brand-700 mt-2">
                            Linking to Voter: <span className="font-semibold">{prefillVoterName}</span>
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-slate-400" />
                                {t('complaints.form.voter_details')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 transition-colors"
                            >
                                <Search className="w-3.5 h-3.5" />
                                {t('complaints.form.search_voter')}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.first_name')}</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.first_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.middle_name')}</label>
                                <input
                                    type="text"
                                    value={middleName}
                                    onChange={(e) => setMiddleName(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.middle_name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.last_name')}</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.last_name')}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.mobile')}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="ns-input pl-10"
                                        placeholder="+91 9999999999"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-slate-400" />
                                {t('complaints.form.details_section')}
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.issue_title')}</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="ns-input"
                                placeholder={t('complaints.form.title_placeholder')}
                            />
                            {isAnalyzing && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-brand-700 animate-pulse">
                                    <Sparkles className="w-3 h-3" />
                                    <span>AI is analyzing issue details...</span>
                                </div>
                            )}
                            {urgency === 'High' && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-red-700 font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>High Urgency Detected by AI</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {!isWardProblemForm && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.type')}</label>
                                    <CustomSelect value={type}
                                        onChange={(e) => setType(e.target.value as ComplaintType)} className="ns-input"
                                    >
                                        <option value="Cleaning">{t('complaints.form.types.cleaning')}</option>
                                        <option value="Water">{t('complaints.form.types.water')}</option>
                                        <option value="Road">{t('complaints.form.types.road')}</option>
                                        <option value="Drainage">{t('complaints.form.types.drainage')}</option>
                                        <option value="StreetLight">{t('complaints.form.types.streetlight')}</option>
                                        <option value="SelfIdentified">{t('complaints.form.types.self_identified')}</option>
                                        <option value="Other">{t('complaints.form.types.other')}</option>
                                    </CustomSelect>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.ward')}</label>
                                <CustomSelect value={ward}
                                    onChange={(e) => {
                                        const newWard = e.target.value;
                                        setWard(newWard);
                                        setSociety('');
                                    }} className="ns-input"
                                >
                                    {((tenant?.name || '').toLowerCase().includes('mamit')
                                        ? [
                                            'Sector 5', 'Sector 6', 'Sector 7', 
                                            'Sector 8 - Saibaba Temple Area', 'Sector 8 - Deva Bunglow Back Side Area', 
                                            'Sector 9', 'Sector 9 - Bhavani Mata Temple', 'Sector 9 - Ganpati Bappa Chauk To D Mart', 'Sector 9 - Saily Society', 'Sector 9 - Sane Guruji Mandal', 
                                            'Sector 10', 'Sector 14', 'Sector 15', 'Out of Ward'
                                        ]
                                        : ['Sector 5', 'Sector 6', 'Sector 7', 'Sector 8', 'Sector 9', 'Sector 10', 'Sector 14', 'Sector 15', 'Out of Ward']
                                    ).map(w => (
                                        <option key={w} value={w}>{formatAreaName(w, tenant?.name)}</option>
                                    ))}
                                </CustomSelect>
                            </div>
                            {SOCIETIES_BY_WARD[ward] && (
                                <div className="relative" ref={societyDropdownRef}>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Society Name</label>
                                    <div 
                                        className="ns-input flex items-center justify-between cursor-pointer bg-white"
                                        onClick={() => setIsSocietyDropdownOpen(!isSocietyDropdownOpen)}
                                    >
                                        <span className={`truncate ${!society ? 'text-slate-400' : ''}`}>
                                            {society || 'Select Society'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                                    </div>
                                    
                                    {isSocietyDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                            <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
                                                <input 
                                                    type="text" 
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                                                    placeholder="Search society..."
                                                    value={societySearchQuery}
                                                    onChange={(e) => setSocietySearchQuery(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            {SOCIETIES_BY_WARD[ward]
                                                .map((s, index) => ({ name: `${index + 1} - ${s}`, raw: s }))
                                                .filter(s => s.name.toLowerCase().includes(societySearchQuery.toLowerCase()))
                                                .map(s => (
                                                    <div 
                                                        key={s.name}
                                                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 ${society === s.name ? 'bg-brand-50 text-brand-700 font-medium' : ''}`}
                                                        onClick={() => {
                                                            setSociety(s.name);
                                                            setIsSocietyDropdownOpen(false);
                                                            setSocietySearchQuery('');
                                                        }}
                                                    >
                                                        {s.name}
                                                    </div>
                                                ))
                                            }
                                            {SOCIETIES_BY_WARD[ward]
                                                .map((s, index) => ({ name: `${index + 1} - ${s}`, raw: s }))
                                                .filter(s => s.name.toLowerCase().includes(societySearchQuery.toLowerCase()))
                                                .length === 0 && (
                                                <div className="px-4 py-2 text-sm text-slate-500 text-center">No societies found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className={SOCIETIES_BY_WARD[ward] ? 'md:col-span-1' : 'md:col-span-2'}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('complaints.form.area')} {(tenant?.name || '').toLowerCase().includes('mamit') && <span className="text-slate-400 font-normal">(Optional)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    className="ns-input"
                                    placeholder={(tenant?.name || '').toLowerCase().includes('mamit') ? "Area / Colony (Optional)" : t('complaints.form.area_placeholder')}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.people_affected')}</label>
                                <input
                                    type="number"
                                    value={peopleAffected}
                                    onChange={(e) => setPeopleAffected(e.target.value)}
                                    className="ns-input"
                                    placeholder={t('complaints.form.people_affected_placeholder')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('complaints.form.description')}</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="ns-input min-h-[120px]"
                                placeholder={t('complaints.form.desc_placeholder')}
                            />
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Added By (Staff)</label>
                                    <CustomSelect value={addedByStaffId}
                                        onChange={e => setAddedByStaffId(e.target.value)}
                                    >
                                        <option value="">Select Staff (Optional)</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                        ))}
                                    </CustomSelect>
                                </div>
                        </div>

                        <div>
                            <label className="ns-input block text-sm font-medium text-slate-700 mb-2">Attachments (Photos, Videos, Audio, Documents)</label>
                            
                            {/* Desktop Version: Single unified upload zone */}
                            <div className="hidden md:block">
                                <MultiFileUpload 
                                    files={desktopFiles} 
                                    onChange={setDesktopFiles} 
                                    maxFiles={10} 
                                    maxSizeMB={100}
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                />
                            </div>

                            {/* Mobile Version: Split upload zones */}
                            <div className="md:hidden grid grid-cols-1 gap-4">
                                <MultiFileUpload 
                                    files={mediaFiles} 
                                    onChange={setMediaFiles} 
                                    maxFiles={5} 
                                    maxSizeMB={100}
                                    accept="image/*,video/*,audio/*"
                                    title="Add Photos & Videos"
                                    subtitle="Max 100MB per file"
                                />
                                <MultiFileUpload 
                                    files={docFiles} 
                                    onChange={setDocFiles} 
                                    maxFiles={5} 
                                    maxSizeMB={100}
                                    accept=".pdf,.doc,.docx"
                                    title="Add Documents"
                                    subtitle="PDF, DOC, DOCX (Max 100MB)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={uploading}
                            className="ns-btn-primary px-8 py-2.5 flex items-center gap-2"
                        >
                            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {uploading ? 'Submitting...' : t('complaints.form.submit')}
                        </button>
                    </div>
                </form>
            </div>

            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="ns-card w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200/70 bg-white">
                            <h3 className="text-lg font-bold text-slate-900">{t('complaints.form.search_voter')}</h3>
                            <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 bg-slate-50 border-b border-slate-200/70 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('sadasya.search_name_placeholder') || "Search by Name"}
                                    className="ns-input"
                                    autoFocus
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                                <div className="relative" ref={houseNoWrapperRef}>
                                    <input
                                        type="text"
                                        placeholder={t('sadasya.search_house_no') || "Search House No"}
                                        className="ns-input"
                                        value={houseNoFilter}
                                        onFocus={() => setShowHouseNoSuggestions(true)}
                                        onChange={(e) => {
                                            setHouseNoFilter(e.target.value);
                                            setShowHouseNoSuggestions(true);
                                        }}
                                    />
                                    {showHouseNoSuggestions && filteredHouseNos.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {filteredHouseNos.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                    onClick={() => {
                                                        setHouseNoFilter(item.house_no);
                                                        setShowHouseNoSuggestions(false);
                                                    }}
                                                    type="button"
                                                >
                                                    <span>{item.house_no}</span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded">{item.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder={t('sadasya.age_range_placeholder') || "Age / Range (e.g. 18-24)"}
                                    className="ns-input"
                                    value={ageFilter}
                                    onChange={(e) => setAgeFilter(e.target.value)}
                                />
                                <CustomSelect value={genderFilter}
                                    onChange={(e) => setGenderFilter(e.target.value)}
                                >
                                    <option value="">{t('sadasya.all_genders') || "All Genders"}</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </CustomSelect>
                            </div>
                            <div>
                                <div className="ns-input relative" ref={addressWrapperRef}>
                                    <input
                                        type="text"
                                        placeholder={t('sadasya.search_address') || "Search Address"}
                                        className="ns-input w-full"
                                        value={addressFilter}
                                        onFocus={() => setShowAddressSuggestions(true)}
                                        onChange={(e) => {
                                            setAddressFilter(e.target.value);
                                            setShowAddressSuggestions(true);
                                        }}
                                    />
                                    {showAddressSuggestions && filteredAddresses.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {filteredAddresses.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm flex justify-between"
                                                    onClick={() => {
                                                        setAddressFilter(item.address);
                                                        setShowAddressSuggestions(false);
                                                    }}
                                                    type="button"
                                                >
                                                    <span className="truncate mr-2">{item.address}</span>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded whitespace-nowrap">{item.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-white min-h-[300px]">
                            {isSearching ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-500" />
                                    <span className="text-sm font-medium">Searching voters...</span>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {searchResults.map(voter => (
                                        <div
                                            key={voter.id}
                                            onClick={() => handleVoterSelect(voter)}
                                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group flex justify-between items-center"
                                        >
                                            <div className="flex-1 pr-4">
                                                <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors text-base">
                                                    {language === 'mr' ? (voter.name_marathi || voter.name_english) : voter.name_english}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                        {voter.age} Y • {voter.gender}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>EPIC: <span className="font-medium text-slate-700">{voter.epicNo}</span></span>
                                                    {voter.mobile && (
                                                        <>
                                                            <span className="text-slate-300">|</span>
                                                            <div className="flex items-center gap-1 text-slate-600">
                                                                <Phone className="w-3 h-3" />
                                                                {voter.mobile}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1.5 line-clamp-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                                                    {language === 'mr' ? (voter.address_marathi || voter.address_english) : voter.address_english}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <PlusCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (nameFilter || houseNoFilter || ageFilter || genderFilter || addressFilter) ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-900">No voters found</p>
                                    <p className="text-sm mt-1 text-slate-400">Try adjusting your search filters</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                    <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-brand-300" />
                                    </div>
                                    <p className="font-medium text-slate-700">Search for a voter</p>
                                    <p className="text-sm mt-1 text-slate-400 max-w-xs text-center">Enter search criteria to find voters in the list</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintForm;
