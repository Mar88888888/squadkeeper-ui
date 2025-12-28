import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { RoleRoute } from './components/RoleRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { UserListPage } from './pages/UserListPage';
import { GroupManagementPage } from './pages/GroupManagementPage';
import { TrainingsPage } from './pages/TrainingsPage';
import { TrainingDetailsPage } from './pages/TrainingDetailsPage';
import { UserRole } from './types';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/list"
            element={
              <AdminRoute>
                <UserListPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <AdminRoute>
                <GroupManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/trainings"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <TrainingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/trainings/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <TrainingDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
