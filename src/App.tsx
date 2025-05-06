import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import Layout from './components/layout';
import AppRoutes from './routes';
import Login from './pages/auth/login';
import Signup from './pages/auth/signup';
import { AuthGuard } from './components/auth/auth-guard';

const queryClient = new QueryClient();

function App() {
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'orders'>('dine-in');

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;