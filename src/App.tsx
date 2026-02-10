import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { RoleRoute } from './components/RoleRoute';
import { LoginPage } from './pages/auth';
import { DashboardPage } from './pages/dashboard';
import { UserManagementPage, UserListPage, GroupManagementPage } from './pages/admin';
import { TrainingsPage, TrainingDetailsPage } from './pages/trainings';
import { MatchesPage, MatchDetailsPage } from './pages/matches';
import { CalendarPage } from './pages/calendar';
import { MyStatsPage, TeamStatsPage, ChildStatsPage, PlayerStatsPage } from './pages/stats';
import { MyGroupsPage } from './pages/groups';
import { ContactsPage } from './pages/contacts';
import { SquadListPage, SquadBuilderPage } from './pages/squads';
import { PerformanceScorePage, PerformanceSettingsPage } from './pages/analytics';
import { UserRole } from './types';

function App() {
  return (
    <ThemeProvider>
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
            path="/stats/player/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <PlayerStatsPage />
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
            path="/squads"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH]}>
                <SquadListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/squads/new"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH]}>
                <SquadBuilderPage />
              </RoleRoute>
            }
          />
          <Route
            path="/squads/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH]}>
                <SquadBuilderPage />
              </RoleRoute>
            }
          />
          <Route
            path="/analytics/performance"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH]}>
                <PerformanceScorePage />
              </RoleRoute>
            }
          />
          <Route
            path="/performance-settings/:groupId"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH]}>
                <PerformanceSettingsPage />
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
    </ThemeProvider>
  );
}

export default App;
