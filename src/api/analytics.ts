import { apiClient } from './client';
import type { StatsPeriod } from './stats';
import type { Position } from '../constants/player.constants';

export interface PerformanceScoreComponents {
  skill: number;
  offense: number;
  defense: number;
  team: number;
}

export interface PerformanceWeights {
  skillWeight: number;
  offenseWeight: number;
  defenseWeight: number;
  teamWeight: number;
}

export interface RawPerformanceStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  evaluationCount: number;
  averageEvaluationRating: number | null;
  byCategory: {
    technical: number | null;
    tactical: number | null;
    physical: number | null;
    psychological: number | null;
  };
}

export interface PerformanceScore {
  playerId: string;
  playerName: string;
  position: Position;
  performanceScore: number;
  components: PerformanceScoreComponents;
  weights: PerformanceWeights;
  rawStats: RawPerformanceStats;
  period: StatsPeriod;
}

export interface TeamPerformanceScore {
  groupId: string;
  groupName: string;
  players: PerformanceScore[];
  period: StatsPeriod;
}

export interface PlayerInfo {
  id: string;
  name: string;
  position: Position;
}

export interface PlayerCombinationStats {
  players: PlayerInfo[];
  matchesTogether: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  avgGoalDifference: number;
  averageEvaluationRating: number | null;
  chemistryScore: number;
}

export interface CorePlayer {
  id: string;
  name: string;
  position: Position;
  appearanceInWinningCombinations: number;
  averageChemistryScore: number;
}

export interface TeamChemistry {
  groupId: string;
  groupName: string;
  period: StatsPeriod;
  minimumMatches: number;
  totalMatchesAnalyzed: number;
  bestPairs: PlayerCombinationStats[];
  bestTrios: PlayerCombinationStats[];
  corePlayers: CorePlayer[];
}

export interface PositionExpectation {
  expectedGoalsPerMatch: number;
  expectedAssistsPerMatch: number;
}

export type PositionExpectations = Record<Position, PositionExpectation>;

export interface PerformanceSettings {
  groupId: string;
  groupName: string;
  skillWeight: number;
  offenseWeight: number;
  defenseWeight: number;
  teamWeight: number;
  positionExpectations: PositionExpectations;
  isCustom: boolean;
}

export interface UpdatePerformanceSettingsDto {
  skillWeight?: number;
  offenseWeight?: number;
  defenseWeight?: number;
  teamWeight?: number;
  positionExpectations?: Partial<PositionExpectations>;
}

export const analyticsApi = {
  getMyPerformanceScore: async (period: StatsPeriod = 'all_time'): Promise<PerformanceScore> => {
    const response = await apiClient.get<PerformanceScore>(
      `/analytics/performance-score/my?period=${period}`
    );
    return response.data;
  },

  getTeamPerformanceScores: async (period: StatsPeriod = 'all_time'): Promise<TeamPerformanceScore[]> => {
    const response = await apiClient.get<TeamPerformanceScore[]>(
      `/analytics/performance-score/team?period=${period}`
    );
    return response.data;
  },

  getGroupPerformanceScores: async (
    groupId: string,
    period: StatsPeriod = 'all_time'
  ): Promise<TeamPerformanceScore> => {
    const response = await apiClient.get<TeamPerformanceScore>(
      `/analytics/performance-score/group/${groupId}?period=${period}`
    );
    return response.data;
  },

  getPlayerPerformanceScore: async (
    playerId: string,
    period: StatsPeriod = 'all_time'
  ): Promise<PerformanceScore> => {
    const response = await apiClient.get<PerformanceScore>(
      `/analytics/performance-score/${playerId}?period=${period}`
    );
    return response.data;
  },

  getMyTeamsChemistry: async (period: StatsPeriod = 'all_time'): Promise<TeamChemistry[]> => {
    const response = await apiClient.get<TeamChemistry[]>(
      `/analytics/chemistry/my-teams?period=${period}`
    );
    return response.data;
  },

  getTeamChemistry: async (
    groupId: string,
    period: StatsPeriod = 'all_time',
    minMatches: number = 3
  ): Promise<TeamChemistry> => {
    const response = await apiClient.get<TeamChemistry>(
      `/analytics/chemistry/${groupId}?period=${period}&minMatches=${minMatches}`
    );
    return response.data;
  },

  getSettings: async (groupId: string): Promise<PerformanceSettings> => {
    const response = await apiClient.get<PerformanceSettings>(
      `/analytics/settings/${groupId}`
    );
    return response.data;
  },

  updateSettings: async (
    groupId: string,
    dto: UpdatePerformanceSettingsDto
  ): Promise<PerformanceSettings> => {
    const response = await apiClient.patch<PerformanceSettings>(
      `/analytics/settings/${groupId}`,
      dto
    );
    return response.data;
  },

  resetSettings: async (groupId: string): Promise<PerformanceSettings> => {
    const response = await apiClient.delete<PerformanceSettings>(
      `/analytics/settings/${groupId}`
    );
    return response.data;
  },

  copySettings: async (
    targetGroupId: string,
    sourceGroupId: string
  ): Promise<PerformanceSettings> => {
    const response = await apiClient.post<PerformanceSettings>(
      `/analytics/settings/${targetGroupId}/copy`,
      { sourceGroupId }
    );
    return response.data;
  },

  getMyGroups: async (): Promise<{ id: string; name: string }[]> => {
    const response = await apiClient.get<{ id: string; name: string }[]>(
      '/analytics/settings/my-groups'
    );
    return response.data;
  },
};
