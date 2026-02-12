export interface Staff {
    id: string;
    name: string;
    mobile: string;
    role: string;
    area?: string;
    category: 'Office' | 'Party' | 'Cooperative';
    keywords: string[];
    permissions?: string[];
    tenant_id?: string;
}
