import { api } from './api';

export type ManagementResource = 'tenants' | 'units' | 'leases' | 'payments' | 'maintenance' | 'documents' | 'messages';

export const managementService = {
    async list(resource: ManagementResource): Promise<{ data: { data: Array<Record<string, unknown>> } }> {
        const response = await api.get<{ data: { data: Array<Record<string, unknown>> } }>(`/${resource}`);
        return response.data;
    },

    async create(resource: ManagementResource, data: Record<string, unknown>): Promise<void> {
        await api.post(`/${resource}`, data);
    },

    async update(resource: ManagementResource, id: number, data: Record<string, unknown>): Promise<void> {
        await api.put(`/${resource}/${id}`, data);
    },

    async remove(resource: ManagementResource, id: number): Promise<void> {
        await api.delete(`/${resource}/${id}`);
    },
};
