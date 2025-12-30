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
import { MatchesPage } from './pages/MatchesPage';
import { MatchDetailsPage } from './pages/MatchDetailsPage';
import { CalendarPage } from './pages/CalendarPage';
import { MyStatsPage } from './pages/MyStatsPage';
import { TeamStatsPage } from './pages/TeamStatsPage';
import { ChildStatsPage } from './pages/ChildStatsPage';
import { MyGroupsPage } from './pages/MyGroupsPage';
import { ContactsPage } from './pages/ContactsPage';
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
            path="/matches"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <MatchesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/matches/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <MatchDetailsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <CalendarPage />
              </RoleRoute>
            }
          />
          <Route
            path="/stats/my"
            element={
              <RoleRoute allowedRoles={[UserRole.PLAYER]}>
                <MyStatsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/stats/team"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <TeamStatsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/stats/children"
            element={
              <RoleRoute allowedRoles={[UserRole.PARENT]}>
                <ChildStatsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/my-groups"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH]}>
                <MyGroupsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <RoleRoute allowedRoles={[UserRole.PLAYER, UserRole.PARENT, UserRole.COACH, UserRole.ADMIN]}>
                <ContactsPage />
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
