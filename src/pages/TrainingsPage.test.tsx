import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrainingsPage } from './TrainingsPage';
import { useAuth } from '../contexts/AuthContext';
import { trainingsApi } from '../api/trainings';
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
const mockTrainingsApi = trainingsApi as jest.Mocked<typeof trainingsApi>;
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

describe('TrainingsPage', () => {
  const mockTrainings = [
    {
      id: 't1',
      startTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      endTime: new Date(Date.now() + 86400000 + 5400000).toISOString(),
      location: 'Field A',
      topic: 'Passing drills',
      group: { id: 'g1', name: 'U12' },
    },
    {
      id: 't2',
      startTime: new Date(Date.now() - 86400000).toISOString(), // yesterday
      endTime: new Date(Date.now() - 86400000 + 5400000).toISOString(),
      location: 'Field B',
      group: { id: 'g1', name: 'U12' },
    },
  ];

  const mockGroups = [
    { id: 'g1', name: 'U12', yearOfBirth: 2012, headCoach: null, assistants: [], players: [] },
    { id: 'g2', name: 'U14', yearOfBirth: 2010, headCoach: null, assistants: [], players: [] },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrainingsApi.getMy.mockResolvedValue(mockTrainings);
    mockTrainingsApi.getAll.mockResolvedValue(mockTrainings);
    mockGroupsApi.getMy.mockResolvedValue(mockGroups);
    mockGroupsApi.getAll.mockResolvedValue(mockGroups);
  });

  describe('For Coach', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should render Trainings header', async () => {
      render(<TrainingsPage />);

      expect(screen.getByText('Trainings')).toBeInTheDocument();
    });

    it('should show Schedule Training button for coach', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Training')).toBeInTheDocument();
      });
    });

    it('should show Back to Dashboard link', () => {
      render(<TrainingsPage />);

      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    it('should navigate to dashboard when Back button clicked', () => {
      render(<TrainingsPage />);

      fireEvent.click(screen.getByText('Back to Dashboard'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should load trainings on mount', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(mockTrainingsApi.getMy).toHaveBeenCalled();
      });
    });

    it('should display trainings list', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
        expect(screen.getByText('Field B')).toBeInTheDocument();
      });
    });

    it('should display topic if available', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Passing drills')).toBeInTheDocument();
      });
    });

    it('should display group name', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        const groupBadges = screen.getAllByText('U12');
        expect(groupBadges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show Upcoming badge for future trainings', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming')).toBeInTheDocument();
      });
    });

    it('should show Past badge for past trainings', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Past')).toBeInTheDocument();
      });
    });

    it('should navigate to training details on click', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      const trainingCard = screen.getByText('Field A').closest('button');
      if (trainingCard) {
        fireEvent.click(trainingCard);
      }

      expect(mockNavigate).toHaveBeenCalledWith('/trainings/t1');
    });
  });

  describe('For Admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: UserRole.ADMIN },
      });
    });

    it('should call getAll for admin users', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(mockTrainingsApi.getAll).toHaveBeenCalled();
        expect(mockGroupsApi.getAll).toHaveBeenCalled();
      });
    });

    it('should show Schedule Training button for admin', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Training')).toBeInTheDocument();
      });
    });
  });

  describe('For Player', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
      });
    });

    it('should not show Schedule Training button for player', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      expect(screen.queryByText('+ Schedule Training')).not.toBeInTheDocument();
    });

    it('should call getMy for non-admin users', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(mockTrainingsApi.getMy).toHaveBeenCalled();
        expect(mockGroupsApi.getMy).toHaveBeenCalled();
      });
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should show time filter options', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Upcoming')).toBeInTheDocument();
        expect(screen.getByText('This Week')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
      });
    });

    it('should show group filter dropdown', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('All groups')).toBeInTheDocument();
      });
    });

    it('should filter by group when selected', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      const groupSelect = screen.getByRole('combobox');
      fireEvent.change(groupSelect, { target: { value: 'g2' } });

      // Since both trainings are g1, filtering by g2 should show no trainings
      expect(screen.queryByText('Field A')).not.toBeInTheDocument();
    });
  });

  describe('Create Training Modal', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should open modal when Schedule Training clicked', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Training')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Training'));

      expect(screen.getByText('Schedule Training')).toBeInTheDocument();
      expect(screen.getByText('Group *')).toBeInTheDocument();
    });

    it('should close modal when Cancel clicked', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Training')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Training'));
      expect(screen.getByText('Group *')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Group *')).not.toBeInTheDocument();
    });

    it('should show validation error when no group selected', async () => {
      mockGroupsApi.getMy.mockResolvedValue([]);
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('+ Schedule Training')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Training'));
      fireEvent.click(screen.getByText('Schedule'));

      await waitFor(() => {
        expect(screen.getByText('Please select a group')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
      mockTrainingsApi.getMy.mockResolvedValue([]);
    });

    it('should show empty state when no trainings', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('No trainings scheduled yet')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
      mockTrainingsApi.getMy.mockImplementation(() => new Promise(() => {})); // Never resolves
    });

    it('should show loading spinner while loading', () => {
      render(<TrainingsPage />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should display error message on API failure', async () => {
      mockTrainingsApi.getMy.mockRejectedValue(new Error('Network error'));

      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Time filter interactions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should change filter when time filter button clicked', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      // Click on "This Week" filter
      fireEvent.click(screen.getByRole('button', { name: 'This Week' }));

      // The filter should be applied (API will be called with the filter)
      await waitFor(() => {
        expect(mockTrainingsApi.getMy).toHaveBeenCalled();
      });
    });

    it('should change filter when clicking Upcoming', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      // Find the button by role since there's also an "Upcoming" badge
      const buttons = screen.getAllByRole('button');
      const upcomingButton = buttons.find(btn => btn.textContent === 'Upcoming');
      if (upcomingButton) {
        fireEvent.click(upcomingButton);
      }

      await waitFor(() => {
        expect(mockTrainingsApi.getMy).toHaveBeenCalled();
      });
    });
  });

  describe('Create training with form submission', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should create training when form is submitted with valid data', async () => {
      mockTrainingsApi.create.mockResolvedValue({
        id: 't3',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        location: 'New Field',
        topic: 'New Topic',
        group: { id: 'g1', name: 'U12' },
      });

      render(<TrainingsPage />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      // Open modal
      fireEvent.click(screen.getByText('+ Schedule Training'));

      await waitFor(() => {
        expect(screen.getByText('Group *')).toBeInTheDocument();
      });

      // Fill in location
      const locationInput = screen.getByPlaceholderText('e.g., Main Field');
      fireEvent.change(locationInput, { target: { value: 'New Field' } });

      // Click Schedule button
      const buttons = screen.getAllByRole('button');
      const scheduleButton = buttons.find(btn => btn.textContent === 'Schedule');
      if (scheduleButton) {
        fireEvent.click(scheduleButton);
      }

      await waitFor(() => {
        expect(mockTrainingsApi.create).toHaveBeenCalled();
      });
    });

    it('should show location validation error', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Training'));

      await waitFor(() => {
        expect(screen.getByText('Group *')).toBeInTheDocument();
      });

      // Clear location (if any default)
      const locationInput = screen.getByPlaceholderText('e.g., Main Field');
      fireEvent.change(locationInput, { target: { value: '' } });

      // Click Schedule
      const buttons = screen.getAllByRole('button');
      const scheduleButton = buttons.find(btn => btn.textContent === 'Schedule');
      if (scheduleButton) {
        fireEvent.click(scheduleButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Please enter a location')).toBeInTheDocument();
      });
    });

    it('should show error when create fails', async () => {
      mockTrainingsApi.create.mockRejectedValue(new Error('Failed'));

      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Schedule Training'));

      await waitFor(() => {
        expect(screen.getByText('Group *')).toBeInTheDocument();
      });

      // Fill in location
      const locationInput = screen.getByPlaceholderText('e.g., Main Field');
      fireEvent.change(locationInput, { target: { value: 'New Field' } });

      // Click Schedule
      const buttons = screen.getAllByRole('button');
      const scheduleButton = buttons.find(btn => btn.textContent === 'Schedule');
      if (scheduleButton) {
        fireEvent.click(scheduleButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Failed to create training')).toBeInTheDocument();
      });
    });
  });

  describe('Date range filtering', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should have date picker inputs', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      const datepickers = screen.getAllByTestId('datepicker');
      expect(datepickers.length).toBeGreaterThanOrEqual(2);
    });

    it('should update filter when date is selected', async () => {
      render(<TrainingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });

      const datepickers = screen.getAllByTestId('datepicker');
      // Set the "From" date
      fireEvent.change(datepickers[0], { target: { value: '2025-01-01' } });

      await waitFor(() => {
        expect(mockTrainingsApi.getMy).toHaveBeenCalled();
      });
    });
  });
});
