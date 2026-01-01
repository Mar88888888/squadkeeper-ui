import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditUserModal } from './EditUserModal';
import type { CoachInfo, PlayerInfo, ParentFullInfo } from '../api/users';

describe('EditUserModal', () => {
  const mockCoach: CoachInfo = {
    id: 'c1',
    firstName: 'John',
    lastName: 'Coach',
    dateOfBirth: '1985-05-15T00:00:00Z',
    licenseLevel: 'A',
    experienceYears: 10,
    phoneNumber: '+1234567890',
    user: { id: 'u1', email: 'john@example.com' },
  };

  const mockPlayer: PlayerInfo = {
    id: 'p1',
    firstName: 'Jane',
    lastName: 'Player',
    dateOfBirth: '2010-03-20T00:00:00Z',
    position: 'FW',
    user: { id: 'u2', email: 'jane@example.com' },
    group: { id: 'g1', name: 'U14', ageGroup: '2010' },
    parent: null,
  };

  const mockParent: ParentFullInfo = {
    id: 'par1',
    firstName: 'Parent',
    lastName: 'User',
    phoneNumber: '+9876543210',
    user: { id: 'u3', email: 'parent@example.com' },
    children: [{ id: 'p1', firstName: 'Jane', lastName: 'Player' }],
  };

  const defaultProps = {
    isOpen: true,
    userType: 'coach' as const,
    user: mockCoach,
    onSave: jest.fn().mockResolvedValue(undefined),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<EditUserModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Edit Coach')).not.toBeInTheDocument();
  });

  it('should not render when user is null', () => {
    render(<EditUserModal {...defaultProps} user={null} />);

    expect(screen.queryByText('Edit Coach')).not.toBeInTheDocument();
  });

  describe('Coach editing', () => {
    it('should render coach form with populated fields', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('Edit Coach')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Coach')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('should show coach-specific fields', () => {
      render(<EditUserModal {...defaultProps} />);

      expect(screen.getByText('License Level')).toBeInTheDocument();
      expect(screen.getByText('Experience (years)')).toBeInTheDocument();
      expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    });

    it('should call onSave with updated coach data', async () => {
      render(<EditUserModal {...defaultProps} />);

      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Johnny' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Johnny',
          })
        );
      });
    });
  });

  describe('Player editing', () => {
    const playerProps = {
      ...defaultProps,
      userType: 'player' as const,
      user: mockPlayer,
    };

    it('should render player form with populated fields', () => {
      render(<EditUserModal {...playerProps} />);

      expect(screen.getByText('Edit Player')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Player')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    });

    it('should show player-specific fields', () => {
      render(<EditUserModal {...playerProps} />);

      expect(screen.getByText('Position')).toBeInTheDocument();
      expect(screen.getByText('Strong Foot')).toBeInTheDocument();
      expect(screen.getByText('Height (cm)')).toBeInTheDocument();
      expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
    });

    it('should not show coach-specific fields', () => {
      render(<EditUserModal {...playerProps} />);

      expect(screen.queryByText('License Level')).not.toBeInTheDocument();
      expect(screen.queryByText('Experience (years)')).not.toBeInTheDocument();
    });
  });

  describe('Parent editing', () => {
    const parentProps = {
      ...defaultProps,
      userType: 'parent' as const,
      user: mockParent,
    };

    it('should render parent form with populated fields', () => {
      render(<EditUserModal {...parentProps} />);

      expect(screen.getByText('Edit Parent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Parent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('parent@example.com')).toBeInTheDocument();
    });

    it('should not show coach or player specific fields', () => {
      render(<EditUserModal {...parentProps} />);

      expect(screen.queryByText('License Level')).not.toBeInTheDocument();
      expect(screen.queryByText('Position')).not.toBeInTheDocument();
      expect(screen.queryByText('Date of Birth')).not.toBeInTheDocument();
    });
  });

  describe('Form interactions', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<EditUserModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during save', async () => {
      const slowSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<EditUserModal {...defaultProps} onSave={slowSave} />);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should call onClose after successful save', async () => {
      render(<EditUserModal {...defaultProps} />);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should display error on save failure', async () => {
      const errorSave = jest.fn().mockRejectedValue({
        response: { data: { message: 'Email already exists' } },
      });
      render(<EditUserModal {...defaultProps} onSave={errorSave} />);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should display generic error message on unknown error', async () => {
      const errorSave = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<EditUserModal {...defaultProps} onSave={errorSave} />);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update user')).toBeInTheDocument();
      });
    });

    it('should not include password if not changed', async () => {
      render(<EditUserModal {...defaultProps} />);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalled();
        const callArgs = defaultProps.onSave.mock.calls[0][0];
        expect(callArgs.password).toBeUndefined();
      });
    });

    it('should include password if changed', async () => {
      render(<EditUserModal {...defaultProps} />);

      const passwordInput = screen.getByPlaceholderText('Enter new password...');
      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            password: 'newpassword123',
          })
        );
      });
    });
  });

  it('should show user subtitle', () => {
    render(<EditUserModal {...defaultProps} />);

    expect(screen.getByText("Update John Coach's information")).toBeInTheDocument();
  });

  it('should update form when user changes', () => {
    const { rerender } = render(<EditUserModal {...defaultProps} />);
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();

    const newCoach = { ...mockCoach, firstName: 'Robert' };
    rerender(<EditUserModal {...defaultProps} user={newCoach} />);

    expect(screen.getByDisplayValue('Robert')).toBeInTheDocument();
  });
});
