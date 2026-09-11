import '../css/app.css';
import './bootstrap';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LoginPage from './Pages/LoginPage';
import PropertiesPage from './Pages/PropertiesPage';
import { getStoredToken, setStoredToken } from './services/api';
import { propertyService } from './services/propertyService';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(getStoredToken()));
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    };

    useEffect(() => {
        const sync = async () => {
            const token = getStoredToken();
            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                await propertyService.me();
                setIsAuthenticated(true);
            } catch {
                setStoredToken(null);
                setIsAuthenticated(false);
            }
        };

        void sync();
    }, []);

    const handleLogin = async (email: string, password: string) => {
        const response = await propertyService.login({ email, password });
        setStoredToken(response.token);
        setIsAuthenticated(true);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        setStoredToken(null);
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    const section = currentPath.replace(/^\//, '').split('/')[0] || 'dashboard';
    const validSections = ['dashboard', 'properties', 'units', 'tenants', 'leases', 'payments', 'maintenance', 'documents', 'messages'];

    return (
        <PropertiesPage
            activeSection={validSections.includes(section) ? section : 'dashboard'}
            onNavigate={navigate}
            onLogout={handleLogout}
        />
    );
}

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
