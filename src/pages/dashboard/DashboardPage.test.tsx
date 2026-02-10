jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/attendance', () => ({
  attendanceApi: {
    getMyStats: jest.fn(),
    getMyStatsAsParent: jest.fn(),
  },
}));

jest.mock('../../api/trainings', () => ({
  trainingsApi: {
    getMy: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../api/matches', () => ({
  matchesApi: {
    getMy: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../api/groups', () => ({
  groupsApi: {
    getMy: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../api/stats', () => ({
  statsApi: {
    getMyStats: jest.fn().mockResolvedValue([]),
    getTeamStats: jest.fn().mockResolvedValue([]),
    getChildrenStats: jest
      .fn()
      .mockResolvedValue({ children: [], stats: null }),
  },
}));

jest.mock('../../api/users', () => ({
  usersApi: {
    getMyProfile: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

jest.mock('../../components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Mock ThemeToggle</div>,
}));

jest.mock('../../hooks/useChartColors', () => ({
  useChartColors: () => ({
    text: '#000000',
    grid: '#e5e7eb',
    line: '#3b82f6',
    area: 'rgba(59, 130, 246, 0.1)',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e5e7eb',
  }),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceApi } from '../../api/attendance';
import { groupsApi } from '../../api/groups';
import { UserRole } from '../../types';

const mockUseAuth = useAuth as jest.Mock;
const mockAttendanceApi = attendanceApi as jest.Mocked<typeof attendanceApi>;
const mockGroupsApi = groupsApi as jest.Mocked<typeof groupsApi>;

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
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.PLAYER,
        },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Football Academy')).toBeInTheDocument();
    });

    it('should display user name in header', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.PLAYER,
        },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      const userNames = screen.getAllByText('John Doe');
      expect(userNames.length).toBeGreaterThan(0);
    });

    it('should display welcome message', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.PLAYER,
        },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    });

    it('should call logout when logout button clicked', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.PLAYER,
        },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should display user initials', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.PLAYER,
        },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Player role', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.PLAYER,
        },
        logout: mockLogout,
      });
    });

    it('should display Player badge', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      const playerTexts = screen.getAllByText('Player');
      expect(playerTexts.length).toBeGreaterThan(0);
    });

    it('should show quick stats links', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Trainings')).toBeInTheDocument();
      expect(screen.getByText('Matches')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('should show My Statistics link', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('My Stats')).toBeInTheDocument();
    });

    it('should display attendance rate', async () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('80%')).toBeInTheDocument();
      });
    });

    it('should fetch player attendance stats', () => {
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(mockAttendanceApi.getMyStats).toHaveBeenCalled();
    });
  });

  describe('Coach role', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'Coach',
          lastName: 'Smith',
          email: 'coach@example.com',
          role: UserRole.COACH,
        },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });
      mockGroupsApi.getMy.mockResolvedValue([
        {
          id: 'g1',
          name: 'U12 Main',
          yearOfBirth: 2012,
          headCoach: { id: '1', firstName: 'Coach', lastName: 'Smith' },
          assistants: [],
          players: [],
        },
      ]);
    });

    it('should display Coach badge', () => {
      render(<DashboardPage />);

      const coachTexts = screen.getAllByText('Coach');
      expect(coachTexts.length).toBeGreaterThan(0);
    });

    it('should show Coach Panel section', async () => {
      render(<DashboardPage />);

      // Check for coach navigation items instead of "Coach Panel" text
      await waitFor(
        () => {
          expect(screen.getByText('Team Stats')).toBeInTheDocument();
          expect(screen.getByText('My Groups')).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    });

    it('should show coach-specific links', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Team Stats')).toBeInTheDocument();
        expect(screen.getByText('My Groups')).toBeInTheDocument();
      });
    });
  });

  describe('Admin role', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
        logout: mockLogout,
      });
    });

    it('should display Administrator badge', () => {
      render(<DashboardPage />);

      const adminTexts = screen.getAllByText('Administrator');
      expect(adminTexts.length).toBeGreaterThan(0);
    });

    it('should show Admin Panel section', () => {
      render(<DashboardPage />);

      // Check for admin navigation items instead of "Admin Panel" text
      expect(screen.getByText('Create User')).toBeInTheDocument();
      expect(screen.getByText('User List')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
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
        user: {
          id: '1',
          firstName: 'Parent',
          lastName: 'User',
          email: 'parent@example.com',
          role: UserRole.PARENT,
        },
        logout: mockLogout,
      });
    });

    it('should display Parent badge', () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([]);

      render(<DashboardPage />);

      const parentTexts = screen.getAllByText('Parent');
      expect(parentTexts.length).toBeGreaterThan(0);
    });

    it('should show Child Statistics link', async () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([]);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Child Stats')).toBeInTheDocument();
      });
    });

    it('should fetch parent children stats', () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([]);

      render(<DashboardPage />);

      expect(mockAttendanceApi.getMyStatsAsParent).toHaveBeenCalled();
    });

    it('should display children attendance stats', async () => {
      mockAttendanceApi.getMyStatsAsParent.mockResolvedValue([
        {
          playerId: 'p1',
          playerName: 'Child One',
          total: 10,
          present: 9,
          absent: 0,
          late: 1,
          sick: 0,
          benched: 0,
          rate: 90,
          totalTrainings: 8,
          totalMatches: 2,
        },
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
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.PLAYER,
        },
        logout: mockLogout,
      });
      mockAttendanceApi.getMyStats.mockResolvedValue({
        total: 10,
        present: 8,
        absent: 1,
        late: 1,
        sick: 0,
        benched: 0,
        rate: 80,
        totalTrainings: 8,
        totalMatches: 2,
      });

      render(<DashboardPage />);

      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
  });
});
