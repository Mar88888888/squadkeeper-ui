import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '../contexts/AuthContext';
import { attendanceApi } from '../api/attendance';
import { UserRole } from '../types';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock attendanceApi
jest.mock('../api/attendance', () => ({
  attendanceApi: {
    getMyStats: jest.fn(),
    getMyStatsAsParent: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockAttendanceApi = attendanceApi as jest.Mocked<typeof attendanceApi>;

// Suppress act warnings for async state updates that happen after component unmount
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((message) => {
    if (typeof message === 'string' && message.includes('not wrapped in act')) {
      return;
    }
    console.warn(message);
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('DashboardPage', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Common functionality', () => {
    it('should render Football Academy header', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Football Academy')).toBeInTheDocument();
    });

    it('should display user name in header', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      // User name appears in multiple places (header and account info)
      const userNames = screen.getAllByText('John Doe');
      expect(userNames.length).toBeGreaterThan(0);
    });

    it('should display welcome message', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    });

    it('should call logout when logout button clicked', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should display user initials', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Player role', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
    });

    it('should display Player badge', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      // Player text appears in multiple places (badge and account info)
      const playerTexts = screen.getAllByText('Player');
      expect(playerTexts.length).toBeGreaterThan(0);
    });

    it('should show quick stats links', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Trainings')).toBeInTheDocument();
      expect(screen.getByText('Matches')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('should show My Statistics link', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('My Statistics')).toBeInTheDocument();
    });

    it('should display attendance rate', async () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('80%')).toBeInTheDocument();
      });
    });

    it('should fetch player attendance stats', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(mockAttendanceApi.getMyStats).toHaveBeenCalled();
    });
  });

  describe('Coach role', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
        logout: mockLogout,
      });
    });

    it('should display Coach badge', () => {
      render(<DashboardPage />);

      // Coach text appears in multiple places (badge and account info)
      const coachTexts = screen.getAllByText('Coach');
      expect(coachTexts.length).toBeGreaterThan(0);
    });

    it('should show Coach Panel section', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Coach Panel')).toBeInTheDocument();
    });

    it('should show coach-specific links', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Team Statistics')).toBeInTheDocument();
      expect(screen.getByText('My Groups')).toBeInTheDocument();
    });
  });

  describe('Admin role', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: UserRole.ADMIN },
        logout: mockLogout,
      });
    });

    it('should display Administrator badge', () => {
      render(<DashboardPage />);

      // Administrator text appears in multiple places (badge and account info)
      const adminTexts = screen.getAllByText('Administrator');
      expect(adminTexts.length).toBeGreaterThan(0);
    });

    it('should show Admin Panel section', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('should show admin-specific links', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Create User')).toBeInTheDocument();
      expect(screen.getByText('User List')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    it('should not show Quick Stats section for admin', () => {
      render(<DashboardPage />);

      expect(screen.queryByText('Quick Stats')).not.toBeInTheDocument();
    });
  });

  describe('Parent role', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Parent', lastName: 'User', email: 'parent@example.com', role: UserRole.PARENT },
        logout: mockLogout,
      });
    });

    it('should display Parent badge', () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([]);

      render(<DashboardPage />);

      // Parent text appears in multiple places (badge and account info)
      const parentTexts = screen.getAllByText('Parent');
      expect(parentTexts.length).toBeGreaterThan(0);
    });

    it('should show Child Statistics link', () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([]);

      render(<DashboardPage />);

      expect(screen.getByText('Child Statistics')).toBeInTheDocument();
    });

    it('should fetch parent children stats', () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([]);

      render(<DashboardPage />);

      expect(mockAttendanceApi.getMyStatsAsParent).toHaveBeenCalled();
    });

    it('should display children attendance stats', async () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([
        { playerId: 'p1', playerName: 'Child One', total: 10, present: 9, absent: 0, late: 1, sick: 0, excused: 0, rate: 90, totalTrainings: 8, totalMatches: 2 },
      ]);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument();
      });
    });
  });

  describe('Account Information section', () => {
    it('should display account information', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 80, totalTrainings: 8, totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
  });
});
