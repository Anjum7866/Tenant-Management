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
    };

    const handleLogout = () => {
        setStoredToken(null);
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return <PropertiesPage onLogout={handleLogout} />;
}

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
