import { apiClient } from './client';

export interface Training {
  id: string;
  startTime: string;
  endTime: string;
  location: string;
  topic?: string;
  group: {
    id: string;
    name: string;
  };
}

export interface PlayerBrief {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

export interface TrainingDetails extends Training {
  group: {
    id: string;
    name: string;
    players: PlayerBrief[];
  };
}

export interface CreateTrainingRequest {
  groupId: string;
  startTime: string;
  endTime: string;
  location: string;
  topic?: string;
}

export const trainingsApi = {
  getAll: async (): Promise<Training[]> => {
    const response = await apiClient.get<Training[]>('/trainings');
    return response.data;
  },

  getMy: async (): Promise<Training[]> => {
    const response = await apiClient.get<Training[]>('/trainings/my');
    return response.data;
  },

  getOne: async (id: string): Promise<TrainingDetails> => {
    const response = await apiClient.get<TrainingDetails>(`/trainings/${id}`);
    return response.data;
  },

  getByGroup: async (groupId: string): Promise<Training[]> => {
    const response = await apiClient.get<Training[]>(`/trainings/group/${groupId}`);
    return response.data;
  },

  create: async (data: CreateTrainingRequest): Promise<Training> => {
    const response = await apiClient.post<Training>('/trainings', data);
    return response.data;
  },
};
