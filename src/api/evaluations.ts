import { apiClient } from './client';

export const EvaluationType = {
  TECHNICAL: 'TECHNICAL',
  TACTICAL: 'TACTICAL',
  PHYSICAL: 'PHYSICAL',
  PSYCHOLOGICAL: 'PSYCHOLOGICAL',
} as const;

export type EvaluationType = (typeof EvaluationType)[keyof typeof EvaluationType];

export const EvaluationTypeLabels: Record<EvaluationType, string> = {
  [EvaluationType.TECHNICAL]: 'Technical',
  [EvaluationType.TACTICAL]: 'Tactical',
  [EvaluationType.PHYSICAL]: 'Physical',
  [EvaluationType.PSYCHOLOGICAL]: 'Psychological',
};

export interface EvaluationRecord {
  playerId: string;
  type: EvaluationType;
  rating: number;
  comment?: string;
}

export interface Evaluation {
  id: string;
  type: EvaluationType;
  rating: number;
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
