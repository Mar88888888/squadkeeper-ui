import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { useAuth } from '../contexts/AuthContext';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { from: { pathname: '/dashboard' } } }),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('Football Academy')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should update email input value', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password input value', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(passwordInput).toHaveValue('password123');
  });

  it('should call login on form submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should navigate to dashboard on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should display error on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
  });

  it('should disable submit button during loading', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('should display contact admin message', () => {
    render(<LoginPage />);

    expect(screen.getByText('Contact your administrator to get an account')).toBeInTheDocument();
  });

  it('should require email field', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    expect(emailInput).toBeRequired();
  });

  it('should require password field', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toBeRequired();
  });

  it('should have email input type', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should have password input type', () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
