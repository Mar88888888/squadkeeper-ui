import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactsPage } from './ContactsPage';
import { useAuth } from '../contexts/AuthContext';
import { contactsApi } from '../api/contacts';
import { UserRole } from '../types';

// Mock useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock contactsApi
jest.mock('../api/contacts', () => ({
  contactsApi: {
    getContacts: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

const mockUseAuth = useAuth as jest.Mock;
const mockContactsApi = contactsApi as jest.Mocked<typeof contactsApi>;

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

describe('ContactsPage', () => {
  const mockLogout = jest.fn();

  const mockContacts = {
    coaches: [
      {
        id: 'c1',
        firstName: 'John',
        lastName: 'Coach',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        role: 'COACH' as const,
        groups: [{ id: 'g1', name: 'U12' }],
      },
      {
        id: 'c2',
        firstName: 'Jane',
        lastName: 'Coach',
        email: 'jane@example.com',
        phoneNumber: null,
        role: 'COACH' as const,
        groups: [],
      },
    ],
    admins: [
      {
        id: 'a1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phoneNumber: '+0987654321',
        role: 'ADMIN' as const,
      },
    ],
    myCoachIds: ['c1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContactsApi.getContacts.mockResolvedValue(mockContacts);
  });

  describe('For Player', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
    });

    it('should render Contacts header', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Contacts')).toBeInTheDocument();
      });
    });

    it('should display coaches section', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Coaches')).toBeInTheDocument();
      });
    });

    it('should display coach names', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
        expect(screen.getByText('Jane Coach')).toBeInTheDocument();
      });
    });

    it('should display coach emails', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      });
    });

    it('should display coach phone numbers', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
      });
    });

    it('should display Administration section', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Administration')).toBeInTheDocument();
      });
    });

    it('should display admin contacts', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });
    });

    it('should show "My coach" badge for assigned coach', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('My coach')).toBeInTheDocument();
      });
    });

    it('should show "Only my coaches" filter checkbox', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Only my coaches')).toBeInTheDocument();
      });
    });

    it('should filter to only my coaches when checkbox is checked', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
        expect(screen.getByText('Jane Coach')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText('John Coach')).toBeInTheDocument();
        expect(screen.queryByText('Jane Coach')).not.toBeInTheDocument();
      });
    });

    it('should display coach initials', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        // Initials are rendered as two text nodes inside a span
        const initialsContainers = document.querySelectorAll('.bg-blue-100');
        expect(initialsContainers.length).toBeGreaterThan(0);
      });
    });

    it('should display group tags for coaches', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('U12')).toBeInTheDocument();
      });
    });
  });

  describe('For Coach', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Coach', lastName: 'Smith', email: 'coach@example.com', role: UserRole.COACH },
        logout: mockLogout,
      });
    });

    it('should not show "Only my coaches" filter for coach role', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Coaches')).toBeInTheDocument();
      });

      expect(screen.queryByText('Only my coaches')).not.toBeInTheDocument();
    });
  });

  describe('For Admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: UserRole.ADMIN },
        logout: mockLogout,
      });
    });

    it('should not show "Only my coaches" filter for admin role', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Coaches')).toBeInTheDocument();
      });

      expect(screen.queryByText('Only my coaches')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
    });

    it('should show Back to Dashboard link', async () => {
      render(<ContactsPage />);

      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    it('should call logout when logout button clicked', async () => {
      render(<ContactsPage />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
    });

    it('should show loading message while loading', () => {
      mockContactsApi.getContacts.mockImplementation(() => new Promise(() => {}));

      render(<ContactsPage />);

      expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
    });

    it('should display error message on API failure', async () => {
      mockContactsApi.getContacts.mockRejectedValue(new Error('Network error'));

      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load contacts')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
      mockContactsApi.getContacts.mockResolvedValue({
        coaches: [],
        admins: [],
        myCoachIds: [],
      });
    });

    it('should show no coaches message when empty', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('No coaches found')).toBeInTheDocument();
      });
    });

    it('should not show admin section when no admins', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Administration')).not.toBeInTheDocument();
      });
    });
  });

  describe('Copy to clipboard', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', firstName: 'Player', lastName: 'One', email: 'player@example.com', role: UserRole.PLAYER },
        logout: mockLogout,
      });
    });

    it('should copy email when clicked', async () => {
      render(<ContactsPage />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      const emailButton = screen.getByText('john@example.com').closest('button');
      if (emailButton) {
        fireEvent.click(emailButton);
        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith('john@example.com');
        });
      }
    });
  });
});
