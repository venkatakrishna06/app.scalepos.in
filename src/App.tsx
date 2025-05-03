import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import Layout from './components/layout';
import AppRoutes from './routes';

const queryClient = new QueryClient();

function App() {
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'orders'>('dine-in');

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout orderType={orderType} onOrderTypeChange={setOrderType}>
          <AppRoutes orderType={orderType} />
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;