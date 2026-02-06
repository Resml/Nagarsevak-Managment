-- Government Schemes for Maharashtra (Bilingual: English & Marathi)
-- Insert popular Central and State government schemes
-- Schema: name, description, eligibility, benefits, documents

-- Women Empowerment Schemes
INSERT INTO schemes (name, description, eligibility, benefits, documents, created_at) VALUES
('Mukhyamantri Majhi Ladki Bahin Yojana / मुख्यमंत्री माझी लाडकी बहीण योजना', 
'Financial assistance scheme to promote economic independence, health and nutrition of women in Maharashtra. महाराष्ट्रातील महिलांचे आर्थिक स्वातंत्र्य, आरोग्य आणि पोषण सुधारण्यासाठी आर्थिक सहाय्य योजना.', 
'Women aged 21-65 years, family income criteria apply. २१ ते ६५ वर्षे वयोगटातील महिला, कुटुंब उत्पन्न निकष लागू.', 
'₹1,500 per month through Direct Benefit Transfer (DBT). दरमहा ₹१,५०० थेट बँक हस्तांतरणाद्वारे.', 
'Aadhar Card, Bank Account, Income Certificate, Residence Proof / आधार कार्ड, बँक खाते, उत्पन्न प्रमाणपत्र, निवास पुरावा', NOW()),

('Punyashlok Ahilyadevi Holkar Women Startup Scheme / पुण्यश्लोक अहिल्यादेवी महिला स्टार्टअप योजना', 
'Funding support for women-led startups to promote innovation and entrepreneurship. नवोपक्रम आणि उद्योजकता वाढवण्यासाठी महिला-नेतृत्वाच्या स्टार्टअपसाठी निधी समर्थन.', 
'Women entrepreneurs with innovative business ideas. नाविन्यपूर्ण व्यवसाय कल्पना असलेल्या महिला उद्योजक.', 
'Seed funding up to ₹10 lakhs, mentorship and training. ₹१० लाख पर्यंत बीज निधी, मार्गदर्शन आणि प्रशिक्षण.', 
'Business Plan, Educational Certificates, ID Proof / व्यवसाय योजना, शैक्षणिक प्रमाणपत्रे, ओळखपत्र', NOW()),

('Indira Gandhi National Widow Pension / इंदिरा गांधी राष्ट्रीय विधवा निवृत्तीवेतन', 
'Monthly pension for widows to ensure social security and financial independence. सामाजिक सुरक्षा आणि आर्थिक स्वातंत्र्य सुनिश्चित करण्यासाठी विधवांना मासिक निवृत्तीवेतन.', 
'Widows aged 40-79 years from BPL families. BPL कुटुंबातील ४० ते ७९ वर्षे वयोगटातील विधवा.', 
'₹1,500 per month pension. दरमहा ₹१,५०० निवृत्तीवेतन.', 
'Widow Certificate, Aadhar, BPL Card, Bank Passbook / विधवा प्रमाणपत्र, आधार, BPL कार्ड, बँक पासबुक', NOW()),

-- Education Schemes
('Post-Matric Scholarship - VJNT Students / मॅट्रिकोत्तर शिष्यवृत्ती - वि.जा.भ.ज. विद्यार्थी', 
'Scholarship for VJNT (Vimukta Jatis & Nomadic Tribes) students pursuing post-matric education. मॅट्रिकोत्तर शिक्षण घेणाऱ्या वि.जा.भ.ज. विद्यार्थ्यांसाठी शिष्यवृत्ती.', 
'VJNT students enrolled in recognized post-matric courses, income limit applies. मान्यताप्राप्त मॅट्रिकोत्तर अभ्यासक्रमात प्रवेश घेतलेले वि.जा.भ.ज. विद्यार्थी, उत्पन्न मर्यादा लागू.', 
'Tuition fees, maintenance allowance, exam fees coverage. शिक्षण शुल्क, देखभाल भत्ता, परीक्षा शुल्क कव्हरेज.', 
'Caste Certificate, Income Certificate, Admission Receipt, Bank Details / जात प्रमाणपत्र, उत्पन्न प्रमाणपत्र, प्रवेश पावती, बँक तपशील', NOW()),

