export interface Staff {
    id: string;
    name: string;
    mobile: string;
    role: string;
    area?: string;
    category: 'Office' | 'Party' | 'Cooperative';
    keywords: string[];
}
