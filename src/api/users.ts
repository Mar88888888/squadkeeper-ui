import { apiClient } from './client';
import type {
  CreateCoachRequest,
  CreatePlayerRequest,
  CreateParentRequest,
} from '../types';

export interface CreatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  ageGroup: string;
}

export interface ParentInfo {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PlayerInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  user: {
    id: string;
    email: string;
  };
  group: GroupInfo | null;
  parent: ParentInfo | null;
}

export interface CoachInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  licenseLevel: string;
  experienceYears: number;
  phoneNumber: string | null;
  user: {
    id: string;
    email: string;
  };
}

export interface ParentFullInfo {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  user: {
    id: string;
    email: string;
  };
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
}

export const usersApi = {
  // Coaches
  getCoaches: async (): Promise<CoachInfo[]> => {
    const response = await apiClient.get<CoachInfo[]>('/coaches');
    return response.data;
  },

  createCoach: async (data: CreateCoachRequest): Promise<CreatedUser> => {
    const response = await apiClient.post<CreatedUser>('/coaches', data);
    return response.data;
  },

  deleteCoach: async (id: string): Promise<void> => {
    await apiClient.delete(`/coaches/${id}`);
  },

  // Players
  getPlayers: async (): Promise<PlayerInfo[]> => {
    const response = await apiClient.get<PlayerInfo[]>('/players');
    return response.data;
  },

  createPlayer: async (data: CreatePlayerRequest): Promise<CreatedUser> => {
    const response = await apiClient.post<CreatedUser>('/players', data);
    return response.data;
  },

  deletePlayer: async (id: string): Promise<void> => {
    await apiClient.delete(`/players/${id}`);
  },

  // Parents
  getParents: async (): Promise<ParentFullInfo[]> => {
    const response = await apiClient.get<ParentFullInfo[]>('/parents');
    return response.data;
  },

  createParent: async (data: CreateParentRequest): Promise<CreatedUser> => {
    const response = await apiClient.post<CreatedUser>('/parents', data);
    return response.data;
  },

  deleteParent: async (id: string): Promise<void> => {
    await apiClient.delete(`/parents/${id}`);
  },

  // Groups
  getGroups: async (): Promise<GroupInfo[]> => {
    const response = await apiClient.get<GroupInfo[]>('/groups');
    return response.data;
  },
};
