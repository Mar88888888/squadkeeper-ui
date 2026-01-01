import { contactsApi } from './contacts';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('contactsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getContacts', () => {
    it('should call GET /contacts', async () => {
      const mockResponse = {
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
        ],
        admins: [
          {
            id: 'a1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            phoneNumber: null,
            role: 'ADMIN' as const,
          },
        ],
        myCoachIds: ['c1'],
      };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await contactsApi.getContacts();

      expect(mockApiClient.get).toHaveBeenCalledWith('/contacts');
      expect(result).toEqual(mockResponse);
    });

    it('should return empty arrays when no contacts', async () => {
      const mockResponse = {
        coaches: [],
        admins: [],
        myCoachIds: [],
      };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await contactsApi.getContacts();

      expect(result.coaches).toEqual([]);
      expect(result.admins).toEqual([]);
      expect(result.myCoachIds).toEqual([]);
    });

    it('should handle multiple coaches and admins', async () => {
      const mockResponse = {
        coaches: [
          { id: 'c1', firstName: 'John', lastName: 'Coach', email: 'john@example.com', phoneNumber: '+1234567890', role: 'COACH' as const },
          { id: 'c2', firstName: 'Jane', lastName: 'Coach', email: 'jane@example.com', phoneNumber: '+0987654321', role: 'COACH' as const },
        ],
        admins: [
          { id: 'a1', firstName: 'Admin', lastName: 'One', email: 'admin1@example.com', phoneNumber: null, role: 'ADMIN' as const },
          { id: 'a2', firstName: 'Admin', lastName: 'Two', email: 'admin2@example.com', phoneNumber: '+1111111111', role: 'ADMIN' as const },
        ],
        myCoachIds: ['c1', 'c2'],
      };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await contactsApi.getContacts();

      expect(result.coaches).toHaveLength(2);
      expect(result.admins).toHaveLength(2);
      expect(result.myCoachIds).toContain('c1');
      expect(result.myCoachIds).toContain('c2');
    });

    it('should handle error on getContacts', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(contactsApi.getContacts()).rejects.toThrow('Network error');
    });
  });
});
