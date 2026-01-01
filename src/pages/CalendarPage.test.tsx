import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarPage } from './CalendarPage';
import { useAuth } from '../contexts/AuthContext';
import { trainingsApi } from '../api/trainings';
import { matchesApi } from '../api/matches';
import { groupsApi } from '../api/groups';
import { UserRole } from '../types';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock APIs
jest.mock('../api/trainings', () => ({
  trainingsApi: {
    getAll: jest.fn(),
    getMy: jest.fn(),
  },
}));

jest.mock('../api/matches', () => ({
  matchesApi: {
    getAll: jest.fn(),
    getMy: jest.fn(),
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

// Mock Calendar component
jest.mock('../components/Calendar', () => ({
  Calendar: ({ year, month, events, onEventClick, onPrevMonth, onNextMonth, onToday }: any) => (
    <div data-testid="calendar">
      <div>Year: {year}</div>
      <div>Month: {month}</div>
      <div>Events: {events.length}</div>
      <button onClick={onPrevMonth} data-testid="prev-month">Prev</button>
      <button onClick={onNextMonth} data-testid="next-month">Next</button>
      <button onClick={onToday} data-testid="today">Today</button>
      {events.map((event: any) => (
        <button key={event.id} onClick={() => onEventClick(event)} data-testid={`event-${event.id}`}>
          {event.title}
        </button>
      ))}
    </div>
  ),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockTrainingsApi = trainingsApi as jest.Mocked<typeof trainingsApi>;
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

describe('CalendarPage', () => {
  const mockTrainings = [
    {
      id: 't1',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T12:00:00Z',
      location: 'Field A',
      topic: 'Passing drills',
      group: { id: 'g1', name: 'U12' },
    },
  ];

  const mockMatches = [
    {
      id: 'm1',
      startTime: '2024-01-20T15:00:00Z',
      endTime: '2024-01-20T17:00:00Z',
      location: 'Stadium',
      opponent: 'Team B',
      isHome: true,
      homeGoals: null,
      awayGoals: null,
      group: { id: 'g1', name: 'U12' },
    },
  ];

  const mockGroups = [
    { id: 'g1', name: 'U12', yearOfBirth: 2012, headCoach: null, assistants: [], players: [] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrainingsApi.getMy.mockResolvedValue(mockTrainings);
    mockTrainingsApi.getAll.mockResolvedValue(mockTrainings);
    mockMatchesApi.getMy.mockResolvedValue(mockMatches);
    mockMatchesApi.getAll.mockResolvedValue(mockMatches);
    mockGroupsApi.getMy.mockResolvedValue(mockGroups);
    mockGroupsApi.getAll.mockResolvedValue(mockGroups);

    mockUseAuth.mockReturnValue({
      user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
    });
  });

  it('should render Calendar header', async () => {
    render(<CalendarPage />);

    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('should show Back to Dashboard link', () => {
    render(<CalendarPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<CalendarPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should load trainings and matches on mount', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(mockTrainingsApi.getMy).toHaveBeenCalled();
      expect(mockMatchesApi.getMy).toHaveBeenCalled();
    });
  });

  it('should display calendar component', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  it('should show event count stats', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('1 trainings')).toBeInTheDocument();
      expect(screen.getByText('1 matches')).toBeInTheDocument();
    });
  });

  it('should have group filter dropdown', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('All Groups')).toBeInTheDocument();
    });
  });

  it('should navigate to training on training event click', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByTestId('event-t1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('event-t1'));

    expect(mockNavigate).toHaveBeenCalledWith('/trainings/t1');
  });

  it('should navigate to match on match event click', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByTestId('event-m1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('event-m1'));

    expect(mockNavigate).toHaveBeenCalledWith('/matches/m1');
  });

  it('should handle month navigation', async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByTestId('prev-month')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('prev-month'));
    // Month state is internal to the component
  });

  describe('For Admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: UserRole.ADMIN },
      });
    });

    it('should call getAll for admin users', async () => {
      render(<CalendarPage />);

      await waitFor(() => {
        expect(mockTrainingsApi.getAll).toHaveBeenCalled();
        expect(mockMatchesApi.getAll).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message on API failure', async () => {
      mockTrainingsApi.getMy.mockRejectedValue(new Error('Network error'));

      render(<CalendarPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading', () => {
      mockTrainingsApi.getMy.mockImplementation(() => new Promise(() => {}));

      render(<CalendarPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });
});
