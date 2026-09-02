export const formatAreaName = (name: string, tenantName?: string) => {
    if (!name) return name;
    
    // Check if the tenant is Mamit Chougule
    const isMamit = tenantName && tenantName.toLowerCase().includes('mamit');
    
    if (isMamit) {
        const match = name.match(/^(?:Ward|Sector)\s*(?:Sector\s*)?(\d+)(.*)$/i);
        if (match) {
            return `Airoli - Sector ${match[1]}${match[2]}`;
        }
    }
    return name;
};

export const stripSerialNumber = (text: string | null | undefined) => {
    if (!text) return '';
    // Strip leading number and hyphen, e.g., "1 - SHREE DHAM, Area" -> "SHREE DHAM, Area"
    const match = text.trim().match(/^\d+\s*-\s*(.*)$/);
    if (match) {
        return match[1];
    }
    return text.trim();
};
