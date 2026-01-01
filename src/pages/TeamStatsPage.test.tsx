import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamStatsPage } from './TeamStatsPage';
import { statsApi } from '../api/stats';

// Mock statsApi
jest.mock('../api/stats', () => ({
  statsApi: {
    getTeamStats: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockStatsApi = statsApi as jest.Mocked<typeof statsApi>;

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

describe('TeamStatsPage', () => {
  const mockTeamStats = [
    {
      groupId: 'g1',
      groupName: 'U12',
      players: [
        { playerId: 'p1', playerName: 'Player One', matchesPlayed: 10, goals: 5, assists: 3, period: 'all_time' as const },
        { playerId: 'p2', playerName: 'Player Two', matchesPlayed: 8, goals: 3, assists: 4, period: 'all_time' as const },
        { playerId: 'p3', playerName: 'Player Three', matchesPlayed: 6, goals: 0, assists: 0, period: 'all_time' as const },
      ],
      period: 'all_time' as const,
    },
    {
      groupId: 'g2',
      groupName: 'U14',
      players: [
        { playerId: 'p4', playerName: 'Player Four', matchesPlayed: 12, goals: 8, assists: 5, period: 'all_time' as const },
      ],
      period: 'all_time' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockStatsApi.getTeamStats.mockResolvedValue(mockTeamStats);
  });

  it('should render Team Statistics header', async () => {
    render(<TeamStatsPage />);

    expect(screen.getByText('Team Statistics')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    render(<TeamStatsPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<TeamStatsPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should load team stats on mount', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(mockStatsApi.getTeamStats).toHaveBeenCalledWith('all_time');
    });
  });

  it('should display team name', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      const u12Elements = screen.getAllByText('U12');
      expect(u12Elements.length).toBeGreaterThan(0);
    });
  });

  it('should display total team stats', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('24')).toBeInTheDocument(); // 10+8+6 appearances
      expect(screen.getByText('Total Appearances')).toBeInTheDocument();
    });
  });

  it('should display total goals', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Goals')).toBeInTheDocument();
    });
  });

  it('should display total assists', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Assists')).toBeInTheDocument();
    });
  });

  it('should display player statistics table', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
      const playerOneElements = screen.getAllByText('Player One');
      expect(playerOneElements.length).toBeGreaterThan(0);
    });
  });

  it('should display G+A column', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('G+A')).toBeInTheDocument();
    });
  });

  it('should display Top Scorers section', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Top Scorers')).toBeInTheDocument();
    });
  });

  it('should display Top Assisters section', async () => {
    render(<TeamStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Top Assisters')).toBeInTheDocument();
    });
  });

  describe('Group Switcher', () => {
    it('should show group switcher when multiple teams', async () => {
      render(<TeamStatsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should switch to different group', async () => {
      render(<TeamStatsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'g2' } });

      await waitFor(() => {
        const u14Elements = screen.getAllByText('U14');
        expect(u14Elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Period Filter', () => {
    it('should show period filter options', async () => {
      render(<TeamStatsPage />);

      expect(screen.getByText('All Time')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should reload stats when period changes', async () => {
      render(<TeamStatsPage />);

      await waitFor(() => {
        expect(mockStatsApi.getTeamStats).toHaveBeenCalledWith('all_time');
      });

      fireEvent.click(screen.getByText('This Year'));

      await waitFor(() => {
        expect(mockStatsApi.getTeamStats).toHaveBeenCalledWith('this_year');
      });
    });
  });

  describe('Empty state', () => {
    it('should show message when no teams found', async () => {
      mockStatsApi.getTeamStats.mockResolvedValue([]);

      render(<TeamStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('No teams found')).toBeInTheDocument();
      });
    });

    it('should show message when team has no players', async () => {
      mockStatsApi.getTeamStats.mockResolvedValue([
        { groupId: 'g1', groupName: 'U12', players: [], period: 'all_time' as const },
      ]);

      render(<TeamStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('No players in this group')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading', () => {
      mockStatsApi.getTeamStats.mockImplementation(() => new Promise(() => {}));

      render(<TeamStatsPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should display error message on API failure', async () => {
      mockStatsApi.getTeamStats.mockRejectedValue(new Error('Network error'));

      render(<TeamStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
      });
    });
  });
});
