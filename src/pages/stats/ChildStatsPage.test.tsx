import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ChildStatsPage } from './ChildStatsPage';
import { statsApi } from '../../api/stats';
import { evaluationsApi } from '../../api/evaluations';

const renderWithProviders = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

jest.mock('../../api/stats', () => ({
  statsApi: {
    getChildrenStats: jest.fn(),
  },
}));

jest.mock('../../api/evaluations', () => ({
  evaluationsApi: {
    getPlayerRatingStats: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
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

describe('ChildStatsPage', () => {
  const mockChildrenStats = {
    children: [
      { id: 'c1', firstName: 'Child', lastName: 'One' },
      { id: 'c2', firstName: 'Child', lastName: 'Two' },
    ],
    stats: {
      playerId: 'c1',
      playerName: 'Child One',
      position: 'ST' as const,
      matchesPlayed: 8,
      goals: 4,
      assists: 2,
      cleanSheets: 0,
      attendance: {
        total: 15,
        present: 12,
        late: 1,
        benched: 0,
        absent: 1,
        sick: 1,
        rate: 80,
        totalTrainings: 12,
        totalMatches: 3,
      },
      period: 'all_time' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStatsApi.getChildrenStats.mockResolvedValue(mockChildrenStats);
    mockEvaluationsApi.getPlayerRatingStats.mockResolvedValue({
      averageRating: null,
      totalEvents: 0,
      byCategory: {
        technical: null,
        tactical: null,
        physical: null,
        psychological: null,
      },
      history: [],
    });
  });

  it('should render Child Statistics header', async () => {
    renderWithProviders(<ChildStatsPage />);

    expect(screen.getByText('Child Statistics')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    renderWithProviders(<ChildStatsPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    renderWithProviders(<ChildStatsPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should load children stats on mount', async () => {
    renderWithProviders(<ChildStatsPage />);

    await waitFor(() => {
      expect(mockStatsApi.getChildrenStats).toHaveBeenCalled();
    });
  });

  it('should display child stats', async () => {
    renderWithProviders(<ChildStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should display goal contributions', async () => {
    renderWithProviders(<ChildStatsPage />);

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Goal Contributions')).toBeInTheDocument();
    });
  });

  describe('Child Switcher', () => {
    it('should show child switcher when multiple children', async () => {
      renderWithProviders(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should not show child switcher when single child', async () => {
      mockStatsApi.getChildrenStats.mockResolvedValue({
        ...mockChildrenStats,
        children: [{ id: 'c1', firstName: 'Child', lastName: 'One' }],
      });

      renderWithProviders(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByText('Child One')).toBeInTheDocument();
      });

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should load stats for selected child', async () => {
      renderWithProviders(<ChildStatsPage />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'c2' },
      });

      await waitFor(() => {
        expect(mockStatsApi.getChildrenStats).toHaveBeenCalledWith(
          'all_time',
          'c2',
        );
      });
    });
  });

  describe('Period Filter', () => {
    it('should show period filter options', async () => {
      renderWithProviders(<ChildStatsPage />);

      expect(screen.getByText('All Time')).toBeInTheDocument();
      expect(screen.getByText('This Year')).toBeInTheDocument();
      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should reload stats when period changes', async () => {
      renderWithProviders(<ChildStatsPage />);

      await waitFor(() => {
        expect(mockStatsApi.getChildrenStats).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByText('This Year'));

      await waitFor(() => {
        expect(mockStatsApi.getChildrenStats).toHaveBeenCalledWith(
          'this_year',
          expect.anything(),
        );
      });
    });
  });

  describe('Empty state', () => {
    it('should show message when no children linked', async () => {
      mockStatsApi.getChildrenStats.mockResolvedValue({
        children: [],
        stats: null,
      });

      renderWithProviders(<ChildStatsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'No children are linked to your account yet. Contact an administrator to link your children.',
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading', () => {
      mockStatsApi.getChildrenStats.mockImplementation(
        () => new Promise(() => {}),
      );

      renderWithProviders(<ChildStatsPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should display error message on API failure', async () => {
      mockStatsApi.getChildrenStats.mockRejectedValue(
        new Error('Network error'),
      );

      renderWithProviders(<ChildStatsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load statistics'),
        ).toBeInTheDocument();
      });
    });
  });
});
