// PASTE THIS INTO menuNavigator.js after handleComplaintFormPhoto() method (around line 421)

    async handleComplaintStatusMobile(sock, tenantId, userId, input) {
    const session = this.getSession(userId);
    const lang = session.language;
    const mobile = input.trim();

    // Validate mobile number
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
        const invalidMsg = lang === 'en' ? '❌ Invalid mobile number. Please enter a 10-digit number:' :
            lang === 'mr' ? '❌ अवैध मोबाइल नंबर. कृपया 10 अंकी नंबर प्रविष्ट करा:' :
                '❌ अमान्य मोबाइल नंबर। कृपया 10 अंकों का नंबर दर्ज करें:';
        await sock.sendMessage(userId, { text: invalidMsg });
        return;
    }

    const complaints = await this.store.getComplaintsByMobile(tenantId, mobile);

    if (!complaints || complaints.length === 0) {
        const noComplaints = lang === 'en' ? '❌ No complaints found for this mobile number.' :
            lang === 'mr' ? '❌ या मोबाइल नंबरसाठी कोणत्याही तक्रारी सापडल्या नाहीत.' :
                '❌ इस मोबाइल नंबर के लिए कोई शिकायत नहीं मिली।';
        await sock.sendMessage(userId, { text: noComplaints });
    } else {
        // Show most recent complaint status
        const complaint = complaints[0];
        const statusEmoji = complaint.status === 'Resolved' ? '✅' : complaint.status === 'In Progress' ? '⏳' : '🔴';
        const statusText = lang === 'en' ?
            `${statusEmoji} *Complaint Status*\n\nComplaint ID: #${complaint.id}\nStatus: ${complaint.status}\nCategory: ${complaint.category}\nPriority: ${complaint.priority}\n\nProblem: ${complaint.problem}\n\n_Latest complaint shown. Total: ${complaints.length}_` :
            lang === 'mr' ?
                `${statusEmoji} *तक्रार स्थिती*\n\nतक्रार क्रमांक: #${complaint.id}\nस्थिती: ${complaint.status}\nप्रकार: ${complaint.category}\nप्राधान्य: ${complaint.priority}\n\nसमस्या: ${complaint.problem}\n\n_नवीनतम तक्रार दर्शविली. एकूण: ${complaints.length}_` :
                `${statusEmoji} *शिकायत स्थिति*\n\nशिकायत ID: #${complaint.id}\nस्थिति: ${complaint.status}\nश्रेणी: ${complaint.category}\nप्राथमिकता: ${complaint.priority}\n\nसमस्या: ${complaint.problem}\n\n_नवीनतम शिकायत दिखाई गई। कुल: ${complaints.length}_`;
        await sock.sendMessage(userId, { text: statusText });
    }

    session.currentMenu = MENU_STATES.COMPLAINTS_MENU;
    await this.showComplaintsMenu(sock, userId, lang);
}

    async handleViewComplaintsMobile(sock, tenantId, userId, input) {
    const session = this.getSession(userId);
    const lang = session.language;
    const mobile = input.trim();

    // Validate mobile number
    if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
        const invalidMsg = lang === 'en' ? '❌ Invalid mobile number. Please enter a 10-digit number:' :
            lang === 'mr' ? '❌ अवैध मोबाइल नंबर. कृपया 10 अंकी नंबर प्रविष्ट करा:' :
                '❌ अमान्य मोबाइल नंबर। कृपया 10 अंकों का नंबर दर्ज करें:';
        await sock.sendMessage(userId, { text: invalidMsg });
        return;
    }

    const complaints = await this.store.getComplaintsByMobile(tenantId, mobile);

    if (!complaints || complaints.length === 0) {
        const noComplaints = lang === 'en' ? '❌ No complaints found for this mobile number.' :
            lang === 'mr' ? '❌ या मोबाइल नंबरसाठी कोणत्याही तक्रारी सापडल्या नाहीत.' :
                '❌ इस मोबाइल नंबर के लिए कोई शिकायत नहीं मिली।';
        await sock.sendMessage(userId, { text: noComplaints });
    } else {
        let listText = lang === 'en' ? `📋 *Your Complaints* (${complaints.length})\n\n` :
            lang === 'mr' ? `📋 *तुमच्या तक्रारी* (${complaints.length})\n\n` :
                `📋 *आपकी शिकायतें* (${complaints.length})\n\n`;

        complaints.forEach((complaint, index) => {
            const statusEmoji = complaint.status === 'Resolved' ? '✅' : complaint.status === 'In Progress' ? '⏳' : '🔴';
            const date = new Date(complaint.created_at).toLocaleDateString(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');

            listText += lang === 'en' ?
                `${index + 1}. ${statusEmoji} ID: #${complaint.id}\n   ${complaint.category} - ${complaint.status}\n   ${date}\n\n` :
                lang === 'mr' ?
                    `${index + 1}. ${statusEmoji} क्रमांक: #${complaint.id}\n   ${complaint.category} - ${complaint.status}\n   ${date}\n\n` :
                    `${index + 1}. ${statusEmoji} ID: #${complaint.id}\n   ${complaint.category} - ${complaint.status}\n   ${date}\n\n`;
        });

        await sock.sendMessage(userId, { text: listText });
    }

    session.currentMenu = MENU_STATES.COMPLAINTS_MENU;
    await this.showComplaintsMenu(sock, userId, lang);
}
