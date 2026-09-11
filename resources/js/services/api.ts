import axios from 'axios';

const TOKEN_KEY = 'tenant_manager_token';

export const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

export const getStoredToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
    if (!token) {
        localStorage.removeItem(TOKEN_KEY);
        return;
    }

    localStorage.setItem(TOKEN_KEY, token);
};

api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});
