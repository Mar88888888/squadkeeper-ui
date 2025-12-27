import { apiClient } from './client';

export interface CoachBrief {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PlayerBrief {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  yearOfBirth: number;
  headCoach: CoachBrief | null;
  assistants: CoachBrief[];
  players: PlayerBrief[];
}

export interface CreateGroupRequest {
  name: string;
  yearOfBirth: number;
  headCoachId?: string;
  assistantIds?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  yearOfBirth?: number;
}

export interface UpdateGroupStaffRequest {
  headCoachId?: string | null;
  assistantIds?: string[];
}

export const groupsApi = {
  getAll: async (): Promise<GroupInfo[]> => {
    const response = await apiClient.get<GroupInfo[]>('/groups');
    return response.data;
  },

  getOne: async (id: string): Promise<GroupInfo> => {
    const response = await apiClient.get<GroupInfo>(`/groups/${id}`);
    return response.data;
  },

  create: async (data: CreateGroupRequest): Promise<GroupInfo> => {
    const response = await apiClient.post<GroupInfo>('/groups', data);
    return response.data;
  },

  update: async (id: string, data: UpdateGroupRequest): Promise<GroupInfo> => {
    const response = await apiClient.patch<GroupInfo>(`/groups/${id}`, data);
    return response.data;
  },

  updateStaff: async (id: string, data: UpdateGroupStaffRequest): Promise<GroupInfo> => {
    const response = await apiClient.patch<GroupInfo>(`/groups/${id}/staff`, data);
    return response.data;
  },

  addPlayers: async (id: string, playerIds: string[]): Promise<GroupInfo> => {
    const response = await apiClient.post<GroupInfo>(`/groups/${id}/players`, { playerIds });
    return response.data;
  },

  removePlayers: async (id: string, playerIds: string[]): Promise<GroupInfo> => {
    const response = await apiClient.delete<GroupInfo>(`/groups/${id}/players`, {
      data: { playerIds },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/groups/${id}`);
  },
};
