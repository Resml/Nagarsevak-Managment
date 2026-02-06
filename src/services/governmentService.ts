export interface GovernmentOffice {
    id: number;
    name: string;
    address: string;
    officerName: string;
    contactNumber: string;
    latitude?: number;
    longitude?: number;
    area?: string;
}

const MOCK_OFFICES: GovernmentOffice[] = [
    {
        id: 1,
        name: "Ward Office No. 12",
        address: "Near Shivaji Park, Shivaji Nagar",
        officerName: "Mr. Rajesh Patil",
        contactNumber: "+91 98765 43210",
        area: "Shivaji Nagar"
    },
    {
        id: 2,
        name: "Water Supply Department",
        address: "Municipal Corporation Building, Main Road",
        officerName: "Ms. Sunita Deshmukh",
        contactNumber: "020-25501234",
        area: "Central"
    },
    {
        id: 3,
        name: "Health Department (Arogya Vibhag)",
        address: "City Hospital Campus, Station Road",
        officerName: "Dr. Sanjay Mehra",
        contactNumber: "020-25505678",
        area: "Station Road"
    },
    {
        id: 4,
        name: "Electricity Board (MSEDCL)",
        address: "Power House, Ganpati Chowk",
        officerName: "Mr. Amit Kumar",
        contactNumber: "1912",
        area: "Ganpati Chowk"
    },
    {
        id: 5,
        name: "Property Tax Office",
        address: "Old MC Building, Market Yard",
        officerName: "Mrs. Vandana Joshi",
        contactNumber: "020-24409988",
        area: "Market Yard"
    }
];

export const GovernmentService = {
    getOffices: async (): Promise<GovernmentOffice[]> => {
        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_OFFICES);
            }, 600);
        });
    },

    addOffice: async (office: Omit<GovernmentOffice, 'id'>): Promise<GovernmentOffice> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newOffice = {
                    ...office,
                    id: Math.max(...MOCK_OFFICES.map(o => o.id)) + 1
                };
                MOCK_OFFICES.push(newOffice);
                resolve(newOffice);
            }, 600);
        });
    }
};
