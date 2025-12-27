import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/auth';
import { setAuthToken } from '../api/client';
import type { AuthContextType, User } from '../types';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  exp: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setAuthToken(storedToken);
          setUser({
            id: decoded.sub,
            email: decoded.email,
            firstName: decoded.firstName || '',
            lastName: decoded.lastName || '',
            role: decoded.role as User['role'],
          });
        } else {
          localStorage.removeItem('token');
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const decoded = jwtDecode<JwtPayload>(response.access_token);

    localStorage.setItem('token', response.access_token);
    setAuthToken(response.access_token);
    setToken(response.access_token);
    setUser({
      id: decoded.sub,
      email: decoded.email,
      firstName: decoded.firstName || '',
      lastName: decoded.lastName || '',
      role: decoded.role as User['role'],
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
