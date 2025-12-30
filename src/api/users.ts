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

export interface UpdateCoachRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  licenseLevel?: string;
  experienceYears?: number;
}

export interface UpdatePlayerRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  position?: string;
  height?: number;
  weight?: number;
  strongFoot?: string;
}

export interface UpdateParentRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
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

  updateCoach: async (id: string, data: UpdateCoachRequest): Promise<CoachInfo> => {
    const response = await apiClient.patch<CoachInfo>(`/coaches/${id}`, data);
    return response.data;
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

  updatePlayer: async (id: string, data: UpdatePlayerRequest): Promise<PlayerInfo> => {
    const response = await apiClient.patch<PlayerInfo>(`/players/${id}`, data);
    return response.data;
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

  updateParent: async (id: string, data: UpdateParentRequest): Promise<ParentFullInfo> => {
    const response = await apiClient.patch<ParentFullInfo>(`/parents/${id}`, data);
    return response.data;
  },

  linkChildToParent: async (parentId: string, playerId: string): Promise<ParentFullInfo> => {
    const response = await apiClient.post<ParentFullInfo>(`/parents/${parentId}/children/${playerId}`);
    return response.data;
  },

  unlinkChildFromParent: async (parentId: string, playerId: string): Promise<ParentFullInfo> => {
    const response = await apiClient.delete<ParentFullInfo>(`/parents/${parentId}/children/${playerId}`);
    return response.data;
  },

  // Groups
  getGroups: async (): Promise<GroupInfo[]> => {
    const response = await apiClient.get<GroupInfo[]>('/groups');
    return response.data;
  },
};
