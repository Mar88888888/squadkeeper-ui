import { apiClient } from './client';
import { Position } from '../constants/player.constants';
import { GameFormat } from '../constants/squad.constants';

export interface SquadPositionDto {
  id?: string;
  playerId?: string | null;
  role: Position;
  isStarter: boolean;
  orderIndex: number;
  player?: PlayerBrief | null;
}

export interface PlayerBrief {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: Position;
}

export interface CoachBrief {
  id: string;
  firstName: string;
  lastName: string;
}

export interface GroupBrief {
  id: string;
  name: string;
  yearOfBirth: number;
  players?: PlayerBrief[];
}

export interface Squad {
  id: string;
  name: string;
  gameFormat: GameFormat;
  group: GroupBrief;
  createdBy: CoachBrief | null;
  positions: SquadPositionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSquadRequest {
  name: string;
  gameFormat: GameFormat;
  groupId: string;
  positions?: Array<{
    playerId?: string | null;
    role: Position;
    isStarter: boolean;
    orderIndex: number;
  }>;
}

export interface UpdateSquadRequest {
  name?: string;
  gameFormat?: GameFormat;
}

export interface UpdatePositionsRequest {
  positions: Array<{
    playerId?: string | null;
    role: Position;
    isStarter: boolean;
    orderIndex: number;
  }>;
}

export const squadsApi = {
  create: async (data: CreateSquadRequest): Promise<Squad> => {
    const response = await apiClient.post<Squad>('/squads', data);
    return response.data;
  },

  getByGroup: async (groupId: string): Promise<Squad[]> => {
    const response = await apiClient.get<Squad[]>(`/squads/group/${groupId}`);
    return response.data;
  },

  getOne: async (id: string): Promise<Squad> => {
    const response = await apiClient.get<Squad>(`/squads/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateSquadRequest): Promise<Squad> => {
    const response = await apiClient.patch<Squad>(`/squads/${id}`, data);
    return response.data;
  },

  updatePositions: async (
    id: string,
    data: UpdatePositionsRequest,
  ): Promise<Squad> => {
    const response = await apiClient.put<Squad>(`/squads/${id}/positions`, data);
    return response.data;
  },

  duplicate: async (id: string, name: string): Promise<Squad> => {
    const response = await apiClient.post<Squad>(`/squads/${id}/duplicate`, {
      name,
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/squads/${id}`);
  },
};
