# 🏛️ नगरसेवक व्यवस्थापन प्रणाली
### Nagarsevak Management System

> **React + TypeScript + Vite + Supabase** वर बनवलेली आधुनिक प्रशासकीय प्रणाली.

---

## 📌 प्रणालीबद्दल थोडक्यात

नगरसेवकांच्या कार्यालयीन कामकाजासाठी एक संपूर्ण डिजिटल प्रणाली:

- 🗳️ मतदार यादी व्यवस्थापन
- 📋 तक्रारी नोंदणी व निवारण
- 📬 पत्रव्यवहार व्यवस्थापन
- 📅 कार्यक्रम व भेटी नोंदणी
- 📊 वॉर्ड विकासकामे ट्रॅकिंग
- 💰 बजेट व्यवस्थापन
- 🤖 WhatsApp Bot Integration
- 📱 Multi-Device Support

---

## 🔐 डेटा सुरक्षितता (Security)

> **नगरसेवकांसाठी महत्त्वाची माहिती — आपला सर्व डेटा पूर्णपणे सुरक्षित आहे.**

### ✅ मुख्य सुरक्षा वैशिष्ट्ये

- 🔑 **Email + Password Login** — Password शिवाय कोणीही सिस्टीममध्ये प्रवेश करू शकत नाही
- 🏢 **प्रत्येक Ward चा Data वेगळा (Multi-Tenancy)** — एका नगरसेवकाचा डेटा दुसऱ्याला कधीच दिसणार नाही
- 👥 **Role-Based Access** — Admin, Staff, Viewer — प्रत्येकाला फक्त त्यांचेच काम दिसते
- 🔒 **Row Level Security (RLS)** — Database मधील प्रत्येक ओळीवर स्वतंत्र कुलूप
- 🛡️ **AES-256-bit Encryption** — Server वरील Data बँकेसारखा Lock स्वरूपात साठवला जातो
- 🔐 **TLS 1.3 (256-bit) — Data प्रवासात Encryption** — Mobile / Browser वरून Server पर्यंत जाणारा Data कोणालाही वाचता येत नाही
- 🎟️ **JWT HS256 Token** — Login केल्यावर मिळणारी Digital "चावी" Encrypted असते
- ⚡ **Real-Time Permission Control** — Staff ची Permission काढली की त्याच क्षणी Access बंद
- 💾 **Automatic Daily Backup** — Supabase आपोआप रोज Backup घेते — Data कधीच हरवणार नाही
- 📱 **WhatsApp Bot Security** — फक्त Authorized नंबरलाच Bot Response करतो
- 🌐 **ISO 27001 Certified Infrastructure** — Supabase चे Servers आंतरराष्ट्रीय सुरक्षा मानकांनुसार चालतात

---

### 🍎 सोप्या शब्दात

> **"256-bit Encryption म्हणजे असे कुलूप आहे ज्याला जगातील सर्वात शक्तिशाली संगणकही लाखो वर्षांत तोडू शकणार नाही. भारतीय बँका, RBI, लष्कर हेच Encryption वापरतात."**

---

## 🛠️ तांत्रिक माहिती (Developers साठी)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Bot | WhatsApp via Baileys |
| AI | Google Gemini API |
| Voice | Sarvam AI + VAPI |
| Maps | Google Maps API |
| Deploy | Vercel + Render |

### Database Security Layer

```
Supabase PostgreSQL
├── Row Level Security (RLS) ✅
├── Multi-Tenancy (tenant_id isolation) ✅
├── Role-Based Policies (admin/staff/viewer) ✅
├── AES-256 Encryption at Rest ✅
├── TLS 1.3 Encryption in Transit ✅
└── JWT Authentication (HS256) ✅
```

---

## 🚀 Local Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables (.env)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_BOT_API_URL=your_bot_url
```

---

## 📁 Project Structure

```
src/
├── components/     # Reusable UI Components
├── context/        # Auth & App Context
├── hooks/          # Custom React Hooks
├── pages/          # All Page Components
│   ├── complaints/ # तक्रारी
│   ├── letters/    # पत्रव्यवहार
│   ├── sadasya/    # सदस्य यादी
│   ├── staff/      # कर्मचारी
│   ├── ward/       # वॉर्ड कामे
│   ├── voters/     # मतदार यादी
│   └── ...
├── services/       # Supabase Client
└── types/          # TypeScript Types
bot/
├── index.js        # WhatsApp Bot Entry
└── store.js        # Bot State Management
```

---

## 👨‍💻 Development

Built with ❤️ for **Nagarsevak Management** — Empowering local governance with modern technology.

---

*Last Updated: April 2026*
