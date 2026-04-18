import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { RoleRoute } from './components/RoleRoute';
import { AppLayout } from './components/layout';
import { LoginPage } from './pages/auth';
import { DashboardPage } from './pages/dashboard';
import { UserManagementPage, UserListPage, GroupManagementPage } from './pages/admin';
import { TrainingsPage, TrainingDetailsPage } from './pages/trainings';
import { MatchesPage, MatchDetailsPage } from './pages/matches';
import { CalendarPage } from './pages/calendar';
import { MyStatsPage, TeamStatsPage, ChildStatsPage, PlayerStatsPage, TeamOfMonthPage } from './pages/stats';
import { MyGroupsPage } from './pages/groups';
import { ContactsPage } from './pages/contacts';
import { SquadListPage, SquadBuilderPage } from './pages/squads';
import { ObjectiveManagementPage, MyObjectivesPage } from './pages/objectives';
import { UserRole } from './types';

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

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
                <LayoutWrapper><UserManagementPage /></LayoutWrapper>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/list"
            element={
              <AdminRoute>
                <LayoutWrapper><UserListPage /></LayoutWrapper>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <AdminRoute>
                <LayoutWrapper><GroupManagementPage /></LayoutWrapper>
              </AdminRoute>
            }
          />
          <Route
            path="/trainings"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <LayoutWrapper><TrainingsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/trainings/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <LayoutWrapper><TrainingDetailsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <LayoutWrapper><MatchesPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/matches/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <LayoutWrapper><MatchDetailsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <LayoutWrapper><CalendarPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/stats/my"
            element={
              <RoleRoute allowedRoles={[UserRole.PLAYER]}>
                <LayoutWrapper><MyStatsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/objectives/my"
            element={
              <RoleRoute allowedRoles={[UserRole.PLAYER]}>
                <LayoutWrapper><MyObjectivesPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/objectives/manage"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <LayoutWrapper><ObjectiveManagementPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/stats/team"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <LayoutWrapper><TeamStatsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/stats/player/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
                <LayoutWrapper><PlayerStatsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/stats/children"
            element={
              <RoleRoute allowedRoles={[UserRole.PARENT]}>
                <LayoutWrapper><ChildStatsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/stats/team-of-month"
            element={
              <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.COACH, UserRole.PLAYER, UserRole.PARENT]}>
                <LayoutWrapper><TeamOfMonthPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/my-groups"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH]}>
                <LayoutWrapper><MyGroupsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <RoleRoute allowedRoles={[UserRole.PLAYER, UserRole.PARENT, UserRole.COACH, UserRole.ADMIN]}>
                <LayoutWrapper><ContactsPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/squads"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH]}>
                <LayoutWrapper><SquadListPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/squads/new"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH]}>
                <LayoutWrapper><SquadBuilderPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/squads/:id"
            element={
              <RoleRoute allowedRoles={[UserRole.COACH]}>
                <LayoutWrapper><SquadBuilderPage /></LayoutWrapper>
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <LayoutWrapper><DashboardPage /></LayoutWrapper>
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
