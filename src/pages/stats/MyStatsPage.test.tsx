import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { MyStatsPage } from './MyStatsPage';
import { statsApi } from '../../api/stats';
import { evaluationsApi } from '../../api/evaluations';

const renderWithProviders = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

jest.mock('../../api/stats', () => ({
  statsApi: {
    getMyStats: jest.fn(),
  },
}));

jest.mock('../../api/evaluations', () => ({
  evaluationsApi: {
    getMyRatingStats: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockStatsApi = statsApi as jest.Mocked<typeof statsApi>;
const mockEvaluationsApi = evaluationsApi as jest.Mocked<typeof evaluationsApi>;

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
    position: 'CM',
    matchesPlayed: 10,
    goals: 5,
    assists: 3,
    cleanSheets: 2,
    attendance: {
      total: 20,
      present: 15,
      late: 2,
      benched: 1,
      absent: 1,
      sick: 1,
      rate: 75,
      totalTrainings: 15,
      totalMatches: 5,
    },
    period: 'all_time' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStatsApi.getMyStats.mockResolvedValue(mockStats);
    mockEvaluationsApi.getMyRatingStats.mockResolvedValue(null);
  });

  it('should render My Statistics header', async () => {
    renderWithProviders(<MyStatsPage />);

    expect(screen.getByText('My Statistics')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    renderWithProviders(<MyStatsPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    renderWithProviders(<MyStatsPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should load stats on mount', async () => {
    renderWithProviders(<MyStatsPage />);

    await waitFor(() => {
      expect(mockStatsApi.getMyStats).toHaveBeenCalledWith('all_time');
    });
  });

  it('should display player name', async () => {
    renderWithProviders(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Player')).toBeInTheDocument();
    });
  });

  it('should display matches played', async () => {
    renderWithProviders(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Matches Played')).toBeInTheDocument();
    });
  });

  it('should display goals scored', async () => {
    renderWithProviders(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Goals Scored')).toBeInTheDocument();
    });
  });

  it('should display assists', async () => {
    renderWithProviders(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Assists')).toBeInTheDocument();
    });
  });

  it('should display goal contributions total', async () => {
    renderWithProviders(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Goal Contributions')).toBeInTheDocument();
    });
  });

  it('should display per match averages', async () => {
    renderWithProviders(<MyStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Per Match Averages')).toBeInTheDocument();
      expect(screen.getByText('0.50')).toBeInTheDocument();
      expect(screen.getByText('0.30')).toBeInTheDocument();
    });
  });

  describe('Period Filter', () => {
    it('should show period filter options', async () => {
      renderWithProviders(<MyStatsPage />);

      expect(screen.getByText('All Time')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should reload stats when period changes', async () => {
      renderWithProviders(<MyStatsPage />);

      await waitFor(() => {
        expect(mockStatsApi.getMyStats).toHaveBeenCalledWith('all_time');
      });

      fireEvent.click(screen.getByText('This Year'));

      await waitFor(() => {
        expect(mockStatsApi.getMyStats).toHaveBeenCalledWith('this_year');
      });
    });

    it('should update period label when changed', async () => {
      renderWithProviders(<MyStatsPage />);

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

      renderWithProviders(<MyStatsPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should display error message on API failure', async () => {
      mockStatsApi.getMyStats.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<MyStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
      });
    });
  });

  describe('Zero stats', () => {
    it('should not show per match averages when no matches played', async () => {
      mockStatsApi.getMyStats.mockResolvedValue({ ...mockStats, matchesPlayed: 0 });

      renderWithProviders(<MyStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });

      expect(screen.queryByText('Per Match Averages')).not.toBeInTheDocument();
    });
  });
});
