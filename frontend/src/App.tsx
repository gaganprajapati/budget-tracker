import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ReportPage } from './pages/ReportPage';
import { PlansPage } from './pages/PlansPage';
import { ActualsPage } from './pages/ActualsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { LocksPage } from './pages/LocksPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<ReportPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/actuals" element={<ActualsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/locks" element={<LocksPage />} />
              </Route>
            </Route>

            <Route path="*" element={<LoginPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};
