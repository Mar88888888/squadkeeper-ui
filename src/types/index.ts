export const UserRole = {
  ADMIN: 'ADMIN',
  COACH: 'COACH',
  PLAYER: 'PLAYER',
  PARENT: 'PARENT',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Admin user creation types
export interface CreateCoachRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth: string;
  licenseLevel: string;
  experienceYears: number;
}

export interface CreatePlayerRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth: string;
  position: string;
  height: number;
  weight: number;
  strongFoot: string;
}

export interface CreateParentRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  childrenIds?: string[];
}
