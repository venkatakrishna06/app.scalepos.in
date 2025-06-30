import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
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
            duration={4000}
          />
        </Router>
      </ThemeProvider>
      {/*<ReactQueryDevtools initialIsOpen={false} />*/}
    </QueryClientProvider>
  );
}

export default App;
