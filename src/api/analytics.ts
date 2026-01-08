import { apiClient } from './client';
import type { StatsPeriod } from './stats';
import type { Position } from '../constants/player.constants';

// Performance Score Types
export interface PerformanceScoreComponents {
  evaluationScore: number;        // 0-35 points
  goalContribution: number;       // Position-dependent (part of 50 pts)
  assistContribution: number;     // Position-dependent (part of 50 pts)
  cleanSheetContribution: number; // Position-dependent (part of 50 pts)
  winRateContribution: number;    // 0-10 points
  participationBonus: number;     // 0-5 points
}

// Position-specific max weights (goals + assists + cleanSheets = 50)
export interface PositionScoreWeights {
  goalMax: number;
  assistMax: number;
  cleanSheetMax: number;
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
  maxWeights: PositionScoreWeights;
  rawStats: RawPerformanceStats;
  period: StatsPeriod;
}

export interface TeamPerformanceScore {
  groupId: string;
  groupName: string;
  players: PerformanceScore[];
  period: StatsPeriod;
}

// Team Chemistry Types
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

// API Functions
export const analyticsApi = {
  // Performance Score
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

  // Team Chemistry
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
};
