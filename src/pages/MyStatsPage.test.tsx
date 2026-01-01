import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyStatsPage } from './MyStatsPage';
import { statsApi } from '../api/stats';

// Mock statsApi
jest.mock('../api/stats', () => ({
  statsApi: {
    getMyStats: jest.fn(),
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

describe('MyStatsPage', () => {
  const mockStats = {
    playerId: 'p1',
    playerName: 'John Player',
    matchesPlayed: 10,
    goals: 5,
    assists: 3,
    period: 'all_time' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStatsApi.getMyStats.mockResolvedValue(mockStats);
  });

  it('should render My Statistics header', async () => {
    render(<MyStatsPage />);

    expect(screen.getByText('My Statistics')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    render(<MyStatsPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<MyStatsPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should load stats on mount', async () => {
    render(<MyStatsPage />);

    await waitFor(() => {
      expect(mockStatsApi.getMyStats).toHaveBeenCalledWith('all_time');
    });
  });

  it('should display player name', async () => {
    render(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Player')).toBeInTheDocument();
    });
  });

  it('should display matches played', async () => {
    render(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Matches Played')).toBeInTheDocument();
    });
  });

  it('should display goals scored', async () => {
    render(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Goals Scored')).toBeInTheDocument();
    });
  });

  it('should display assists', async () => {
    render(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Assists')).toBeInTheDocument();
    });
  });

  it('should display goal contributions total', async () => {
    render(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // 5 goals + 3 assists
      expect(screen.getByText('Goal Contributions')).toBeInTheDocument();
    });
  });

  it('should display per match averages', async () => {
    render(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Per Match Averages')).toBeInTheDocument();
      expect(screen.getByText('0.50')).toBeInTheDocument(); // 5/10 goals per match
      expect(screen.getByText('0.30')).toBeInTheDocument(); // 3/10 assists per match
    });
  });

  describe('Period Filter', () => {
    it('should show period filter options', async () => {
      render(<MyStatsPage />);

      expect(screen.getByText('All Time')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should reload stats when period changes', async () => {
      render(<MyStatsPage />);

      await waitFor(() => {
        expect(mockStatsApi.getMyStats).toHaveBeenCalledWith('all_time');
      });

      fireEvent.click(screen.getByText('This Year'));

      await waitFor(() => {
        expect(mockStatsApi.getMyStats).toHaveBeenCalledWith('this_year');
      });
    });

    it('should update period label when changed', async () => {
      render(<MyStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('All Time Statistics')).toBeInTheDocument();
      });

      mockStatsApi.getMyStats.mockResolvedValue({ ...mockStats, period: 'this_month' });
      fireEvent.click(screen.getByText('This Month'));

      await waitFor(() => {
        expect(screen.getByText('This Month')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading', () => {
      mockStatsApi.getMyStats.mockImplementation(() => new Promise(() => {}));

      render(<MyStatsPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should display error message on API failure', async () => {
      mockStatsApi.getMyStats.mockRejectedValue(new Error('Network error'));

      render(<MyStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
      });
    });
  });

  describe('Zero stats', () => {
    it('should not show per match averages when no matches played', async () => {
      mockStatsApi.getMyStats.mockResolvedValue({ ...mockStats, matchesPlayed: 0 });

      render(<MyStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });

      expect(screen.queryByText('Per Match Averages')).not.toBeInTheDocument();
    });
  });
});
