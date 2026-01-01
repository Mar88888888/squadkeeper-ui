import { render, screen } from '@testing-library/react';
import { AdminRoute } from './AdminRoute';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => {
    mockNavigate(to);
    return <div data-testid="navigate">Redirecting to {to}</div>;
  },
  useLocation: jest.fn(() => ({ pathname: '/admin' })),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('AdminRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user is admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'admin@test.com', role: UserRole.ADMIN },
    });

    render(
      <AdminRoute>
        <div data-testid="protected-content">Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user is player', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'player@test.com', role: UserRole.PLAYER },
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to /dashboard')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user is coach', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'coach@test.com', role: UserRole.COACH },
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByText('Redirecting to /dashboard')).toBeInTheDocument();
  });

  it('should redirect to dashboard when user is parent', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'parent@test.com', role: UserRole.PARENT },
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByText('Redirecting to /dashboard')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
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
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>
    );

    expect(document.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
