import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserManagementPage } from './UserManagementPage';
import { usersApi } from '../api/users';

// Mock usersApi
jest.mock('../api/users', () => ({
  usersApi: {
    createCoach: jest.fn(),
    createPlayer: jest.fn(),
    createParent: jest.fn(),
    getPlayers: jest.fn(),
    getGroups: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;

describe('UserManagementPage', () => {
  const mockPlayers = [
    {
      id: 'p1',
      firstName: 'John',
      lastName: 'Player',
      dateOfBirth: '2012-05-15',
      position: 'FW',
      group: { id: 'g1', name: 'U12' },
      parent: null,
      user: { id: 'u1', email: 'john@example.com' },
    },
    {
      id: 'p2',
      firstName: 'Jane',
      lastName: 'Player',
      dateOfBirth: '2012-08-20',
      position: 'MF',
      group: { id: 'g1', name: 'U12' },
      parent: { id: 'par1', firstName: 'Parent', lastName: 'One' },
      user: { id: 'u2', email: 'jane@example.com' },
    },
  ];

  const mockGroups = [
    { id: 'g1', name: 'U12' },
    { id: 'g2', name: 'U14' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsersApi.getPlayers.mockResolvedValue(mockPlayers);
    mockUsersApi.getGroups.mockResolvedValue(mockGroups);
    mockUsersApi.createCoach.mockResolvedValue({ id: 'c1' });
    mockUsersApi.createPlayer.mockResolvedValue({ id: 'p3' });
    mockUsersApi.createParent.mockResolvedValue({ id: 'par2' });
  });

  it('should render User Management header', () => {
    render(<UserManagementPage />);

    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    render(<UserManagementPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<UserManagementPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should show Create New User heading', () => {
    render(<UserManagementPage />);

    expect(screen.getByText('Create New User')).toBeInTheDocument();
  });

  it('should show user type selector tabs', () => {
    render(<UserManagementPage />);

    expect(screen.getByText('Coach')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Parent')).toBeInTheDocument();
  });

  describe('Common fields', () => {
    it('should show first name and last name fields', () => {
      render(<UserManagementPage />);

      expect(screen.getByText('First Name *')).toBeInTheDocument();
      expect(screen.getByText('Last Name *')).toBeInTheDocument();
    });

    it('should show email and password fields', () => {
      render(<UserManagementPage />);

      expect(screen.getByText('Email *')).toBeInTheDocument();
      expect(screen.getByText('Password *')).toBeInTheDocument();
    });

    it('should show phone number field', () => {
      render(<UserManagementPage />);

      expect(screen.getByText('Phone Number')).toBeInTheDocument();
    });
  });

  describe('Coach creation', () => {
    it('should show Coach Details section when Coach tab selected', () => {
      render(<UserManagementPage />);

      expect(screen.getByText('Coach Details')).toBeInTheDocument();
    });

    it('should show coach-specific fields', () => {
      render(<UserManagementPage />);

      expect(screen.getByText('License Level *')).toBeInTheDocument();
      expect(screen.getByText('Experience (years) *')).toBeInTheDocument();
    });

    it('should show license level options', () => {
      render(<UserManagementPage />);

      const licenseSelect = screen.getAllByRole('combobox')[0];
      expect(licenseSelect).toBeInTheDocument();
    });

    it('should show Create Coach button', () => {
      render(<UserManagementPage />);

      expect(screen.getByText('Create Coach')).toBeInTheDocument();
    });

    it('should create coach on form submit', async () => {
      render(<UserManagementPage />);

      // Get all inputs by type
      const textInputs = document.querySelectorAll('input[type="text"]');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const dateInputs = document.querySelectorAll('input[type="date"]');

      fireEvent.change(textInputs[0], { target: { value: 'John' } }); // First Name
      fireEvent.change(textInputs[1], { target: { value: 'Coach' } }); // Last Name
      fireEvent.change(emailInputs[0], { target: { value: 'john@coach.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
      fireEvent.change(dateInputs[0], { target: { value: '1980-01-15' } });

      const licenseSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(licenseSelect, { target: { value: 'B' } });

      fireEvent.click(screen.getByText('Create Coach'));

      await waitFor(() => {
        expect(mockUsersApi.createCoach).toHaveBeenCalled();
      });
    });

    it('should show success message after coach creation', async () => {
      render(<UserManagementPage />);

      const textInputs = document.querySelectorAll('input[type="text"]');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const dateInputs = document.querySelectorAll('input[type="date"]');

      fireEvent.change(textInputs[0], { target: { value: 'John' } });
      fireEvent.change(textInputs[1], { target: { value: 'Coach' } });
      fireEvent.change(emailInputs[0], { target: { value: 'john@coach.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
      fireEvent.change(dateInputs[0], { target: { value: '1980-01-15' } });
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'B' } });

      fireEvent.click(screen.getByText('Create Coach'));

      await waitFor(() => {
        expect(screen.getByText(/Coach John Coach created successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('Player creation', () => {
    beforeEach(() => {
      render(<UserManagementPage />);
      fireEvent.click(screen.getByText('Player'));
    });

    it('should show Player Details section when Player tab selected', () => {
      expect(screen.getByText('Player Details')).toBeInTheDocument();
    });

    it('should show player-specific fields', () => {
      expect(screen.getByText('Position *')).toBeInTheDocument();
      expect(screen.getByText('Height (cm) *')).toBeInTheDocument();
      expect(screen.getByText('Weight (kg) *')).toBeInTheDocument();
      expect(screen.getByText('Strong Foot *')).toBeInTheDocument();
    });

    it('should show Create Player button', () => {
      expect(screen.getByText('Create Player')).toBeInTheDocument();
    });

    it('should have all required player form inputs', async () => {
      // Verify the form has all necessary input types for player creation
      const textInputs = document.querySelectorAll('input[type="text"]');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const dateInputs = document.querySelectorAll('input[type="date"]');
      const numberInputs = document.querySelectorAll('input[type="number"]');
      const selects = screen.getAllByRole('combobox');

      // Verify inputs exist
      expect(textInputs.length).toBeGreaterThanOrEqual(2); // First name, Last name
      expect(emailInputs.length).toBe(1);
      expect(passwordInputs.length).toBe(1);
      expect(dateInputs.length).toBe(1);
      expect(numberInputs.length).toBeGreaterThanOrEqual(2); // Height, Weight
      expect(selects.length).toBeGreaterThanOrEqual(2); // Position, Strong Foot
    });
  });

  describe('Parent creation', () => {
    beforeEach(async () => {
      render(<UserManagementPage />);
      fireEvent.click(screen.getByText('Parent'));
      await waitFor(() => {
        expect(mockUsersApi.getPlayers).toHaveBeenCalled();
      });
    });

    it('should load players when Parent tab selected', async () => {
      await waitFor(() => {
        expect(mockUsersApi.getPlayers).toHaveBeenCalled();
        expect(mockUsersApi.getGroups).toHaveBeenCalled();
      });
    });

    it('should show Link to Players section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Link to Players (Children)')).toBeInTheDocument();
      });
    });

    it('should show player list', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Player')).toBeInTheDocument();
        expect(screen.getByText('Jane Player')).toBeInTheDocument();
      });
    });

    it('should show filter inputs', async () => {
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
      });
    });

    it('should show "Only players without a parent" checkbox', async () => {
      await waitFor(() => {
        expect(screen.getByText('Only players without a parent')).toBeInTheDocument();
      });
    });

    it('should show Has parent badge for players with parent', async () => {
      await waitFor(() => {
        expect(screen.getByText('Has parent')).toBeInTheDocument();
      });
    });

    it('should show Create Parent button', async () => {
      await waitFor(() => {
        expect(screen.getByText('Create Parent')).toBeInTheDocument();
      });
    });

    it('should create parent on form submit', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Player')).toBeInTheDocument();
      });

      const textInputs = document.querySelectorAll('input[type="text"]');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');

      fireEvent.change(textInputs[0], { target: { value: 'Parent' } });
      fireEvent.change(textInputs[1], { target: { value: 'Test' } });
      fireEvent.change(emailInputs[0], { target: { value: 'parent@test.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });

      fireEvent.click(screen.getByText('Create Parent'));

      await waitFor(() => {
        expect(mockUsersApi.createParent).toHaveBeenCalled();
      });
    });

    it('should allow selecting players from the list', async () => {
      await waitFor(() => {
        expect(screen.getByText('John Player')).toBeInTheDocument();
      });

      // Verify checkboxes exist for player selection
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should show error message on API failure', async () => {
      mockUsersApi.createCoach.mockRejectedValue({
        response: { data: { message: 'Email already exists' } },
      });

      render(<UserManagementPage />);

      const textInputs = document.querySelectorAll('input[type="text"]');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const dateInputs = document.querySelectorAll('input[type="date"]');

      fireEvent.change(textInputs[0], { target: { value: 'John' } });
      fireEvent.change(textInputs[1], { target: { value: 'Coach' } });
      fireEvent.change(emailInputs[0], { target: { value: 'existing@email.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
      fireEvent.change(dateInputs[0], { target: { value: '1980-01-15' } });
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'B' } });

      fireEvent.click(screen.getByText('Create Coach'));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('should show generic error when no message provided', async () => {
      mockUsersApi.createCoach.mockRejectedValue(new Error('Network error'));

      render(<UserManagementPage />);

      const textInputs = document.querySelectorAll('input[type="text"]');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const dateInputs = document.querySelectorAll('input[type="date"]');

      fireEvent.change(textInputs[0], { target: { value: 'John' } });
      fireEvent.change(textInputs[1], { target: { value: 'Coach' } });
      fireEvent.change(emailInputs[0], { target: { value: 'john@coach.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
      fireEvent.change(dateInputs[0], { target: { value: '1980-01-15' } });
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'B' } });

      fireEvent.click(screen.getByText('Create Coach'));

      await waitFor(() => {
        expect(screen.getByText('Failed to create user')).toBeInTheDocument();
      });
    });
  });

  describe('Empty players state', () => {
    it('should show message when no players available', async () => {
      mockUsersApi.getPlayers.mockResolvedValue([]);
      mockUsersApi.getGroups.mockResolvedValue([]);

      render(<UserManagementPage />);
      fireEvent.click(screen.getByText('Parent'));

      await waitFor(() => {
        expect(screen.getByText(/No players available/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when loading players', async () => {
      mockUsersApi.getPlayers.mockImplementation(() => new Promise(() => {}));

      render(<UserManagementPage />);
      fireEvent.click(screen.getByText('Parent'));

      await waitFor(() => {
        expect(screen.getByText('Loading players...')).toBeInTheDocument();
      });
    });
  });

  describe('Tab switching', () => {
    it('should clear error message when switching tabs', async () => {
      mockUsersApi.createCoach.mockRejectedValue({
        response: { data: { message: 'Error occurred' } },
      });

      render(<UserManagementPage />);

      const textInputs = document.querySelectorAll('input[type="text"]');
      const emailInputs = document.querySelectorAll('input[type="email"]');
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const dateInputs = document.querySelectorAll('input[type="date"]');

      fireEvent.change(textInputs[0], { target: { value: 'John' } });
      fireEvent.change(textInputs[1], { target: { value: 'Coach' } });
      fireEvent.change(emailInputs[0], { target: { value: 'john@coach.com' } });
      fireEvent.change(passwordInputs[0], { target: { value: 'password123' } });
      fireEvent.change(dateInputs[0], { target: { value: '1980-01-15' } });
      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'B' } });

      fireEvent.click(screen.getByText('Create Coach'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });

      // Switch tab
      fireEvent.click(screen.getByText('Player'));

      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
    });
  });
});