('PM Vidyalaxmi Scheme / प्रधानमंत्री विद्यालक्ष्मी योजना', 
'Interest subvention on education loans for meritorious students from economically weaker sections. आर्थिकदृष्ट्या दुर्बल घटकांतील गुणवान विद्यार्थ्यांसाठी शिक्षण कर्जावर व्याज सवलत.', 
'Meritorious students with family income below threshold. कौटुंबिक उत्पन्न मर्यादेखालील गुणवान विद्यार्थी.', 
'Interest subsidy on education loans for higher studies. उच्च शिक्षणासाठी शिक्षण कर्जावर व्याज अनुदान.', 
'Income Certificate, Admission Letter, Merit Proof, Aadhar / उत्पन्न प्रमाणपत्र, प्रवेश पत्र, गुणवत्ता पुरावा, आधार', NOW()),

('Mukhyamantri Yuva Karya Prashikshan Yojana / मुख्यमंत्री युवा कार्य प्रशिक्षण योजना', 
'Practical training program with entrepreneurs to enhance employability of youth. तरुणांची रोजगारक्षमता वाढवण्यासाठी उद्योजकांसोबत व्यावहारिक प्रशिक्षण कार्यक्रम.', 
'12th Pass, ITI, Diploma, Graduate, Post-Graduate youth. १२वी उत्तीर्ण, आयटीआय, डिप्लोमा, पदवीधर, पद्युत्तर तरुण.', 
'Stipend during training, skill certification, job linkage. प्रशिक्षणादरम्यान मानधन, कौशल्य प्रमाणपत्र, रोजगार संपर्क.', 
'Educational Certificates, Aadhar, Bank Account / शैक्षणिक प्रमाणपत्रे, आधार, बँक खाते', NOW()),

-- Farmer Support Schemes
('PM Kisan Samman Nidhi / प्रधानमंत्री किसान सन्मान निधी', 
'Income support for small and marginal farmers across India. संपूर्ण भारतातील लहान आणि अल्पभूधारक शेतकऱ्यांसाठी उत्पन्न समर्थन.', 
'All landholding farmer families. सर्व जमीनधारक शेतकरी कुटुंबे.', 
'₹6,000 per year in three equal installments through DBT. वर्षाला ₹६,००० तीन समान हप्त्यांमध्ये थेट बँक हस्तांतरण.', 
'Land Records, Aadhar, Bank Account / जमीन नोंदी, आधार, बँक खाते', NOW()),

('Namo Shetkari Maha Samman Nidhi / नमो शेतकरी महासन्मान निधी', 
'Additional financial assistance to farmers by Maharashtra government. महाराष्ट्र शासनाकडून शेतकऱ्यांना अतिरिक्त आर्थिक सहाय्य.', 
'Registered farmers in Maharashtra. महाराष्ट्रातील नोंदणीकृत शेतकरी.', 
'Additional annual financial support. अतिरिक्त वार्षिक आर्थिक समर्थन.', 
'Farmer Registration, Land Records, Aadhar / शेतकरी नोंदणी, जमीन नोंदी, आधार', NOW()),

('PM Fasal Bima Yojana / प्रधानमंत्री पीक विमा योजना', 
'Crop insurance scheme protecting farmers against crop loss due to natural calamities. नैसर्गिक आपत्तींमुळे पीक नुकसानीपासून शेतकऱ्यांचे संरक्षण करणारी पीक विमा योजना.', 
'All farmers growing notified crops. सूचित पिके घेणारे सर्व शेतकरी.', 
'Insurance coverage for crop loss, subsidized premium. पीक नुकसानीसाठी विमा कव्हरेज, अनुदानित प्रीमियम.', 
'Land Records, Crop Details, Aadhar, Bank Account / जमीन नोंदी, पीक तपशील, आधार, बँक खाते', NOW()),

('Magel Tyala Shetale - Farm Pond Scheme / मागेल त्याला शेतालं - शेत तलाव योजना', 
'Subsidy for construction of farm ponds to ensure irrigation in drought-prone areas. दुष्काळी भागात सिंचन सुनिश्चित करण्यासाठी शेत तलाव बांधकामासाठी अनुदान.', 
'Individual farmers with cultivable land. शेतीयोग्य जमीन असलेले वैयक्तिक शेतकरी.', 
'Subsidy from ₹14,433 to ₹75,000 based on pond size. तलावाच्या आकारानुसार ₹१४,४३३ ते ₹७५,००० अनुदान.', 
'Land Ownership, Aadhar, Bank Account / जमीन मालकी, आधार, बँक खाते', NOW()),

