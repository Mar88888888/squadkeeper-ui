import { authApi } from './auth';
import { apiClient } from './client';

// Mock apiClient
jest.mock('./client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call POST /auth/login with credentials', async () => {
      const mockResponse = { data: { access_token: 'jwt-token-123' } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ access_token: 'jwt-token-123' });
    });

    it('should throw error on failed login', async () => {
      const error = new Error('Invalid credentials');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        authApi.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockApiClient.post.mockRejectedValue(networkError);

      await expect(
        authApi.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Network Error');
    });
  });
});
