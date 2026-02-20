import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrainingDetailsPage } from './TrainingDetailsPage';
import { useAuth } from '../../contexts/AuthContext';
import { trainingsApi } from '../../api/trainings';
import { attendanceApi, AttendanceStatus } from '../../api/attendance';
import { evaluationsApi, getEvaluationAverage } from '../../api/evaluations';
import { UserRole } from '../../types';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../api/trainings', () => ({
  trainingsApi: {
    getOne: jest.fn(),
  },
}));

jest.mock('../../api/attendance', () => ({
  attendanceApi: {
    getByTraining: jest.fn(),
    markBatch: jest.fn(),
  },
  AttendanceStatus: {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    SICK: 'SICK',
    LATE: 'LATE',
    BENCHED: 'BENCHED',
  },
}));

jest.mock('../../api/evaluations', () => ({
  evaluationsApi: {
    getByTraining: jest.fn(),
    createBatch: jest.fn(),
  },
  getEvaluationAverage: jest.fn((evaluation) => {
    const ratings = [evaluation.technical, evaluation.tactical, evaluation.physical, evaluation.psychological].filter(r => r !== null && r !== undefined);
    if (ratings.length === 0) return null;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 't1' }),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockTrainingsApi = trainingsApi as jest.Mocked<typeof trainingsApi>;
const mockAttendanceApi = attendanceApi as jest.Mocked<typeof attendanceApi>;
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

describe('TrainingDetailsPage', () => {
  const mockTraining = {
    id: 't1',
    startTime: '2024-01-15T10:00:00Z',
    durationMinutes: 120,
    location: 'Field A',
    topic: 'Passing drills',
    group: {
      id: 'g1',
      name: 'U12',
      players: [
        { id: 'p1', firstName: 'John', lastName: 'Player', position: 'FW' },
        { id: 'p2', firstName: 'Jane', lastName: 'Player', position: 'MF' },
      ],
    },
  };

  const mockAttendance = [
    { id: 'a1', status: AttendanceStatus.PRESENT, notes: null, player: { id: 'p1', firstName: 'John', lastName: 'Player' } },
  ];

  const mockEvaluations = [
    { id: 'e1', technical: 8, tactical: 7, physical: 8, psychological: 7, comment: null, player: { id: 'p1', firstName: 'John', lastName: 'Player' }, coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrainingsApi.getOne.mockResolvedValue(mockTraining);
    mockAttendanceApi.getByTraining.mockResolvedValue(mockAttendance);
    mockEvaluationsApi.getByTraining.mockResolvedValue(mockEvaluations);
  });

  describe('For Coach', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should render training details', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12')).toBeInTheDocument();
        expect(screen.getByText('Field A')).toBeInTheDocument();
      });
    });

    it('should display topic', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Passing drills/)).toBeInTheDocument();
      });
    });

    it('should show Back to Trainings button', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Trainings')).toBeInTheDocument();
      });
    });

    it('should navigate back when Back button clicked', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Trainings')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back to Trainings'));

      expect(mockNavigate).toHaveBeenCalledWith('/trainings');
    });

    it('should show Attendance and Evaluations tabs', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Attendance')).toBeInTheDocument();
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });
    });

    it('should display players list', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Player')).toBeInTheDocument();
        expect(screen.getByText('Jane Player')).toBeInTheDocument();
      });
    });

    it('should show Save Attendance button for coach', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Save Attendance')).toBeInTheDocument();
      });
    });

    it('should have attendance status dropdowns', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    it('should switch to Evaluations tab', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Evaluations'));

      await waitFor(() => {
        expect(screen.getByText('Player Evaluations')).toBeInTheDocument();
      });
    });

    it('should show Add Evaluation button for present players', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Evaluations'));

      await waitFor(() => {
        expect(screen.getByText(/Add Evaluation|Edit/)).toBeInTheDocument();
      });
    });
  });

  describe('For Player (read-only)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
      });
    });

    it('should not show Save Attendance button', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Player')).toBeInTheDocument();
      });

      expect(screen.queryByText('Save Attendance')).not.toBeInTheDocument();
    });

    it('should display attendance status as text, not dropdown', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        const presentElements = screen.getAllByText('Present');
        expect(presentElements.length).toBeGreaterThan(0);
      });

      expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should show loading spinner', () => {
      mockTrainingsApi.getOne.mockImplementation(() => new Promise(() => {}));

      render(<TrainingDetailsPage />);

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
      mockTrainingsApi.getOne.mockRejectedValue(new Error('Network error'));

      render(<TrainingDetailsPage />);

      await waitFor(() => {
        const hasError = screen.queryByText('Failed to load training details') ||
                        screen.queryByText('Training not found');
        expect(hasError).toBeTruthy();
      });
    });

    it('should show not found message when training is null', async () => {
      mockTrainingsApi.getOne.mockResolvedValue(null as any);

      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Training not found')).toBeInTheDocument();
      });
    });
  });

  describe('Attendance saving', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
      mockAttendanceApi.markBatch.mockResolvedValue(mockAttendance);
    });

    it('should save attendance when Save button clicked', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Save Attendance')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Attendance'));

      await waitFor(() => {
        expect(mockAttendanceApi.markBatch).toHaveBeenCalled();
      });
    });

    it('should allow changing attendance status', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
      });

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'ABSENT' } });

      expect((selects[0] as HTMLSelectElement).value).toBe('ABSENT');
    });

    it('should show error when save fails', async () => {
      mockAttendanceApi.markBatch.mockRejectedValue(new Error('Failed'));

      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Save Attendance')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Attendance'));

      await waitFor(() => {
        expect(screen.getByText('Failed to save attendance')).toBeInTheDocument();
      });
    });
  });

  describe('Evaluations', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
      mockEvaluationsApi.createBatch.mockResolvedValue([]);
    });

    it('should open evaluation modal when Add Evaluation clicked', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Evaluations'));

      await waitFor(() => {
        const addButtons = screen.queryAllByText(/Add Evaluation|Edit/);
        expect(addButtons.length).toBeGreaterThan(0);
      });

      const addButtons = screen.getAllByText(/Add Evaluation|Edit/);
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        const technicalLabels = screen.queryAllByText('Technical');
        expect(technicalLabels.length).toBeGreaterThan(0);
      });
    });

    it('should save evaluations when Save clicked', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Evaluations'));

      await waitFor(() => {
        const addButtons = screen.queryAllByText(/Add Evaluation|Edit/);
        expect(addButtons.length).toBeGreaterThan(0);
      });

      const addButtons = screen.getAllByText(/Add Evaluation|Edit/);
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        const saveButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Save');
        expect(saveButtons.length).toBeGreaterThan(0);
      });

      const saveButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Save');
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(mockEvaluationsApi.createBatch).toHaveBeenCalled();
      });
    });

    it('should show error when evaluation save fails', async () => {
      mockEvaluationsApi.createBatch.mockRejectedValue(new Error('Failed'));

      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Evaluations'));

      await waitFor(() => {
        const addButtons = screen.queryAllByText(/Add Evaluation|Edit/);
        expect(addButtons.length).toBeGreaterThan(0);
      });

      const addButtons = screen.getAllByText(/Add Evaluation|Edit/);
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        const saveButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Save');
        expect(saveButtons.length).toBeGreaterThan(0);
      });

      const saveButtons = screen.getAllByRole('button').filter(btn => btn.textContent === 'Save');
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to save evaluations')).toBeInTheDocument();
      });
    });

    it('should close evaluation modal when Cancel clicked', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Evaluations'));

      await waitFor(() => {
        const addButtons = screen.queryAllByText(/Add Evaluation|Edit/);
        expect(addButtons.length).toBeGreaterThan(0);
      });

      const addButtons = screen.getAllByText(/Add Evaluation|Edit/);
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Save Evaluation')).not.toBeInTheDocument();
      });
    });

    it('should display existing evaluations', async () => {
      render(<TrainingDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Evaluations'));

      await waitFor(() => {
        const techLabels = screen.queryAllByText(/Technical/);
        expect(techLabels.length).toBeGreaterThan(0);
      });
    });
  });
});