-- Health & Social Security
('Ayushman Bharat - PMJAY / आयुष्मान भारत', 
'Health insurance scheme providing cashless treatment for serious illnesses. गंभीर आजारांसाठी रोखरहित उपचार प्रदान करणारी आरोग्य विमा योजना.', 
'Economically vulnerable families, BPL cardholders. आर्थिकदृष्ट्या असुरक्षित कुटुंबे, BPL कार्डधारक.', 
'₹5 lakh annual health coverage per family for hospitalization. रुग्णालयात दाखल होण्यासाठी दर कुटुंबी ₹५ लाख वार्षिक आरोग्य कव्हरेज.', 
'Ration Card, Aadhar, BPL Certificate / रेशन कार्ड, आधार, BPL प्रमाणपत्र', NOW()),

('Mahatma Jyotiba Phule Jan Arogya Yojana / महात्मा ज्योतिराव फुले जन आरोग्य योजना', 
'Free medical treatment for BPL and low-income families in Maharashtra. महाराष्ट्रातील BPL आणि कमी उत्पन्न कुटुंबांसाठी मोफत वैद्यकीय उपचार.', 
'Yellow, Orange ration cardholders, Antyodaya cardholders. पिवळे, नारिंगी रेशन कार्डधारक, अंत्योदय कार्डधारक.', 
'Cashless treatment up to ₹1.50 lakh per family annually. दरवर्षी प्रति कुटुंब ₹१.५० लाख पर्यंत रोखरहित उपचार.', 
'Ration Card, Aadhar Card, Income Proof / रेशन कार्ड, आधार कार्ड, उत्पन्न पुरावा', NOW()),

('Sanjay Gandhi Niradhar Anudan Yojana / संजय गांधी निराधार अनुदान योजना', 
'Monthly financial assistance for destitute persons including widows, disabled, and orphans. विधवा, अपंग आणि अनाथांसह निराधार व्यक्तींसाठी मासिक आर्थिक सहाय्य.', 
'Destitute widows, disabled persons, critically ill, orphans. निराधार विधवा, अपंग व्यक्ती, गंभीर आजारी, अनाथ.', 
'₹1,500 per month financial assistance. दरमहा ₹१,५०० आर्थिक सहाय्य.', 
'Age Proof, Income Certificate, Medical Certificate (if applicable), Aadhar / वय पुरावा, उत्पन्न प्रमाणपत्र, वैद्यकीय प्रमाणपत्र (लागू असल्यास), आधार', NOW()),

-- Housing Schemes
('Pradhan Mantri Awas Yojana - Gramin / प्रधानमंत्री आवास योजना - ग्रामीण', 
'Financial assistance for construction of pucca houses in rural areas. ग्रामीण भागात पक्की घरे बांधण्यासाठी आर्थिक सहाय्य.', 
'BPL families, homeless, residing in kutcha houses. BPL कुटुंबे, बेघर, कच्च्या घरात राहणारे.', 
'₹1.20 lakh for plains, ₹1.30 lakh for hilly/difficult areas. मैदानी भागासाठी ₹१.२० लाख, डोंगराळ/कठीण भागासाठी ₹१.३० लाख.', 
'Aadhar, BPL Certificate, Bank Account, Land Ownership / आधार, BPL प्रमाणपत्र, बँक खाते, जमीन मालकी', NOW()),

('Pradhan Mantri Awas Yojana - Urban / प्रधानमंत्री आवास योजना - शहरी', 
'Affordable housing for urban poor under different components. विविध घटकांअंतर्गत शहरी गरिबांसाठी परवडणारे गृहनिर्माण.', 
'EWS/LIG families in urban areas, first-time home buyers. शहरी भागातील EWS/LIG कुटुंबे, प्रथमच घर खरेदी करणारे.', 
'Subsidy up to ₹2.50 lakh, interest subsidy on home loans. ₹२.५० लाख पर्यंत अनुदान, गृहकर्जावर व्याज सवलत.', 
'Income Proof, Residence Proof, Aadhar, PAN Card / उत्पन्न पुरावा, निवास पुरावा, आधार, पॅन कार्ड', NOW()),

('Ramai Awas Yojana / रमाई आवास योजना', 
'Housing scheme for Scheduled Caste and Neo-Buddhist families. अनुसूचित जाती आणि नवबौद्ध कुटुंबांसाठी गृहनिर्माण योजना.', 
'SC/Neo-Buddhist families without pucca house. पक्के घर नसलेली अ.जा./नवबौद्ध कुटुंबे.', 
'₹1.32 lakh rural, ₹1.42 lakh hilly, ₹2.50 lakh urban areas. ग्रामीण ₹१.३२ लाख, डोंगराळ ₹१.४२ लाख, शहरी ₹२.५० लाख.', 
'Caste Certificate, Income Certificate, Aadhar, Bank Details / जात प्रमाणपत्र, उत्पन्न प्रमाणपत्र, आधार, बँक तपशील', NOW()),

