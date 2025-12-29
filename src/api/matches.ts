import { apiClient } from './client';

export interface Match {
  id: string;
  startTime: string;
  endTime: string;
  location: string;
  opponent: string;
  isHome: boolean;
  homeGoals: number | null;
  awayGoals: number | null;
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

export interface Goal {
  id: string;
  scorer: PlayerBrief;
  assist: PlayerBrief | null;
  minute: number | null;
  isOwnGoal: boolean;
}

export interface MatchDetails extends Match {
  group: {
    id: string;
    name: string;
    players: PlayerBrief[];
  };
  goals: Goal[];
}

export interface CreateMatchRequest {
  groupId: string;
  startTime: string;
  endTime: string;
  location: string;
  opponent: string;
  isHome: boolean;
}

export interface UpdateMatchResultRequest {
  homeGoals: number;
  awayGoals: number;
}

export interface AddGoalRequest {
  scorerId: string;
  assistId?: string;
  minute?: number;
  isOwnGoal?: boolean;
}

export type MatchTimeFilter =
  | 'all'
  | 'upcoming'
  | 'past'
  | 'this_week'
  | 'next_week'
  | 'this_month';

export interface MatchFilters {
  dateFrom?: string;
  dateTo?: string;
  timeFilter?: MatchTimeFilter;
}

const buildFilterParams = (filters?: MatchFilters): string => {
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

export const matchesApi = {
  getAll: async (filters?: MatchFilters): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>(
      `/matches${buildFilterParams(filters)}`
    );
    return response.data;
  },

  getMy: async (filters?: MatchFilters): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>(
      `/matches/my${buildFilterParams(filters)}`
    );
    return response.data;
  },

  getOne: async (id: string): Promise<MatchDetails> => {
    const response = await apiClient.get<MatchDetails>(`/matches/${id}`);
    return response.data;
  },

  getByGroup: async (groupId: string): Promise<Match[]> => {
    const response = await apiClient.get<Match[]>(`/matches/group/${groupId}`);
    return response.data;
  },

  create: async (data: CreateMatchRequest): Promise<Match> => {
    const response = await apiClient.post<Match>('/matches', data);
    return response.data;
  },

  updateResult: async (id: string, data: UpdateMatchResultRequest): Promise<Match> => {
    const response = await apiClient.patch<Match>(`/matches/${id}/score`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/matches/${id}`);
  },

  // Goals endpoints
  getGoals: async (matchId: string): Promise<Goal[]> => {
    const response = await apiClient.get<Goal[]>(`/matches/${matchId}/goals`);
    return response.data;
  },

  addGoal: async (matchId: string, data: AddGoalRequest): Promise<Goal> => {
    const response = await apiClient.post<Goal>(`/matches/${matchId}/goals`, data);
    return response.data;
  },

  removeGoal: async (matchId: string, goalId: string): Promise<void> => {
    await apiClient.delete(`/matches/${matchId}/goals/${goalId}`);
  },
};
