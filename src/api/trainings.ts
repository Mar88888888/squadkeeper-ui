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

const buildFilterParams = (filters?: TrainingFilters): string => {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.timeFilter && filters.timeFilter !== 'all') {
    params.append('timeFilter', filters.timeFilter);
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const trainingsApi = {
  getAll: async (filters?: TrainingFilters): Promise<Training[]> => {
    const response = await apiClient.get<Training[]>(
      `/trainings${buildFilterParams(filters)}`
    );
    return response.data;
  },

  getMy: async (filters?: TrainingFilters): Promise<Training[]> => {
    const response = await apiClient.get<Training[]>(
      `/trainings/my${buildFilterParams(filters)}`
    );
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
