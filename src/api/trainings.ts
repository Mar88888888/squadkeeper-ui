import { apiClient } from './client';

export interface Training {
  id: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  topic?: string;
  group: {
    id: string;
    name: string;
  };
}

export function getTrainingEndTime(training: { startTime: string; durationMinutes: number }): Date {
  return new Date(new Date(training.startTime).getTime() + training.durationMinutes * 60000);
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
  durationMinutes: number;
  location: string;
  topic?: string;
}

export interface UpdateTrainingRequest {
  groupId?: string;
  startTime?: string;
  durationMinutes?: number;
  location?: string;
  topic?: string;
}

export type TrainingTimeFilter =
  | 'all'
  | 'upcoming'
  | 'past'
  | 'this_week'
  | 'next_week'
  | 'this_month';

export interface TrainingFilters {
  dateFrom?: string;
  dateTo?: string;
  timeFilter?: TrainingTimeFilter;
}

const buildFilterParams = (filters?: TrainingFilters): Record<string, string> | undefined => {
  if (!filters) return undefined;
  const params: Record<string, string> = {};
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.timeFilter && filters.timeFilter !== 'all') {
    params.timeFilter = filters.timeFilter;
  }
  return Object.keys(params).length > 0 ? params : undefined;
};

export const trainingsApi = {
  getAll: async (filters?: TrainingFilters): Promise<Training[]> => {
    const response = await apiClient.get<Training[]>('/trainings', {
      params: buildFilterParams(filters),
    });
    return response.data;
  },

  getMy: async (filters?: TrainingFilters): Promise<Training[]> => {
    const response = await apiClient.get<Training[]>('/trainings/my', {
      params: buildFilterParams(filters),
    });
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

  update: async (id: string, data: UpdateTrainingRequest): Promise<Training> => {
    const response = await apiClient.patch<Training>(`/trainings/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/trainings/${id}`);
  },
};
