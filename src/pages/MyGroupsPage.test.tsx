import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyGroupsPage } from './MyGroupsPage';
import { groupsApi } from '../api/groups';
import { schedulesApi } from '../api/schedules';

// Mock APIs
jest.mock('../api/groups', () => ({
  groupsApi: {
    getMy: jest.fn(),
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

describe('MyGroupsPage', () => {
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
      headCoach: { id: 'c1', firstName: 'John', lastName: 'Coach' },
      assistants: [],
      players: [
        { id: 'p3', firstName: 'Mike', lastName: 'Player' },
      ],
    },
  ];

  const mockSchedule = [
    { dayOfWeek: 1, startTime: '16:00', endTime: '17:30', location: 'Field A' },
    { dayOfWeek: 3, startTime: '16:00', endTime: '17:30', location: 'Field B' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGroupsApi.getMy.mockResolvedValue(mockGroups);
    mockSchedulesApi.getSchedule.mockResolvedValue(mockSchedule);
    mockSchedulesApi.updateSchedule.mockResolvedValue(mockSchedule);
    mockSchedulesApi.generateTrainings.mockResolvedValue({ created: 10, skipped: 2 });
    mockSchedulesApi.deleteFutureGenerated.mockResolvedValue({ deleted: 5, kept: 2 });
  });

  it('should render My Groups header', async () => {
    render(<MyGroupsPage />);

    expect(screen.getByText('My Groups')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    render(<MyGroupsPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<MyGroupsPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should load groups on mount', async () => {
    render(<MyGroupsPage />);

    await waitFor(() => {
      expect(mockGroupsApi.getMy).toHaveBeenCalled();
    });
  });

  describe('Groups display', () => {
    it('should display groups as cards', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
        expect(screen.getByText('U14 Elite')).toBeInTheDocument();
      });
    });

    it('should display player count', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('2 players')).toBeInTheDocument();
        expect(screen.getByText('1 players')).toBeInTheDocument();
      });
    });

    it('should display head coach', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        const coachTexts = screen.getAllByText('John Coach');
        expect(coachTexts.length).toBeGreaterThan(0);
      });
    });

    it('should display assistants', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('Jane')).toBeInTheDocument();
      });
    });

    it('should show Training Schedule button for each group', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        const scheduleButtons = screen.getAllByText('Training Schedule');
        expect(scheduleButtons).toHaveLength(2);
      });
    });
  });

  describe('Schedule modal', () => {
    it('should open schedule modal when Training Schedule clicked', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Training Schedule - U12 Main')).toBeInTheDocument();
      });
    });

    it('should load schedule when modal opened', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(mockSchedulesApi.getSchedule).toHaveBeenCalledWith('g1');
      });
    });

    it('should show Weekly Schedule section', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
      });
    });

    it('should show + Add Day button', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('+ Add Day')).toBeInTheDocument();
      });
    });

    it('should show Save Schedule button', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });
    });

    it('should save schedule when Save Schedule clicked', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Schedule'));

      await waitFor(() => {
        expect(mockSchedulesApi.updateSchedule).toHaveBeenCalled();
      });
    });

    it('should show Generate Trainings section when schedule exists', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        // Both section header and button have "Generate Trainings" text
        const generateElements = screen.getAllByText('Generate Trainings');
        expect(generateElements.length).toBeGreaterThan(0);
      });
    });

    it('should close modal when Close clicked', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Training Schedule - U12 Main')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByText('Training Schedule - U12 Main')).not.toBeInTheDocument();
      });
    });
  });

  describe('Schedule interactions', () => {
    it('should add schedule item when + Add Day clicked', async () => {
      mockSchedulesApi.getSchedule.mockResolvedValue([]);

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
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
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Schedule'));

      await waitFor(() => {
        expect(mockSchedulesApi.updateSchedule).toHaveBeenCalled();
      });
    });

    it('should show error when save schedule fails', async () => {
      mockSchedulesApi.updateSchedule.mockRejectedValue(new Error('Failed'));

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Schedule'));

      await waitFor(() => {
        expect(screen.getByText('Failed to save schedule')).toBeInTheDocument();
      });
    });

    it('should display schedule items', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Save Schedule')).toBeInTheDocument();
      });

      // Check that schedule items are displayed (day dropdowns exist)
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe('Generate trainings', () => {
    it('should show date range inputs', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('From')).toBeInTheDocument();
        expect(screen.getByText('To')).toBeInTheDocument();
      });
    });

    it('should show default topic input', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Default Topic (optional)')).toBeInTheDocument();
      });
    });

    it('should show Generate Trainings button', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Generate Trainings' })).toBeInTheDocument();
      });
    });

    it('should generate trainings when dates provided', async () => {
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
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
      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Clear Future')).toBeInTheDocument();
      });
    });

    it('should delete future trainings when Clear Future clicked', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
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
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading groups', async () => {
      mockGroupsApi.getMy.mockImplementation(() => new Promise(() => {}));

      render(<MyGroupsPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });

    it('should show loading spinner while loading schedule', async () => {
      mockSchedulesApi.getSchedule.mockImplementation(() => new Promise(() => {}));

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      // Modal opens and shows loading spinner
      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        expect(spinners.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message on groups API failure', async () => {
      mockGroupsApi.getMy.mockRejectedValue(new Error('Network error'));

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load groups')).toBeInTheDocument();
      });
    });

    it('should show error message on schedule API failure', async () => {
      mockSchedulesApi.getSchedule.mockRejectedValue(new Error('Network error'));

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to load schedule')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should show message when no groups assigned', async () => {
      mockGroupsApi.getMy.mockResolvedValue([]);

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('You are not assigned to any groups')).toBeInTheDocument();
      });
    });
  });

  describe('Empty schedule', () => {
    it('should show message when no schedule defined', async () => {
      mockSchedulesApi.getSchedule.mockResolvedValue([]);

      render(<MyGroupsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12 Main')).toBeInTheDocument();
      });

      const scheduleButtons = screen.getAllByText('Training Schedule');
      fireEvent.click(scheduleButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/No schedule defined/)).toBeInTheDocument();
      });
    });
  });
});
