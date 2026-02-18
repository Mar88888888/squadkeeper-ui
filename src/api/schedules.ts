import { apiClient } from './client';

export interface ScheduleItem {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  location: string;
}

export interface ApplyScheduleRequest {
  items: ScheduleItem[];
  fromDate: string;
  toDate: string;
  defaultTopic?: string;
}

export interface ApplyScheduleResponse {
  deleted: number;
  created: number;
}

export interface PreviewResponse {
  total: number;
  withAttendance: number;
}

export const schedulesApi = {
  getSchedule: async (groupId: string): Promise<ScheduleItem[]> => {
    const response = await apiClient.get<ScheduleItem[]>(
      `/groups/${groupId}/schedule`
    );
    return response.data;
  },

  previewChanges: async (
    groupId: string,
    fromDate: string,
    toDate: string
  ): Promise<PreviewResponse> => {
    const response = await apiClient.get<PreviewResponse>(
      `/groups/${groupId}/schedule/preview`,
      { params: { fromDate, toDate } }
    );
    return response.data;
  },

  applySchedule: async (
    groupId: string,
    data: ApplyScheduleRequest
  ): Promise<ApplyScheduleResponse> => {
    const response = await apiClient.put<ApplyScheduleResponse>(
      `/groups/${groupId}/schedule`,
      data
    );
    return response.data;
  },
};
