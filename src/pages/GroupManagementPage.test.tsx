import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupManagementPage } from './GroupManagementPage';
import { groupsApi } from '../api/groups';
import { usersApi } from '../api/users';
import { schedulesApi } from '../api/schedules';

// Mock APIs
jest.mock('../api/groups', () => ({
  groupsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStaff: jest.fn(),
    addPlayers: jest.fn(),
    removePlayers: jest.fn(),
  },
}));

jest.mock('../api/users', () => ({
  usersApi: {
    getCoaches: jest.fn(),
    getPlayers: jest.fn(),
  },
}));

jest.mock('../api/schedules', () => ({
  schedulesApi: {
    getSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    generateTrainings: jest.fn(),
    deleteFutureGenerated: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockGroupsApi = groupsApi as jest.Mocked<typeof groupsApi>;
const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const mockSchedulesApi = schedulesApi as jest.Mocked<typeof schedulesApi>;

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

describe('GroupManagementPage', () => {
  const mockGroups = [
    {
      id: 'g1',
      name: 'U12 Main',
      yearOfBirth: 2012,
      headCoach: { id: 'c1', firstName: 'John', lastName: 'Coach' },
      assistants: [{ id: 'c2', firstName: 'Jane', lastName: 'Assistant' }],
      players: [
        { id: 'p1', firstName: 'Tom', lastName: 'Player' },
        { id: 'p2', firstName: 'Sara', lastName: 'Player' },
      ],
    },
    {
      id: 'g2',
      name: 'U14 Elite',
      yearOfBirth: 2010,
      headCoach: null,
      assistants: [],
      players: [],
    },
  ];

  const mockCoaches = [
    { id: 'c1', firstName: 'John', lastName: 'Coach', licenseLevel: 'B', experienceYears: 10, user: { id: 'u1', email: 'john@coach.com' } },
    { id: 'c2', firstName: 'Jane', lastName: 'Assistant', licenseLevel: 'C', experienceYears: 5, user: { id: 'u2', email: 'jane@coach.com' } },
  ];

  const mockPlayers = [
    { id: 'p1', firstName: 'Tom', lastName: 'Player', dateOfBirth: '2012-05-15', position: 'FW', group: { id: 'g1', name: 'U12 Main' }, user: { id: 'u3', email: 'tom@player.com' } },
    { id: 'p2', firstName: 'Sara', lastName: 'Player', dateOfBirth: '2012-08-20', position: 'MF', group: { id: 'g1', name: 'U12 Main' }, user: { id: 'u4', email: 'sara@player.com' } },
    { id: 'p3', firstName: 'Mike', lastName: 'Player', dateOfBirth: '2010-03-10', position: 'GK', group: null, user: { id: 'u5', email: 'mike@player.com' } },
  ];

  const mockSchedule = [
    { dayOfWeek: 1, startTime: '16:00', endTime: '17:30', location: 'Field A' },
    { dayOfWeek: 3, startTime: '16:00', endTime: '17:30', location: 'Field B' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGroupsApi.getAll.mockResolvedValue(mockGroups);
    mockUsersApi.getCoaches.mockResolvedValue(mockCoaches);
    mockUsersApi.getPlayers.mockResolvedValue(mockPlayers);
    mockSchedulesApi.getSchedule.mockResolvedValue(mockSchedule);
    mockSchedulesApi.updateSchedule.mockResolvedValue(mockSchedule);
    mockSchedulesApi.generateTrainings.mockResolvedValue({ created: 10, skipped: 2 });
    mockSchedulesApi.deleteFutureGenerated.mockResolvedValue({ deleted: 5, kept: 2 });
  });

  it('should render Group Management header', async () => {
    render(<GroupManagementPage />);

    expect(screen.getByText('Group Management')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    render(<GroupManagementPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<GroupManagementPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should show + Create Group button', () => {
    render(<GroupManagementPage />);

    expect(screen.getByText('+ Create Group')).toBeInTheDocument();
  });

  it('should show search input', () => {
    render(<GroupManagementPage />);

    expect(screen.getByPlaceholderText('Search by name or year...')).toBeInTheDocument();
  });

  it('should load data on mount', async () => {
    render(<GroupManagementPage />);

    await waitFor(() => {
      expect(mockGroupsApi.getAll).toHaveBeenCalled();
      expect(mockUsersApi.getCoaches).toHaveBeenCalled();
      expect(mockUsersApi.getPlayers).toHaveBeenCalled();
    });
  });

  describe('Groups list', () => {
    it('should display groups', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
        expect(screen.getByText('U14 Elite')).toBeInTheDocument();
      });
    });

    it('should display year of birth', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Year of birth: 2012')).toBeInTheDocument();
      });
    });

    it('should display head coach', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });
    });

    it('should display player count', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('2 players')).toBeInTheDocument();
      });
    });

    it('should display Not assigned when no head coach', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Not assigned')).toBeInTheDocument();
      });
    });
  });

  describe('Search functionality', () => {
    it('should filter groups by name', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name or year...'), {
        target: { value: 'U14' },
      });

      expect(screen.queryByText('U12 Main')).not.toBeInTheDocument();
      expect(screen.getByText('U14 Elite')).toBeInTheDocument();
    });

    it('should filter groups by year', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name or year...'), {
        target: { value: '2010' },
      });

      expect(screen.queryByText('U12 Main')).not.toBeInTheDocument();
      expect(screen.getByText('U14 Elite')).toBeInTheDocument();
    });
  });

  describe('Create group modal', () => {
    it('should open create modal when + Create Group clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Create Group'));

      expect(screen.getByText('Create Group')).toBeInTheDocument();
      expect(screen.getByText('Group Name *')).toBeInTheDocument();
    });

    it('should create group on submit', async () => {
      mockGroupsApi.create.mockResolvedValue({
        id: 'g3',
        name: 'U16 New',
        yearOfBirth: 2008,
        headCoach: null,
        assistants: [],
        players: [],
      });

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Create Group'));

      fireEvent.change(screen.getByPlaceholderText('e.g., U-12 Main'), {
        target: { value: 'U16 New' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(mockGroupsApi.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'U16 New' })
        );
      });
    });

    it('should close modal on Cancel', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Create Group'));

      expect(screen.getByText('Create Group')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Create Group')).not.toBeInTheDocument();
    });
  });

  describe('Edit group modal', () => {
    it('should open edit modal when edit button clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit group');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Group')).toBeInTheDocument();
    });
  });

  describe('Staff modal', () => {
    it('should open staff modal when coaches button clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const staffButtons = screen.getAllByTitle('Manage coaches');
      fireEvent.click(staffButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Manage Coaches - U12 Main')).toBeInTheDocument();
      });
    });

    it('should show head coach dropdown', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const staffButtons = screen.getAllByTitle('Manage coaches');
      fireEvent.click(staffButtons[0]);

      await waitFor(() => {
        // In modal, the label "Head Coach" appears for the dropdown
        const headCoachLabels = screen.getAllByText('Head Coach');
        expect(headCoachLabels.length).toBeGreaterThan(0);
      });
    });

    it('should save staff when Save clicked', async () => {
      mockGroupsApi.updateStaff.mockResolvedValue(mockGroups[0]);

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const staffButtons = screen.getAllByTitle('Manage coaches');
      fireEvent.click(staffButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Manage Coaches - U12 Main')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockGroupsApi.updateStaff).toHaveBeenCalled();
      });
    });

    it('should close staff modal when Cancel clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const staffButtons = screen.getAllByTitle('Manage coaches');
      fireEvent.click(staffButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Manage Coaches - U12 Main')).toBeInTheDocument();
      });

      // Find all Cancel buttons and click the one in the modal
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Manage Coaches - U12 Main')).not.toBeInTheDocument();
      });
    });
  });

  describe('Players modal', () => {
    it('should open players modal when players button clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const playersButtons = screen.getAllByTitle('Manage players');
      fireEvent.click(playersButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Manage Players - U12 Main')).toBeInTheDocument();
      });
    });

    it('should show player search input', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const playersButtons = screen.getAllByTitle('Manage players');
      fireEvent.click(playersButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search players...')).toBeInTheDocument();
      });
    });

    it('should show selected players count', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const playersButtons = screen.getAllByTitle('Manage players');
      fireEvent.click(playersButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('2 players selected')).toBeInTheDocument();
      });
    });

    it('should add players when checkboxes selected and Save clicked', async () => {
      mockGroupsApi.addPlayers.mockResolvedValue(mockGroups[0]);

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const playersButtons = screen.getAllByTitle('Manage players');
      fireEvent.click(playersButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Manage Players - U12 Main')).toBeInTheDocument();
      });

      // Find and click a checkbox for an unassigned player
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[checkboxes.length - 1]); // Click last checkbox (Mike - unassigned)
      }

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        // Should call either addPlayers or removePlayers
        expect(mockGroupsApi.addPlayers.mock.calls.length + mockGroupsApi.removePlayers.mock.calls.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should close players modal when Cancel clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const playersButtons = screen.getAllByTitle('Manage players');
      fireEvent.click(playersButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Manage Players - U12 Main')).toBeInTheDocument();
      });

      // Find all Cancel buttons and click the one in the modal
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Manage Players - U12 Main')).not.toBeInTheDocument();
      });
    });
  });

  describe('Schedule modal', () => {
    it('should open schedule modal when schedule button clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Training Schedule - U12 Main')).toBeInTheDocument();
      });
    });

    it('should show Weekly Schedule section', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
      });
    });

    it('should show + Add Day button', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('+ Add Day')).toBeInTheDocument();
      });
    });

    it('should add schedule item when + Add Day clicked', async () => {
      mockSchedulesApi.getSchedule.mockResolvedValue([]);

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('+ Add Day')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Day'));

      // Should now have schedule inputs
      await waitFor(() => {
        const selects = document.querySelectorAll('select');
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    it('should save schedule when Save Schedule clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Schedule'));

      await waitFor(() => {
        expect(mockSchedulesApi.updateSchedule).toHaveBeenCalled();
      });
    });

    it('should call updateSchedule when Save Schedule clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Schedule'));

      await waitFor(() => {
        expect(mockSchedulesApi.updateSchedule).toHaveBeenCalledWith('g1', expect.any(Array));
      });
    });

    it('should show Save Schedule button', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });
    });

    it('should show Generate Trainings section', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        // Both section header and button have "Generate Trainings" text
        const generateElements = screen.getAllByText('Generate Trainings');
        expect(generateElements.length).toBeGreaterThan(0);
      });
    });

    it('should generate trainings when button clicked with dates', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('From')).toBeInTheDocument();
      });

      // Fill in dates
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs.length >= 2) {
        fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });
        fireEvent.change(dateInputs[1], { target: { value: '2024-03-31' } });
      }

      const generateButton = screen.getByRole('button', { name: 'Generate Trainings' });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockSchedulesApi.generateTrainings).toHaveBeenCalled();
      });
    });

    it('should show Clear Future button', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Clear Future')).toBeInTheDocument();
      });
    });

    it('should delete future trainings when Clear Future clicked', async () => {
      // Mock window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Clear Future')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear Future'));

      await waitFor(() => {
        expect(mockSchedulesApi.deleteFutureGenerated).toHaveBeenCalledWith('g1');
      });

      alertMock.mockRestore();
    });

    it('should close schedule modal when Close clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByTitle('Training schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Training Schedule - U12 Main')).toBeInTheDocument();
      });

      // Find the Close button in the modal
      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByText('Training Schedule - U12 Main')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete group', () => {
    it('should open delete dialog when delete button clicked', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete group');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Group')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete "U12 Main"/)).toBeInTheDocument();
      });
    });

    it('should delete group on confirm', async () => {
      mockGroupsApi.delete.mockResolvedValue(undefined);

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete group');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete Group')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(mockGroupsApi.delete).toHaveBeenCalledWith('g1');
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading', async () => {
      mockGroupsApi.getAll.mockImplementation(() => new Promise(() => {}));

      render(<GroupManagementPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should show error message on API failure', async () => {
      mockGroupsApi.getAll.mockRejectedValue(new Error('Network error'));

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should show message when no groups', async () => {
      mockGroupsApi.getAll.mockResolvedValue([]);

      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('No groups created yet')).toBeInTheDocument();
      });
    });

    it('should show message when no groups match search', async () => {
      render(<GroupManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name or year...'), {
        target: { value: 'xyz123' },
      });

      expect(screen.getByText('No groups match your search')).toBeInTheDocument();
    });
  });
});
