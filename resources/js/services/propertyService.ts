import { api } from './api';
import { Property, PropertyPayload, PropertiesResponse } from '../types/property';
import { LoginRequest, LoginResponse, User } from '../types/auth';
import { DashboardResponse } from '../types/dashboard';

export const propertyService = {
    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/login', data);
        return response.data;
    },

    async logout(): Promise<void> {
        await api.post('/logout');
    },

    async me(): Promise<User> {
        const response = await api.get<{ user: User }>('/me');
        return response.data.user;
    },

    async getDashboard(): Promise<DashboardResponse> {
        const response = await api.get<DashboardResponse>('/dashboard');
        return response.data;
    },

    async getProperties(params: { search?: string; city?: string; status?: string; page?: number }): Promise<PropertiesResponse> {
        const response = await api.get<PropertiesResponse>('/properties', {
            params: {
                search: params.search || undefined,
                city: params.city || undefined,
                status: params.status && params.status !== 'all' ? params.status : undefined,
                page: params.page || 1,
            },
        });

        return response.data;
    },

    async createProperty(data: PropertyPayload): Promise<Property> {
        const response = await api.post<Property>('/properties', data);
        return response.data;
    },

    async updateProperty(id: number, data: Partial<PropertyPayload>): Promise<Property> {
        const response = await api.put<Property>(`/properties/${id}`, data);
        return response.data;
    },

    async deleteProperty(id: number): Promise<void> {
        await api.delete(`/properties/${id}`);
    },
};