-- Senior Citizen & Disability
('Indira Gandhi National Old Age Pension / इंदिरा गांधी राष्ट्रीय वृद्धापकाळ निवृत्तीवेतन', 
'Monthly pension for elderly citizens from BPL families. BPL कुटुंबातील वृद्ध नागरिकांसाठी मासिक निवृत्तीवेतन.', 
'Persons aged 60+ from BPL families. BPL कुटुंबातील ६०+ वयोगटातील व्यक्ती.', 
'₹1,500 per month pension. दरमहा ₹१,५०० निवृत्तीवेतन.', 
'Age Proof, BPL Card, Aadhar, Bank Passbook / वय पुरावा, BPL कार्ड, आधार, बँक पासबुक', NOW()),

('Disability Pension Scheme / अपंगत्व निवृत्तीवेतन योजना', 
'Monthly pension for persons with disabilities. अपंग व्यक्तींसाठी मासिक निवृत्तीवेतन.', 
'Persons with 40% or more disability from economically weak families. आर्थिकदृष्ट्या दुर्बल कुटुंबातील ४०% किंवा अधिक अपंगत्व असलेल्या व्यक्ती.', 
'₹1,500 monthly pension, additional medical benefits. ₹१,५०० मासिक निवृत्तीवेतन, अतिरिक्त वैद्यकीय फायदे.', 
'Disability Certificate (40%+), Income Certificate, Aadhar / अपंगत्व प्रमाणपत्र (४०%+), उत्पन्न प्रमाणपत्र, आधार', NOW()),

-- Employment & Skill Development
('Pradhan Mantri Mudra Yojana / प्रधानमंत्री मुद्रा योजना', 
'Loans for micro-enterprises and small businesses without collateral. लघु उद्योग आणि छोटे व्यवसायांसाठी तारणाशिवाय कर्ज.', 
'Micro and small entrepreneurs, self-employed individuals. सूक्ष्म आणि लहान उद्योजक, स्वयंरोजगार व्यक्ती.', 
'Loans up to ₹10 lakh in three categories: Shishu, Kishore, Tarun. तीन श्रेणींमध्ये ₹१० लाख पर्यंत कर्ज: शिशु, किशोर, तरुण.', 
'Business Plan, Aadhar, PAN, Address Proof / व्यवसाय योजना, आधार, पॅन, पत्ता पुरावा', NOW()),

('Mahatma Gandhi National Rural Employment Guarantee / महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार हमी', 
'Guaranteed 100 days of wage employment to rural households. ग्रामीण कुटुंबांना वर्षातील १०० दिवसांच्या मजुरीच्या रोजगाराची हमी.', 
'Adult members of rural households willing to do unskilled manual work. अकुशल शारीरिक काम करण्यास इच्छुक ग्रामीण कुटुंबांचे प्रौढ सदस्य.', 
'100 days guaranteed employment, minimum wages as per state norms. १०० दिवसांच्या हमीची रोजगार, राज्य नियमांनुसार किमान वेतन.', 
'Job Card, Aadhar, Bank Account / जॉब कार्ड, आधार, बँक खाते', NOW()),

('Stand-Up India Scheme / स्टँड-अप इंडिया योजना', 
'Bank loans for SC/ST and women entrepreneurs to promote entrepreneurship. उद्योजकत्व प्रोत्साहित करण्यासाठी अ.जा./अ.ज.जमा. आणि महिला उद्योजकांसाठी बँक कर्ज.', 
'SC/ST and women entrepreneurs starting greenfield enterprises. ग्रीनफील्ड उपक्रम सुरू करणारे अ.जा./अ.ज.जमा. आणि महिला उद्योजक.', 
'Loans between ₹10 lakh to ₹1 crore for new enterprises. नवीन उपक्रमांसाठी ₹१० लाख ते ₹१ कोटी दरम्यान कर्ज.', 
'Business Plan, Caste/Gender Certificate, Aadhar, PAN / व्यवसाय योजना, जात/लिंग प्रमाणपत्र, आधार, पॅन', NOW()),

