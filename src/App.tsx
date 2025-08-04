import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {persistQueryClient} from '@tanstack/react-query-persist-client';
import {createSyncStoragePersister} from '@tanstack/query-sync-storage-persister';

import AppRoutes from './routes/index.tsx';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';

import {Toaster} from 'sonner';

import {queryClient} from './lib/queryClient';
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {useEffect} from 'react';
import {setupQZSecurity} from './lib/qz/qzSetup';
import {ThemeProvider} from "@/components/composed/theme-provider.tsx";
import {AuthGuard} from "@/components/composed/auth-guard.tsx";
import Layout from "@/components/composed/layout.tsx";

// Set up localStorage persistence for React Query
const localStoragePersister = createSyncStoragePersister({
    storage: window.sessionStorage,
    key: 'scalePOS-cache',
});

// Persist the React Query cache to localStorage
persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

function App() {
    useEffect(() => {
        // Initialize QZ Tray security when the app loads
        const initQZ = async () => {
            try {
                await setupQZSecurity();
                console.log('QZ Tray security initialized');
            } catch (error) {
                console.error('Failed to initialize QZ Tray security:', error);
            }
        };

        // Only initialize if QZ is available
        if (typeof window.qz !== 'undefined') {
            initQZ();
        } else {
            // Wait for QZ to be available
            const checkQz = setInterval(() => {
                if (typeof window.qz !== 'undefined') {
                    clearInterval(checkQz);
                    initQZ();
                }
            }, 1000);

            // Stop checking after 10 seconds
            setTimeout(() => clearInterval(checkQz), 10000);
        }
    }, []);

    // Add event listener to clear React Query cache on tab close or page reload
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Clear React Query cache
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
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/signup" element={<Signup/>}/>
                        <Route
                            path="/*"
                            element={
                                <AuthGuard>
                                    <Layout>
                                        <AppRoutes/>
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
                        duration={4000}
                    />
                </Router>
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false}/>
        </QueryClientProvider>
    );
}

export default App;
