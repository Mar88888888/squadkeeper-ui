import { apiClient } from './client';

export enum EvaluationType {
  TECHNICAL = 'TECHNICAL',
  TACTICAL = 'TACTICAL',
  PHYSICAL = 'PHYSICAL',
  PSYCHOLOGICAL = 'PSYCHOLOGICAL',
}

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
  trainingId: string;
  records: EvaluationRecord[];
}

export const evaluationsApi = {
  getByTraining: async (trainingId: string): Promise<Evaluation[]> => {
    const response = await apiClient.get<Evaluation[]>(`/evaluations/training/${trainingId}`);
    return response.data;
  },

  createBatch: async (data: CreateEvaluationBatchRequest): Promise<Evaluation[]> => {
    const response = await apiClient.post<Evaluation[]>('/evaluations/batch', data);
    return response.data;
  },
};
