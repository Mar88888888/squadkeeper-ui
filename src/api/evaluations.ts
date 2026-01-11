import { apiClient } from './client';

export interface EvaluationRecord {
  playerId: string;
  technical?: number;
  tactical?: number;
  physical?: number;
  psychological?: number;
  comment?: string;
}

export interface Evaluation {
  id: string;
  technical: number | null;
  tactical: number | null;
  physical: number | null;
  psychological: number | null;
  comment: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
  };
  coach: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateEvaluationBatchRequest {
  trainingId?: string;
  matchId?: string;
  records: EvaluationRecord[];
}

export interface RatingHistoryPoint {
  date: string;
  eventType: 'training' | 'match';
  eventId: string;
  averageRating: number;
  ratings: {
    technical: number | null;
    tactical: number | null;
    physical: number | null;
    psychological: number | null;
  };
}

export interface RatingStats {
  averageRating: number | null;
  totalEvents: number;
  byCategory: {
    technical: number | null;
    tactical: number | null;
    physical: number | null;
    psychological: number | null;
  };
  history: RatingHistoryPoint[];
}

export function getEvaluationAverage(evaluation: Evaluation): number | null {
  const ratings = [
    evaluation.technical,
    evaluation.tactical,
    evaluation.physical,
    evaluation.psychological,
  ].filter((r): r is number => r !== null);

  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}

export const evaluationsApi = {
  getByTraining: async (trainingId: string): Promise<Evaluation[]> => {
    const response = await apiClient.get<Evaluation[]>(`/evaluations/training/${trainingId}`);
    return response.data;
  },

  getByMatch: async (matchId: string): Promise<Evaluation[]> => {
    const response = await apiClient.get<Evaluation[]>(`/evaluations/match/${matchId}`);
    return response.data;
  },

  createBatch: async (data: CreateEvaluationBatchRequest): Promise<Evaluation[]> => {
    const response = await apiClient.post<Evaluation[]>('/evaluations/batch', data);
    return response.data;
  },

  getMyRatingStats: async (period: string = 'all_time'): Promise<RatingStats> => {
    const response = await apiClient.get<RatingStats>(`/evaluations/stats/my?period=${period}`);
    return response.data;
  },

  getPlayerRatingStats: async (playerId: string, period: string = 'all_time'): Promise<RatingStats> => {
    const response = await apiClient.get<RatingStats>(`/evaluations/stats/${playerId}?period=${period}`);
    return response.data;
  },
};
