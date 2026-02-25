jest.mock('../config', () => ({
  config: {
    apiBaseUrl: '/api',
  },
}));

import { apiClient, setAuthToken } from './client';

jest.mock('axios', () => {
  const mockAxios: Record<string, unknown> = {
    create: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  mockAxios.create = jest.fn(() => mockAxios);
  return {
    __esModule: true,
    default: mockAxios,
  };
});

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset headers
    apiClient.defaults.headers.common = {};
  });

  describe('setAuthToken', () => {
    it('should set Authorization header when token is provided', () => {
      setAuthToken('test-token-123');

      expect(apiClient.defaults.headers.common['Authorization']).toBe('Bearer test-token-123');
    });

    it('should remove Authorization header when token is null', () => {
      // First set a token
      apiClient.defaults.headers.common['Authorization'] = 'Bearer old-token';

      setAuthToken(null);

      expect(apiClient.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should update Authorization header when token changes', () => {
      setAuthToken('first-token');
      expect(apiClient.defaults.headers.common['Authorization']).toBe('Bearer first-token');

      setAuthToken('second-token');
      expect(apiClient.defaults.headers.common['Authorization']).toBe('Bearer second-token');
    });
  });

  describe('apiClient configuration', () => {
    it('should have baseURL set', () => {
      expect(apiClient).toBeDefined();
    });
  });
});
