import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval'; // ✅ IndexedDB helper

import AppRoutes from './routes/index.tsx';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';

import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { setupQZSecurity } from './lib/qz/qzSetup';
import { ThemeProvider } from "@/components/composed/theme-provider.tsx";
import { AuthGuard } from "@/components/composed/auth-guard.tsx";
import Layout from "@/components/composed/layout.tsx";

// ✅ Create IndexedDB persister
function createIDBPersister(key: IDBValidKey = 'ScalePOS-cache'): Persister {
    return {
        persistClient: async (client: PersistedClient) => {
            await set(key, client);
        },
        restoreClient: async () => {
            return await get<PersistedClient>(key);
        },
        removeClient: async () => {
            await del(key);
        },
    };
}

const idbPersister = createIDBPersister('ScalePOS-cache');

// ✅ Persist React Query cache in IndexedDB
persistQueryClient({
    queryClient,
    persister: idbPersister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

function App() {
    useEffect(() => {
        const initQZ = async () => {
            try {
                await setupQZSecurity();
                console.log('QZ Tray security initialized');
            } catch (error) {
                console.error('Failed to initialize QZ Tray security:', error);
            }
        };

        if (typeof window.qz !== 'undefined') {
            initQZ();
        } else {
            const checkQz = setInterval(() => {
                if (typeof window.qz !== 'undefined') {
                    clearInterval(checkQz);
                    initQZ();
                }
            }, 1000);
            setTimeout(() => clearInterval(checkQz), 10000);
        }
    }, []);

    useEffect(() => {
        const handleBeforeUnload = () => {
            queryClient.clear();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultTheme="system" storageKey="restaurant-theme">
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            path="/*"
                            element={
                                <AuthGuard>
                                    <Layout>
                                        <AppRoutes />
                                    </Layout>
                                </AuthGuard>
                            }
                        />
                    </Routes>
                    <Toaster
                        richColors
                        position="top-right"
                        closeButton
                        theme="system"
                        duration={3000}
                    />
                </Router>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

export default App;
