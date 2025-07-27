import {HashRouter as Router, Route, Routes} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import {persistQueryClient} from '@tanstack/react-query-persist-client';
import {createSyncStoragePersister} from '@tanstack/query-sync-storage-persister';
import Layout from './components/layout';
import AppRoutes from './routes';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import {ThemeProvider} from './components/theme/theme-provider';
import {Toaster} from 'sonner';
import {AuthGuard} from './components/auth/auth-guard';
import {queryClient} from './lib/queryClient';
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {useEffect} from 'react';
import {setupQZSecurity} from './lib/qz/qzSetup';

// Set up localStorage persistence for React Query
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'quickquick-cache',
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