-- Energy & Environment
('PM Surya Ghar Muft Bijli Yojana / प्रधानमंत्री सूर्यघर मोफत वीज योजना', 
'Subsidy for installation of rooftop solar panels for residential households. निवासी कुटुंबांसाठी छतावरील सौर पॅनेल स्थापनेवर अनुदान.', 
'Residential households across India. संपूर्ण भारतातील निवासी कुटुंबे.', 
'Up to ₹78,000 subsidy for 3kW solar rooftop system. ३kW सौर छत प्रणालीसाठी ₹७८,००० पर्यंत अनुदान.', 
'Electricity Bill, House Ownership Proof, Aadhar, Bank Account / वीज बिल, घर मालकीचा पुरावा, आधार, बँक खाते', NOW()),

('Maharashtra Solar Pump Scheme / महाराष्ट्र सौर पंप योजना', 
'Subsidy for installation of solar-powered agricultural pumps for farmers. शेतकऱ्यांसाठी सौरऊर्जेवर चालणाऱ्या कृषी पंपांच्या स्थापनेवर अनुदान.', 
'Farmers with agricultural land, existing pump connection holders. शेतीयोग्य जमीन असलेले शेतकरी, सध्याचे पंप कनेक्शन धारक.', 
'Up to 95% subsidy for small farmers, lower rates for others. लहान शेतकऱ्यांसाठी ९५% पर्यंत अनुदान, इतरांसाठी कमी दर.', 
'Land Records, Electricity Connection (if converting), Aadhar / जमीन नोंदी, वीज कनेक्शन (रूपांतरित करत असल्यास), आधार', NOW()),

-- Additional Important Schemes
('Atal Pension Yojana / अटल पेन्शन योजना', 
'Government-backed pension scheme for unorganized sector workers. असंघटित क्षेत्रातील कामगारांसाठी सरकार समर्थित निवृत्तीवेतन योजना.', 
'Citizens aged 18-40 years, primarily from unorganized sector. १८-४० वर्षे वयोगटातील नागरिक, प्रामुख्याने असंघटित क्षेत्रातून.', 
'Guaranteed pension from ₹1,000 to ₹5,000 per month after 60 years. ६० वर्षांनंतर दरमहा ₹१,००० ते ₹५,००० हमीचे निवृत्तीवेतन.', 
'Savings Bank Account, Aadhar, Mobile Number / बचत बँक खाते, आधार, मोबाइल नंबर', NOW()),

('Pradhan Mantri Matru Vandana Yojana / प्रधानमंत्री मातृ वंदना योजना', 
'Maternity benefit program providing cash incentive for first living child. पहिल्या जिवंत मुलासाठी रोख प्रेरणा प्रदान करणारा मातृत्व लाभ कार्यक्रम.', 
'Pregnant and lactating women for first living child. पहिल्या जिवंत मुलासाठी गर्भवती आणि स्तनपान करणाऱ्या महिला.', 
'₹5,000 cash benefit in three installments. तीन हप्त्यांमध्ये ₹५,००० रोख लाभ.', 
'Pregnancy Certificate, Mother-Child Health Card, Aadhar, Bank Account / गर्भधारणा प्रमाणपत्र, आई-बाल आरोग्य कार्ड, आधार, बँक खाते', NOW()),

('Beti Bachao Beti Padhao / बेटी बचाओ बेटी पढाओ', 
'Campaign to address declining child sex ratio and promote girls education. घटत्या बाल लिंगानुपातला तोंड देण्यासाठी आणि मुलींच्या शिक्षणाला प्रोत्साहन देण्यासाठी मोहीम.', 
'Girl child, focus on districts with low child sex ratio. मुलगी, कमी बाल लिंगानुपात असलेल्या जिल्ह्यांवर लक्ष केंद्रित.', 
'Education support, awareness campaigns, financial incentives. शिक्षण समर्थन, जनजागृती मोहिमा, आर्थिक प्रोत्साहन.', 
'Girl Child Birth Certificate, Aadhar / मुलीचा जन्म दाखला, आधार', NOW()),

('Sukanya Samriddhi Yojana / सुकन्या समृद्धी योजना', 
'Small deposit savings scheme for girl child with high interest rate. उच्च व्याजदराने मुलीसाठी लहान ठेव बचत योजना.', 
'Parents/guardians of girl child below 10 years. १० वर्षांखालील मुलीचे पालक/पालक.', 
'High interest (currently 8%+), tax benefits, maturity at 21 years. उच्च व्याज (सध्या ८%+), कर लाभ, २१ वर्षांनी परिपक्वता.', 
'Girl Child Birth Certificate, Parent Aadhar, Address Proof / मुलीचा जन्म दाखला, पालक आधार, पत्ता पुरावा', NOW());
