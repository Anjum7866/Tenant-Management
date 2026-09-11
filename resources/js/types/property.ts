export type PropertyStatus = 'active' | 'inactive';

export type Property = {
    id: number;
    name: string;
    property_type: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    description: string | null;
    status: PropertyStatus;
    created_at: string;
};

export type PropertyPayload = {
    tenant_id?: number;
    name: string;
    property_type: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    description?: string | null;
    status: PropertyStatus;
};

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type PropertiesResponse = {
    data: Property[];
    meta: PaginationMeta;
};
