import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchesPage } from './MatchesPage';
import { useAuth } from '../contexts/AuthContext';
import { matchesApi } from '../api/matches';
import { groupsApi } from '../api/groups';
import { UserRole } from '../types';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock APIs
jest.mock('../api/matches', () => ({
  matchesApi: {
    getAll: jest.fn(),
    getMy: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../api/groups', () => ({
  groupsApi: {
    getAll: jest.fn(),
    getMy: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  return function MockDatePicker({ onChange, selected, placeholderText }: any) {
    return (
      <input
        type="text"
        placeholder={placeholderText}
        value={selected ? selected.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
        data-testid="datepicker"
      />
    );
  };
});

const mockUseAuth = useAuth as jest.Mock;
const mockMatchesApi = matchesApi as jest.Mocked<typeof matchesApi>;
const mockGroupsApi = groupsApi as jest.Mocked<typeof groupsApi>;

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

describe('MatchesPage', () => {
  const mockMatches = [
    {
      id: 'm1',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 5400000).toISOString(),
      location: 'Stadium A',
      opponent: 'Team B',
      isHome: true,
      homeGoals: null,
      awayGoals: null,
      group: { id: 'g1', name: 'U12' },
    },
    {
      id: 'm2',
      startTime: new Date(Date.now() - 86400000).toISOString(),
      endTime: new Date(Date.now() - 86400000 + 5400000).toISOString(),
      location: 'Stadium B',
      opponent: 'Team C',
      isHome: false,
      homeGoals: 1,
      awayGoals: 2,
      group: { id: 'g1', name: 'U12' },
    },
  ];

  const mockGroups = [
    { id: 'g1', name: 'U12', yearOfBirth: 2012, headCoach: null, assistants: [], players: [] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchesApi.getMy.mockResolvedValue(mockMatches);
    mockMatchesApi.getAll.mockResolvedValue(mockMatches);
    mockGroupsApi.getMy.mockResolvedValue(mockGroups);
    mockGroupsApi.getAll.mockResolvedValue(mockGroups);
  });

  describe('For Coach', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should render Matches header', async () => {
      render(<MatchesPage />);

      expect(screen.getByText('Matches')).toBeInTheDocument();
    });

    it('should show Schedule Match button for coach', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Match')).toBeInTheDocument();
      });
    });

    it('should display matches list', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('Stadium A')).toBeInTheDocument();
        expect(screen.getByText('Stadium B')).toBeInTheDocument();
      });
    });

    it('should display opponent name', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('vs Team B')).toBeInTheDocument();
        expect(screen.getByText('vs Team C')).toBeInTheDocument();
      });
    });

    it('should show Home/Away badges', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Away')).toBeInTheDocument();
      });
    });

    it('should display score for completed matches', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('2 - 1')).toBeInTheDocument();
      });
    });

    it('should show Win badge for won match', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('Win')).toBeInTheDocument();
      });
    });

    it('should navigate to match details on click', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('Stadium A')).toBeInTheDocument();
      });

      const matchCard = screen.getByText('Stadium A').closest('button');
      if (matchCard) {
        fireEvent.click(matchCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/matches/m1');
    });
  });

  describe('Create Match Modal', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should open modal when Schedule Match clicked', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Match')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Match'));

      expect(screen.getByText('Schedule Match')).toBeInTheDocument();
      expect(screen.getByText('Opponent *')).toBeInTheDocument();
    });

    it('should show Home/Away radio buttons', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Match')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Match'));

      await waitFor(() => {
        expect(screen.getByText('Home/Away *')).toBeInTheDocument();
      });
    });

    it('should close modal when Cancel clicked', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Match')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Match'));

      expect(screen.getByText('Schedule Match')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Opponent *')).not.toBeInTheDocument();
      });
    });

    it('should create match on form submit', async () => {
      mockMatchesApi.create.mockResolvedValue({
        id: 'm3',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        location: 'New Stadium',
        opponent: 'New Team',
        isHome: true,
        homeGoals: null,
        awayGoals: null,
        group: { id: 'g1', name: 'U12' },
      });

      render(<MatchesPage />);

      // Wait for data to load (groups must be loaded for modal to work correctly)
      await waitFor(() => {
        expect(screen.getByText('Stadium A')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Match'));

      await waitFor(() => {
        expect(screen.getByText('Opponent *')).toBeInTheDocument();
      });

      // Fill in form
      const opponentInput = screen.getByPlaceholderText('e.g., FC Dynamo U12');
      fireEvent.change(opponentInput, { target: { value: 'New Team' } });

      const locationInput = screen.getByPlaceholderText('e.g., Stadium A');
      fireEvent.change(locationInput, { target: { value: 'New Stadium' } });

      // Select group (inside modal)
      const groupSelects = screen.getAllByRole('combobox');
      // The first combobox in the modal is the group selector
      const modalGroupSelect = groupSelects[groupSelects.length - 1];
      fireEvent.change(modalGroupSelect, { target: { value: 'g1' } });

      // Click Schedule button inside modal (not the header button)
      const scheduleButtons = screen.getAllByRole('button');
      const submitButton = scheduleButtons.find(btn => btn.textContent === 'Schedule');
      if (submitButton) {
        fireEvent.click(submitButton);
      }

      await waitFor(() => {
        expect(mockMatchesApi.create).toHaveBeenCalled();
      });
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should show group filter dropdown', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        // Check for either "All Groups" or "All groups"
        const allGroups = screen.queryByText('All Groups') || screen.queryByText('All groups');
        expect(allGroups).toBeTruthy();
      });
    });

    it('should show date filter', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        const datepickers = screen.getAllByTestId('datepicker');
        expect(datepickers.length).toBeGreaterThan(0);
      });
    });

    it('should filter by group', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('Stadium A')).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole('combobox');
      fireEvent.change(groupSelect, { target: { value: 'g1' } });

      // Matches should still be visible (filtered to g1)
      await waitFor(() => {
        expect(screen.getByText('Stadium A')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should show loading spinner while loading', async () => {
      mockMatchesApi.getMy.mockImplementation(() => new Promise(() => {}));

      render(<MatchesPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should show error message on API failure', async () => {
      mockMatchesApi.getMy.mockRejectedValue(new Error('Network error'));

      render(<MatchesPage />);

      await waitFor(() => {
        // Check for any error message
        const errorElement = screen.queryByText('Failed to load matches') ||
                            screen.queryByText('Failed to load data');
        expect(errorElement).toBeTruthy();
      });
    });
  });

  describe('For Player', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
      });
    });

    it('should not show Schedule Match button for player', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('Stadium A')).toBeInTheDocument();
      });

      expect(screen.queryByText('+ Schedule Match')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
      mockMatchesApi.getMy.mockResolvedValue([]);
    });

    it('should show empty state when no matches', async () => {
      render(<MatchesPage />);

      await waitFor(() => {
        expect(screen.getByText('No matches scheduled yet')).toBeInTheDocument();
      });
    });
  });
});
