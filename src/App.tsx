import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import Layout from './components/layout';
import AppRoutes from './routes';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import { ThemeProvider } from './components/theme/theme-provider';
import { Toaster } from 'sonner';
import { AuthGuard } from './components/auth/auth-guard';

const queryClient = new QueryClient();

function App() {
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'orders'>('dine-in');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem>
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
      </Router>
      <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;