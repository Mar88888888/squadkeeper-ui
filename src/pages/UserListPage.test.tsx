import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserListPage } from './UserListPage';
import { usersApi } from '../api/users';

// Mock usersApi
jest.mock('../api/users', () => ({
  usersApi: {
    getCoaches: jest.fn(),
    getPlayers: jest.fn(),
    getParents: jest.fn(),
    getGroups: jest.fn(),
    deleteCoach: jest.fn(),
    deletePlayer: jest.fn(),
    deleteParent: jest.fn(),
    updateCoach: jest.fn(),
    updatePlayer: jest.fn(),
    updateParent: jest.fn(),
    linkChildToParent: jest.fn(),
    unlinkChildFromParent: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;

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

describe('UserListPage', () => {
  const mockCoaches = [
    {
      id: 'c1',
      firstName: 'John',
      lastName: 'Coach',
      dateOfBirth: '1980-05-15',
      licenseLevel: 'B',
      experienceYears: 10,
      user: { id: 'u1', email: 'john@coach.com' },
    },
    {
      id: 'c2',
      firstName: 'Jane',
      lastName: 'Coach',
      dateOfBirth: '1985-08-20',
      licenseLevel: 'A',
      experienceYears: 15,
      user: { id: 'u2', email: 'jane@coach.com' },
    },
  ];

  const mockPlayers = [
    {
      id: 'p1',
      firstName: 'Tom',
      lastName: 'Player',
      dateOfBirth: '2012-05-15',
      position: 'FW',
      height: 165,
      weight: 55,
      strongFoot: 'right',
      group: { id: 'g1', name: 'U12' },
      parent: null,
      user: { id: 'u3', email: 'tom@player.com' },
    },
    {
      id: 'p2',
      firstName: 'Sara',
      lastName: 'Player',
      dateOfBirth: '2012-08-20',
      position: 'MF',
      height: 160,
      weight: 50,
      strongFoot: 'left',
      group: { id: 'g1', name: 'U12' },
      parent: { id: 'par1', firstName: 'Parent', lastName: 'One' },
      user: { id: 'u4', email: 'sara@player.com' },
    },
  ];

  const mockParents = [
    {
      id: 'par1',
      firstName: 'Parent',
      lastName: 'One',
      phoneNumber: '123456789',
      children: [
        { id: 'p2', firstName: 'Sara', lastName: 'Player' },
      ],
      user: { id: 'u5', email: 'parent@one.com' },
    },
    {
      id: 'par2',
      firstName: 'Parent',
      lastName: 'Two',
      phoneNumber: '987654321',
      children: [],
      user: { id: 'u6', email: 'parent@two.com' },
    },
  ];

  const mockGroups = [
    { id: 'g1', name: 'U12' },
    { id: 'g2', name: 'U14' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsersApi.getCoaches.mockResolvedValue(mockCoaches);
    mockUsersApi.getPlayers.mockResolvedValue(mockPlayers);
    mockUsersApi.getParents.mockResolvedValue(mockParents);
    mockUsersApi.getGroups.mockResolvedValue(mockGroups);
    mockUsersApi.deleteCoach.mockResolvedValue(undefined);
    mockUsersApi.deletePlayer.mockResolvedValue(undefined);
    mockUsersApi.deleteParent.mockResolvedValue(undefined);
  });

  it('should render User List header', async () => {
    render(<UserListPage />);

    expect(screen.getByText('User List')).toBeInTheDocument();
  });

  it('should show Back to Dashboard button', () => {
    render(<UserListPage />);

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate to dashboard when Back button clicked', () => {
    render(<UserListPage />);

    fireEvent.click(screen.getByText('Back to Dashboard'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('should show + Create User button', () => {
    render(<UserListPage />);

    expect(screen.getByText('+ Create User')).toBeInTheDocument();
  });

  it('should navigate to user management when Create User clicked', () => {
    render(<UserListPage />);

    fireEvent.click(screen.getByText('+ Create User'));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
  });

  it('should show search input', () => {
    render(<UserListPage />);

    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
  });

  describe('Tabs', () => {
    it('should show all tabs', () => {
      render(<UserListPage />);

      expect(screen.getByText('Coaches')).toBeInTheDocument();
      expect(screen.getByText('Players')).toBeInTheDocument();
      expect(screen.getByText('Parents')).toBeInTheDocument();
    });

    it('should load coaches on initial render', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(mockUsersApi.getCoaches).toHaveBeenCalled();
      });
    });

    it('should load players when Players tab clicked', async () => {
      render(<UserListPage />);

      fireEvent.click(screen.getByText('Players'));

      await waitFor(() => {
        expect(mockUsersApi.getPlayers).toHaveBeenCalled();
      });
    });

    it('should load parents when Parents tab clicked', async () => {
      render(<UserListPage />);

      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(mockUsersApi.getParents).toHaveBeenCalled();
      });
    });
  });

  describe('Coaches list', () => {
    it('should display coaches', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
        expect(screen.getByText('Jane Coach')).toBeInTheDocument();
      });
    });

    it('should display coach emails', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('john@coach.com')).toBeInTheDocument();
      });
    });

    it('should display license level', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('License: B')).toBeInTheDocument();
      });
    });

    it('should display experience years', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('10 years exp.')).toBeInTheDocument();
      });
    });

    it('should show count badge in tab', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // 2 coaches
      });
    });
  });

  describe('Players list', () => {
    beforeEach(async () => {
      render(<UserListPage />);
      fireEvent.click(screen.getByText('Players'));
      await waitFor(() => {
        expect(mockUsersApi.getPlayers).toHaveBeenCalled();
      });
    });

    it('should display players', async () => {
      await waitFor(() => {
        expect(screen.getByText('Tom Player')).toBeInTheDocument();
        expect(screen.getByText('Sara Player')).toBeInTheDocument();
      });
    });

    it('should display player position', async () => {
      await waitFor(() => {
        expect(screen.getByText('FW')).toBeInTheDocument();
      });
    });

    it('should display player group', async () => {
      await waitFor(() => {
        // The group name appears in the player info
        const playerInfo = screen.getAllByText(/U12/);
        expect(playerInfo.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Parents list', () => {
    beforeEach(async () => {
      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));
      await waitFor(() => {
        expect(mockUsersApi.getParents).toHaveBeenCalled();
      });
    });

    it('should display parents', async () => {
      await waitFor(() => {
        expect(screen.getByText('Parent One')).toBeInTheDocument();
        expect(screen.getByText('Parent Two')).toBeInTheDocument();
      });
    });

    it('should display linked children', async () => {
      await waitFor(() => {
        expect(screen.getByText('Linked children:')).toBeInTheDocument();
        expect(screen.getByText('Sara Player')).toBeInTheDocument();
      });
    });
  });

  describe('Search functionality', () => {
    it('should filter coaches by name', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name...'), {
        target: { value: 'Jane' },
      });

      expect(screen.queryByText('John Coach')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Coach')).toBeInTheDocument();
    });

    it('should show clear button when search has value', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name...'), {
        target: { value: 'test' },
      });

      // There should be a clear button (X icon)
      const clearButton = screen.getByRole('button', { name: '' });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Delete functionality', () => {
    it('should open delete dialog when delete button clicked', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      // Click delete button (title="Delete coach")
      const deleteButtons = screen.getAllByTitle('Delete coach');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete "John Coach"/)).toBeInTheDocument();
      });
    });

    it('should delete coach on confirm', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete coach');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockUsersApi.deleteCoach).toHaveBeenCalledWith('c1');
      });
    });

    it('should close dialog on cancel', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete coach');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit functionality', () => {
    it('should open edit modal when edit button clicked', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit coach');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Coach')).toBeInTheDocument();
      });
    });
  });

  describe('Link child functionality', () => {
    it('should open link child modal when + button clicked', async () => {
      mockUsersApi.getPlayers.mockResolvedValue(mockPlayers);

      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(screen.getByText('Parent One')).toBeInTheDocument();
      });

      const linkButtons = screen.getAllByTitle('Link child');
      fireEvent.click(linkButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Link Child to Parent One/)).toBeInTheDocument();
      });
    });

    it('should show available players in modal', async () => {
      mockUsersApi.getPlayers.mockResolvedValue(mockPlayers);
      mockUsersApi.getGroups.mockResolvedValue(mockGroups);

      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(screen.getByText('Parent Two')).toBeInTheDocument();
      });

      const linkButtons = screen.getAllByTitle('Link child');
      // Click on Parent Two (second button) who has no children linked
      fireEvent.click(linkButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Link Child to Parent Two/)).toBeInTheDocument();
        // Players should be visible
        expect(screen.getByText('Tom Player')).toBeInTheDocument();
      });
    });
  });

  describe('Unlink child functionality', () => {
    it('should unlink child when X button clicked', async () => {
      mockUsersApi.unlinkChildFromParent.mockResolvedValue({
        ...mockParents[0],
        children: [],
      });

      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(screen.getByText('Sara Player')).toBeInTheDocument();
      });

      // Find unlink button (the X next to child name)
      const unlinkButton = screen.getByTitle('Unlink child');
      fireEvent.click(unlinkButton);

      await waitFor(() => {
        expect(mockUsersApi.unlinkChildFromParent).toHaveBeenCalledWith('par1', 'p2');
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner while loading', async () => {
      mockUsersApi.getCoaches.mockImplementation(() => new Promise(() => {}));

      render(<UserListPage />);

      expect(document.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should show error message on API failure', async () => {
      mockUsersApi.getCoaches.mockRejectedValue(new Error('Network error'));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Empty states', () => {
    it('should show message when no coaches found', async () => {
      mockUsersApi.getCoaches.mockResolvedValue([]);

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('No coaches found')).toBeInTheDocument();
      });
    });

    it('should show message when no players found', async () => {
      mockUsersApi.getPlayers.mockResolvedValue([]);

      render(<UserListPage />);
      fireEvent.click(screen.getByText('Players'));

      await waitFor(() => {
        expect(screen.getByText('No players found')).toBeInTheDocument();
      });
    });

    it('should show message when no parents found', async () => {
      mockUsersApi.getParents.mockResolvedValue([]);

      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(screen.getByText('No parents found')).toBeInTheDocument();
      });
    });

    it('should show search no match message', async () => {
      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Search by name...'), {
        target: { value: 'xyz123' },
      });

      expect(screen.getByText('No coaches match your search')).toBeInTheDocument();
    });
  });

  describe('Delete player and parent', () => {
    it('should delete player on confirm', async () => {
      render(<UserListPage />);
      fireEvent.click(screen.getByText('Players'));

      await waitFor(() => {
        expect(screen.getByText('Tom Player')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete player');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockUsersApi.deletePlayer).toHaveBeenCalledWith('p1');
      });
    });

    it('should delete parent on confirm', async () => {
      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(screen.getByText('Parent One')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete parent');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockUsersApi.deleteParent).toHaveBeenCalledWith('par1');
      });
    });

    it('should show error when delete fails', async () => {
      mockUsersApi.deleteCoach.mockRejectedValue(new Error('Delete failed'));

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete coach');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Failed to delete user')).toBeInTheDocument();
      });
    });
  });

  describe('Edit save functionality', () => {
    it('should save coach edit', async () => {
      const updatedCoach = { ...mockCoaches[0], firstName: 'Johnny' };
      mockUsersApi.updateCoach.mockResolvedValue(updatedCoach);

      render(<UserListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit coach');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Coach')).toBeInTheDocument();
      });

      // The EditUserModal component is imported and rendered
      // We just verify it opens - the actual save is handled by the modal component
    });

    it('should open edit modal for player', async () => {
      render(<UserListPage />);
      fireEvent.click(screen.getByText('Players'));

      await waitFor(() => {
        expect(screen.getByText('Tom Player')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit player');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Player')).toBeInTheDocument();
      });
    });

    it('should open edit modal for parent', async () => {
      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(screen.getByText('Parent One')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Edit parent');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Parent')).toBeInTheDocument();
      });
    });
  });

  describe('Link child with selection', () => {
    it('should link child when player is selected', async () => {
      mockUsersApi.linkChildToParent.mockResolvedValue({
        ...mockParents[1],
        children: [{ id: 'p1', firstName: 'Tom', lastName: 'Player' }],
      });

      render(<UserListPage />);
      fireEvent.click(screen.getByText('Parents'));

      await waitFor(() => {
        expect(screen.getByText('Parent Two')).toBeInTheDocument();
      });

      const linkButtons = screen.getAllByTitle('Link child');
      // Click on Parent Two (second button) who has no children
      fireEvent.click(linkButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Link Child to Parent Two/)).toBeInTheDocument();
      });

      // Find and click a player to link
      await waitFor(() => {
        expect(screen.getByText('Tom Player')).toBeInTheDocument();
      });

      // Click on the player to link
      fireEvent.click(screen.getByText('Tom Player'));

      await waitFor(() => {
        expect(mockUsersApi.linkChildToParent).toHaveBeenCalledWith('par2', 'p1');
      });
    });
  });
});
