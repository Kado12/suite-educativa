import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AcademicPage } from './pages/academic/AcademicPage';
import { PeoplePage } from './pages/people/PeoplePage';
import { UsersPage } from './pages/users/UsersPage';
import { EnrollmentPage } from './pages/enrollment/EnrollmentPage';
import { SchedulingPage } from './pages/scheduling/SchedulingPage';
import { AttendancePage } from './pages/attendance/AttendancePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-neutral-500)' }}>Cargando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/academic" element={<AcademicPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/enrollment" element={<EnrollmentPage />} />
            <Route path="/scheduling" element={<SchedulingPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            {/* Las demás rutas irán en fases siguientes */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ToastProvider>
);

export default App;