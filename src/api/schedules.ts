import { apiClient } from './client';

export interface ScheduleItem {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
}

export interface GenerateTrainingsRequest {
  fromDate: string;
  toDate: string;
  defaultTopic?: string;
}

export interface GenerateTrainingsResponse {
  created: number;
  skipped: number;
}

export interface DeleteGeneratedResponse {
  deleted: number;
  kept: number;
}

export const schedulesApi = {
  getSchedule: async (groupId: string): Promise<ScheduleItem[]> => {
    const response = await apiClient.get<ScheduleItem[]>(
      `/groups/${groupId}/schedule`
    );
    return response.data;
  },

  updateSchedule: async (
    groupId: string,
    items: ScheduleItem[]
  ): Promise<ScheduleItem[]> => {
    const response = await apiClient.put<ScheduleItem[]>(
      `/groups/${groupId}/schedule`,
      { items }
    );
    return response.data;
  },

  generateTrainings: async (
    groupId: string,
    data: GenerateTrainingsRequest
  ): Promise<GenerateTrainingsResponse> => {
    const response = await apiClient.post<GenerateTrainingsResponse>(
      `/groups/${groupId}/schedule/generate`,
      data
    );
    return response.data;
  },

  deleteFutureGenerated: async (
    groupId: string
  ): Promise<DeleteGeneratedResponse> => {
    const response = await apiClient.delete<DeleteGeneratedResponse>(
      `/groups/${groupId}/schedule/trainings`
    );
    return response.data;
  },
};
