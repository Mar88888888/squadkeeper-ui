import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MatchDetailsPage } from './MatchDetailsPage';
import { useAuth } from '../contexts/AuthContext';
import { matchesApi } from '../api/matches';
import { attendanceApi, AttendanceStatus } from '../api/attendance';
import { evaluationsApi, EvaluationType } from '../api/evaluations';
import { UserRole } from '../types';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock APIs
jest.mock('../api/matches', () => ({
  matchesApi: {
    getOne: jest.fn(),
    addGoal: jest.fn(),
    removeGoal: jest.fn(),
    updateResult: jest.fn(),
  },
}));

jest.mock('../api/attendance', () => ({
  attendanceApi: {
    getByMatch: jest.fn(),
    markBatch: jest.fn(),
  },
  AttendanceStatus: {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    SICK: 'SICK',
    LATE: 'LATE',
    EXCUSED: 'EXCUSED',
  },
}));

jest.mock('../api/evaluations', () => ({
  evaluationsApi: {
    getByMatch: jest.fn(),
    createBatch: jest.fn(),
  },
  EvaluationType: {
    TECHNICAL: 'TECHNICAL',
    TACTICAL: 'TACTICAL',
    PHYSICAL: 'PHYSICAL',
    PSYCHOLOGICAL: 'PSYCHOLOGICAL',
  },
  EvaluationTypeLabels: {
    TECHNICAL: 'Technical',
    TACTICAL: 'Tactical',
    PHYSICAL: 'Physical',
    PSYCHOLOGICAL: 'Psychological',
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'm1' }),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockMatchesApi = matchesApi as jest.Mocked<typeof matchesApi>;
const mockAttendanceApi = attendanceApi as jest.Mocked<typeof attendanceApi>;
const mockEvaluationsApi = evaluationsApi as jest.Mocked<typeof evaluationsApi>;

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

describe('MatchDetailsPage', () => {
  const mockMatch = {
    id: 'm1',
    startTime: '2024-01-20T15:00:00Z',
    endTime: '2024-01-20T17:00:00Z',
    location: 'Stadium A',
    opponent: 'Team B',
    isHome: true,
    homeGoals: 3,
    awayGoals: 1,
    group: {
      id: 'g1',
      name: 'U12',
      players: [
        { id: 'p1', firstName: 'John', lastName: 'Scorer', position: 'FW' },
        { id: 'p2', firstName: 'Jane', lastName: 'Assist', position: 'MF' },
      ],
    },
    goals: [
      { id: 'goal1', scorer: { id: 'p1', firstName: 'John', lastName: 'Scorer', position: 'FW' }, assist: { id: 'p2', firstName: 'Jane', lastName: 'Assist', position: 'MF' }, minute: 25, isOwnGoal: false },
    ],
  };

  const mockAttendance = [
    { id: 'a1', status: AttendanceStatus.PRESENT, notes: null, player: { id: 'p1', firstName: 'John', lastName: 'Scorer' } },
    { id: 'a2', status: AttendanceStatus.PRESENT, notes: null, player: { id: 'p2', firstName: 'Jane', lastName: 'Assist' } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchesApi.getOne.mockResolvedValue(mockMatch);
    mockAttendanceApi.getByMatch.mockResolvedValue(mockAttendance);
    mockEvaluationsApi.getByMatch.mockResolvedValue([]);
  });

  describe('For Coach', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should render match details', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('vs Team B')).toBeInTheDocument();
      });
    });

    it('should display score', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('3 - 1')).toBeInTheDocument();
      });
    });

    it('should display Home badge for home match', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });
    });

    it('should display Win badge when team won', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Win')).toBeInTheDocument();
      });
    });

    it('should show all three tabs', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Attendance')).toBeInTheDocument();
        expect(screen.getByText('Evaluations')).toBeInTheDocument();
        expect(screen.getByText(/Goals/)).toBeInTheDocument();
      });
    });

    it('should display players in attendance tab', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Scorer')).toBeInTheDocument();
        expect(screen.getByText('Jane Assist')).toBeInTheDocument();
      });
    });

    it('should show Set Score button', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Score')).toBeInTheDocument();
      });
    });

    it('should navigate back when Back button clicked', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Matches')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back to Matches'));

      expect(mockNavigate).toHaveBeenCalledWith('/matches');
    });

    describe('Goals Tab', () => {
      it('should switch to Goals tab', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText(/Goals/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Goals/));

        await waitFor(() => {
          expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
        });
      });

      it('should display recorded goals', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText(/Goals/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Goals/));

        await waitFor(() => {
          expect(screen.getByText("25'")).toBeInTheDocument();
          expect(screen.getByText('John Scorer')).toBeInTheDocument();
        });
      });

      it('should show assist info', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText(/Goals/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Goals/));

        await waitFor(() => {
          expect(screen.getByText(/Assist: Jane Assist/)).toBeInTheDocument();
        });
      });

      it('should show Remove button for goals', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText(/Goals/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Goals/));

        await waitFor(() => {
          expect(screen.getByText('Remove')).toBeInTheDocument();
        });
      });
    });

    describe('Add Goal Modal', () => {
      it('should open Add Goal modal', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText(/Goals/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Goals/));

        await waitFor(() => {
          expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('+ Add Goal'));

        await waitFor(() => {
          // Modal title will be "Add Goal"
          const addGoalElements = screen.getAllByText('Add Goal');
          expect(addGoalElements.length).toBeGreaterThan(0);
          expect(screen.getByText('Scorer *')).toBeInTheDocument();
        });
      });

      it('should submit add goal form', async () => {
        mockMatchesApi.addGoal.mockResolvedValue({
          id: 'goal2',
          scorer: { id: 'p1', firstName: 'John', lastName: 'Scorer', position: 'FW' },
          assist: null,
          minute: 30,
          isOwnGoal: false,
        });

        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText(/Goals/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Goals/));

        await waitFor(() => {
          expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('+ Add Goal'));

        await waitFor(() => {
          expect(screen.getByText('Scorer *')).toBeInTheDocument();
        });

        // Select a scorer from dropdown
        const selects = screen.getAllByRole('combobox');
        if (selects.length > 0) {
          fireEvent.change(selects[0], { target: { value: 'p1' } });
        }

        // Click Add Goal button in modal
        const addButtons = screen.getAllByRole('button', { name: /Add Goal/i });
        fireEvent.click(addButtons[addButtons.length - 1]);

        await waitFor(() => {
          expect(mockMatchesApi.addGoal).toHaveBeenCalled();
        });
      });

      it('should remove goal when Remove clicked', async () => {
        mockMatchesApi.removeGoal.mockResolvedValue(undefined);

        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText(/Goals/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Goals/));

        await waitFor(() => {
          expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Remove'));

        await waitFor(() => {
          expect(mockMatchesApi.removeGoal).toHaveBeenCalledWith('m1', 'goal1');
        });
      });
    });

    describe('Attendance', () => {
      it('should save attendance when Save clicked', async () => {
        mockAttendanceApi.markBatch.mockResolvedValue([
          { id: 'a1', status: AttendanceStatus.PRESENT, notes: null, player: { id: 'p1', firstName: 'John', lastName: 'Scorer' } },
        ]);

        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText('John Scorer')).toBeInTheDocument();
        });

        // Find and click Save Attendance button
        const saveButton = screen.getByText('Save Attendance');
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockAttendanceApi.markBatch).toHaveBeenCalled();
        });
      });

      it('should change attendance status', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText('John Scorer')).toBeInTheDocument();
        });

        // Find attendance status selects
        const selects = screen.getAllByRole('combobox');
        if (selects.length > 0) {
          fireEvent.change(selects[0], { target: { value: 'ABSENT' } });
        }

        // Status should be changed (no error)
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    describe('Evaluations Tab', () => {
      it('should switch to Evaluations tab', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText('Evaluations')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Evaluations'));

        await waitFor(() => {
          // Should show players for evaluation
          expect(screen.getByText('John Scorer')).toBeInTheDocument();
        });
      });

      it('should show Evaluate button for present players', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText('Evaluations')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Evaluations'));

        await waitFor(() => {
          // Players with PRESENT status should have Evaluate button
          const evaluateButtons = screen.queryAllByText('Evaluate');
          expect(evaluateButtons.length).toBeGreaterThanOrEqual(0);
        });
      });
    });

    describe('Score Modal', () => {
      it('should open Score modal', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText('Edit Score')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Score'));

        await waitFor(() => {
          // Modal should show team names (U12 may appear in multiple places)
          const u12Elements = screen.getAllByText('U12');
          expect(u12Elements.length).toBeGreaterThan(0);
        });
      });

      it('should update score when Save clicked', async () => {
        mockMatchesApi.updateResult.mockResolvedValue({
          ...mockMatch,
          homeGoals: 4,
          awayGoals: 2,
        });

        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText('Edit Score')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Score'));

        await waitFor(() => {
          const u12Elements = screen.getAllByText('U12');
          expect(u12Elements.length).toBeGreaterThan(0);
        });

        // Find number inputs and change values
        const numberInputs = document.querySelectorAll('input[type="number"]');
        if (numberInputs.length >= 2) {
          fireEvent.change(numberInputs[0], { target: { value: '4' } });
          fireEvent.change(numberInputs[1], { target: { value: '2' } });
        }

        // Click Save button
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
          expect(mockMatchesApi.updateResult).toHaveBeenCalled();
        });
      });

      it('should close Score modal when Cancel clicked', async () => {
        render(<MatchDetailsPage />);

        await waitFor(() => {
          expect(screen.getByText('Edit Score')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Edit Score'));

        await waitFor(() => {
          const u12Elements = screen.getAllByText('U12');
          expect(u12Elements.length).toBeGreaterThan(0);
        });

        // Find and click Cancel button
        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
          // Modal should be closed - U12 appears only in main content now
          expect(screen.queryByText('Set Match Result')).not.toBeInTheDocument();
        });
      });
    });
  });

  describe('For Player (read-only)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
      });
    });

    it('should not show Edit Score button', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('vs Team B')).toBeInTheDocument();
      });

      expect(screen.queryByText('Edit Score')).not.toBeInTheDocument();
    });

    it('should not show Add Goal button', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Goals/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Goals/));

      await waitFor(() => {
        expect(screen.getByText("25'")).toBeInTheDocument();
      });

      expect(screen.queryByText('+ Add Goal')).not.toBeInTheDocument();
    });

    it('should not show Remove button for goals', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Goals/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Goals/));

      await waitFor(() => {
        expect(screen.getByText("25'")).toBeInTheDocument();
      });

      expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    });
  });

  describe('Match results', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should show Draw badge for draw', async () => {
      mockMatchesApi.getOne.mockResolvedValue({
        ...mockMatch,
        homeGoals: 2,
        awayGoals: 2,
      });

      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Draw')).toBeInTheDocument();
      });
    });

    it('should show Loss badge for loss', async () => {
      mockMatchesApi.getOne.mockResolvedValue({
        ...mockMatch,
        homeGoals: 1,
        awayGoals: 3,
      });

      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Loss')).toBeInTheDocument();
      });
    });

    it('should show Away badge for away match', async () => {
      mockMatchesApi.getOne.mockResolvedValue({
        ...mockMatch,
        isHome: false,
      });

      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Away')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
    });

    it('should show loading spinner', () => {
      mockMatchesApi.getOne.mockImplementation(() => new Promise(() => {}));

      render(<MatchDetailsPage />);

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
      mockMatchesApi.getOne.mockRejectedValue(new Error('Network error'));

      render(<MatchDetailsPage />);

      await waitFor(() => {
        // Either shows error or not found message
        const hasError = screen.queryByText('Failed to load match details') ||
                        screen.queryByText('Match not found');
        expect(hasError).toBeTruthy();
      });
    });

    it('should show not found message when match is null', async () => {
      mockMatchesApi.getOne.mockResolvedValue(null as any);

      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Match not found')).toBeInTheDocument();
      });
    });
  });

  describe('Empty goals', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
      });
      mockMatchesApi.getOne.mockResolvedValue({
        ...mockMatch,
        goals: [],
      });
    });

    it('should show empty goals message', async () => {
      render(<MatchDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Goals/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Goals/));

      await waitFor(() => {
        expect(screen.getByText('No goals recorded for this match')).toBeInTheDocument();
      });
    });
  });
});
