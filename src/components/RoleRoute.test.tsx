import { render, screen } from '@testing-library/react';
import { RoleRoute } from './RoleRoute';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => {
    return <div data-testid="navigate">Redirecting to {to}</div>;
  },
  useLocation: jest.fn(() => ({ pathname: '/some-route' })),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('RoleRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has allowed role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'coach@test.com', role: UserRole.COACH },
    });

    render(
      <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
        <div data-testid="role-content">Role Content</div>
      </RoleRoute>
    );

    expect(screen.getByTestId('role-content')).toBeInTheDocument();
    expect(screen.getByText('Role Content')).toBeInTheDocument();
  });

  it('should render for admin when admin is in allowed roles', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'admin@test.com', role: UserRole.ADMIN },
    });

    render(
      <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
        <div data-testid="role-content">Role Content</div>
      </RoleRoute>
    );

    expect(screen.getByTestId('role-content')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user role not in allowed roles', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'player@test.com', role: UserRole.PLAYER },
    });

    render(
      <RoleRoute allowedRoles={[UserRole.COACH, UserRole.ADMIN]}>
        <div>Role Content</div>
      </RoleRoute>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to /dashboard')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <RoleRoute allowedRoles={[UserRole.COACH]}>
        <div>Role Content</div>
      </RoleRoute>
    );

    expect(screen.getByText('Redirecting to /login')).toBeInTheDocument();
  });

  it('should show loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(
      <RoleRoute allowedRoles={[UserRole.COACH]}>
        <div>Role Content</div>
      </RoleRoute>
    );

    expect(document.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByText('Role Content')).not.toBeInTheDocument();
  });

  it('should work with single allowed role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'parent@test.com', role: UserRole.PARENT },
    });

    render(
      <RoleRoute allowedRoles={[UserRole.PARENT]}>
        <div data-testid="role-content">Parent Content</div>
      </RoleRoute>
    );

    expect(screen.getByTestId('role-content')).toBeInTheDocument();
  });

  it('should work with all roles allowed', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'player@test.com', role: UserRole.PLAYER },
    });

    render(
      <RoleRoute allowedRoles={[UserRole.PLAYER, UserRole.COACH, UserRole.ADMIN, UserRole.PARENT]}>
        <div data-testid="role-content">All Roles Content</div>
      </RoleRoute>
    );

    expect(screen.getByTestId('role-content')).toBeInTheDocument();
  });

  it('should redirect when user is null but authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
    });

    render(
      <RoleRoute allowedRoles={[UserRole.COACH]}>
        <div>Role Content</div>
      </RoleRoute>
    );

    expect(screen.getByText('Redirecting to /dashboard')).toBeInTheDocument();
  });
});
