import { apiClient } from './client';

export type StatsPeriod = 'all_time' | 'this_year' | 'this_month';

export interface PlayerStats {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  period: StatsPeriod;
}

export interface TeamStats {
  groupId: string;
  groupName: string;
  players: PlayerStats[];
  period: StatsPeriod;
}

export interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ChildrenStats {
  children: ChildInfo[];
  stats: PlayerStats | null;
}

export const statsApi = {
  getMyStats: async (period: StatsPeriod = 'all_time'): Promise<PlayerStats> => {
    const response = await apiClient.get<PlayerStats>(
      `/players/stats/my?period=${period}`
    );
    return response.data;
  },

  getTeamStats: async (period: StatsPeriod = 'all_time'): Promise<TeamStats[]> => {
    const response = await apiClient.get<TeamStats[]>(
      `/players/stats/team?period=${period}`
    );
    return response.data;
  },

  getPlayerStats: async (
    playerId: string,
    period: StatsPeriod = 'all_time'
  ): Promise<PlayerStats> => {
    const response = await apiClient.get<PlayerStats>(
      `/players/stats/${playerId}?period=${period}`
    );
    return response.data;
  },

  getChildrenStats: async (
    period: StatsPeriod = 'all_time',
    childId?: string
  ): Promise<ChildrenStats> => {
    const params = new URLSearchParams({ period });
    if (childId) {
      params.append('childId', childId);
    }
    const response = await apiClient.get<ChildrenStats>(
      `/players/stats/children?${params.toString()}`
    );
    return response.data;
  },
};
