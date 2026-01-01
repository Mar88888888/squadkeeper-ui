import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi } from '../api/auth';
import { setAuthToken } from '../api/client';
import type { ReactNode } from 'react';

// Mock dependencies
jest.mock('../api/auth', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

jest.mock('../api/client', () => ({
  setAuthToken: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

import { jwtDecode } from 'jwt-decode';

const mockJwtDecode = jwtDecode as jest.Mock;
const mockAuthApiLogin = authApi.login as jest.Mock;
const mockSetAuthToken = setAuthToken as jest.Mock;

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const validToken = 'valid.jwt.token';
  const decodedToken = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'PLAYER',
    firstName: 'John',
    lastName: 'Doe',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const expiredToken = {
    ...decodedToken,
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should have null user and token when no stored token', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should restore user from valid stored token', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(validToken);
      mockJwtDecode.mockReturnValue(decodedToken);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PLAYER',
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockSetAuthToken).toHaveBeenCalledWith(validToken);
    });

    it('should clear expired token from storage', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(validToken);
      mockJwtDecode.mockReturnValue(expiredToken);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle invalid token gracefully', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid-token');
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockAuthApiLogin.mockResolvedValue({ access_token: validToken });
      mockJwtDecode.mockReturnValue(decodedToken);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockAuthApiLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', validToken);
      expect(mockSetAuthToken).toHaveBeenCalledWith(validToken);
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'PLAYER',
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login error', async () => {
      mockAuthApiLogin.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong-password');
        }),
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle missing firstName/lastName in token', async () => {
      const tokenWithoutNames = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockAuthApiLogin.mockResolvedValue({ access_token: validToken });
      mockJwtDecode.mockReturnValue(tokenWithoutNames);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user?.firstName).toBe('');
      expect(result.current.user?.lastName).toBe('');
    });
  });

  describe('logout', () => {
    it('should logout user and clear state', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(validToken);
      mockJwtDecode.mockReturnValue(decodedToken);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockSetAuthToken).toHaveBeenCalledWith(null);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
