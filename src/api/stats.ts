import { apiClient } from './client';
import { Position } from '../constants/player.constants';
import type { AttendanceStats } from './attendance';

export type StatsPeriod =
  | 'all_time'
  | 'this_season'
  | 'this_year'
  | 'this_month';

export interface PlayerStats {
  playerId: string;
  playerName: string;
  position: Position;
  matchesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  attendance: AttendanceStats;
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
  groupId: string | null;
  stats: PlayerStats | null;
}

export interface ChildrenStats {
  children: ChildInfo[];
}

export const statsApi = {
  getMyStats: async (
    period: StatsPeriod = 'all_time',
  ): Promise<PlayerStats> => {
    const response = await apiClient.get<PlayerStats>('/players/stats/my', {
      params: { period },
    });
    return response.data;
  },

  getTeamStats: async (
    period: StatsPeriod = 'all_time',
  ): Promise<TeamStats[]> => {
    const response = await apiClient.get<TeamStats[]>('/players/stats/team', {
      params: { period },
    });
    return response.data;
  },

  getPlayerStats: async (
    playerId: string,
    period: StatsPeriod = 'all_time',
  ): Promise<PlayerStats> => {
    const response = await apiClient.get<PlayerStats>(
      `/players/stats/${encodeURIComponent(playerId)}`,
      { params: { period } },
    );
    return response.data;
  },

  getChildrenStats: async (
    period: StatsPeriod = 'all_time',
  ): Promise<ChildrenStats> => {
    const response = await apiClient.get<ChildrenStats>('/players/stats/children', {
      params: { period },
    });
    return response.data;
  },
};
