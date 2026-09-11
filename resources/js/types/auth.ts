export type Tenant = {
    id: number;
    name: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'property_manager' | 'tenant';
    tenant: Tenant;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = {
    message: string;
    token: string;
    user: User;
};

export type ApiError = {
    message?: string;
    errors?: Record<string, string[]>;
};
