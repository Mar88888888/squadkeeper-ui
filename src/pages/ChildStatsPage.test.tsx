import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChildStatsPage } from './ChildStatsPage';
import { statsApi } from '../api/stats';

// Mock statsApi
jest.mock('../api/stats', () => ({
  statsApi: {
    getChildrenStats: jest.fn(),
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

describe('ChildStatsPage', () => {
  const mockChildrenStats = {
    children: [
      { id: 'c1', firstName: 'Child', lastName: 'One' },
      { id: 'c2', firstName: 'Child', lastName: 'Two' },
    ],
    stats: {
      playerId: 'c1',
      playerName: 'Child One',
      matchesPlayed: 8,
      goals: 4,
      assists: 2,
      period: 'all_time' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStatsApi.getChildrenStats.mockResolvedValue(mockChildrenStats);
  });

  it('should render Child Statistics header', async () => {
    render(<ChildStatsPage />);

    expect(screen.getByText('Child Statistics')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    render(<ChildStatsPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<ChildStatsPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should load children stats on mount', async () => {
    render(<ChildStatsPage />);

    await waitFor(() => {
      expect(mockStatsApi.getChildrenStats).toHaveBeenCalled();
    });
  });

  it('should display child stats', async () => {
    render(<ChildStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // matches
      expect(screen.getByText('4')).toBeInTheDocument(); // goals
      expect(screen.getByText('2')).toBeInTheDocument(); // assists
    });
  });

  it('should display goal contributions', async () => {
    render(<ChildStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument(); // 4 goals + 2 assists
      expect(screen.getByText('Goal Contributions')).toBeInTheDocument();
    });
  });

  describe('Child Switcher', () => {
    it('should show child switcher when multiple children', async () => {
      render(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should not show child switcher when single child', async () => {
      mockStatsApi.getChildrenStats.mockResolvedValue({
        ...mockChildrenStats,
        children: [{ id: 'c1', firstName: 'Child', lastName: 'One' }],
      });

      render(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should load stats for selected child', async () => {
      render(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c2' } });

      await waitFor(() => {
        expect(mockStatsApi.getChildrenStats).toHaveBeenCalledWith('all_time', 'c2');
      });
    });
  });

  describe('Period Filter', () => {
    it('should show period filter options', async () => {
      render(<ChildStatsPage />);

      expect(screen.getByText('All Time')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should reload stats when period changes', async () => {
      render(<ChildStatsPage />);

      await waitFor(() => {
        expect(mockStatsApi.getChildrenStats).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByText('This Year'));

      await waitFor(() => {
        expect(mockStatsApi.getChildrenStats).toHaveBeenCalledWith('this_year', expect.anything());
      });
    });
  });

  describe('Empty state', () => {
    it('should show message when no children linked', async () => {
      mockStatsApi.getChildrenStats.mockResolvedValue({
        children: [],
        stats: null,
      });

      render(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('No children linked to your account')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading', () => {
      mockStatsApi.getChildrenStats.mockImplementation(() => new Promise(() => {}));

      render(<ChildStatsPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should display error message on API failure', async () => {
      mockStatsApi.getChildrenStats.mockRejectedValue(new Error('Network error'));

      render(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
      });
    });
  });
});
