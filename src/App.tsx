import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Layout from './components/layout';
import AppRoutes from './routes';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import { ThemeProvider } from './components/theme/theme-provider';
import { Toaster } from 'sonner';
import { AuthGuard } from './components/auth/auth-guard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Initialize orderType from localStorage or default to 'dine-in'
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'orders'>(() => {
    const savedOrderType = localStorage.getItem('orderType');
    return (savedOrderType as 'dine-in' | 'takeaway' | 'orders') || 'dine-in';
  });

  // Save orderType to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('orderType', orderType);
  }, [orderType]);

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
                  <Layout orderType={orderType} onOrderTypeChange={setOrderType}>
                    <AppRoutes orderType={orderType} />
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
    </QueryClientProvider>
  );
}

export default App;
