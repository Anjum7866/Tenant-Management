export type DashboardStats = {
    properties: number;
    units: number;
    occupied_units: number;
    available_units: number;
    active_tenants: number;
    monthly_expected_rent: number;
    pending_payments: number;
    overdue_payments: number;
    open_maintenance: number;
};

export type DashboardResponse = {
    role: 'super_admin' | 'property_manager' | 'tenant';
    stats: DashboardStats;
    data: {
        properties: Array<Record<string, unknown>>;
        units: Array<Record<string, unknown>>;
        tenants: Array<Record<string, unknown>>;
        leases: Array<Record<string, unknown>>;
        payments: Array<Record<string, unknown>>;
        maintenance: Array<Record<string, unknown>>;
        documents: Array<Record<string, unknown>>;
        messages: Array<Record<string, unknown>>;
    };
};
