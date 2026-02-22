import { apiClient } from './client';

export interface AttendanceRecord {
  playerId: string;
  isPresent: boolean;
  notes?: string;
}

export interface Attendance {
  id: string;
  isPresent: boolean;
  notes: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MarkAttendanceBatchRequest {
  eventId: string;
  eventType: 'TRAINING' | 'MATCH';
  records: AttendanceRecord[];
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  rate: number;
  totalTrainings: number;
  totalMatches: number;
}

export interface PlayerAttendanceStats extends AttendanceStats {
  playerId: string;
  playerName: string;
}

export const attendanceApi = {
  getByTraining: async (trainingId: string): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(
      `/attendance/training/${trainingId}`,
    );
    return response.data;
  },

  getByMatch: async (matchId: string): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(
      `/attendance/match/${matchId}`,
    );
    return response.data;
  },

  markBatch: async (
    data: MarkAttendanceBatchRequest,
  ): Promise<Attendance[]> => {
    const response = await apiClient.post<Attendance[]>(
      '/attendance/batch',
      data,
    );
    return response.data;
  },

  getMyStats: async (): Promise<AttendanceStats> => {
    const response = await apiClient.get<AttendanceStats>(
      '/attendance/my/stats',
    );
    return response.data;
  },

  getMyChildrenStats: async (): Promise<PlayerAttendanceStats[]> => {
    const response = await apiClient.get<PlayerAttendanceStats[]>(
      '/attendance/my/children/stats',
    );
    return response.data;
  },
};
