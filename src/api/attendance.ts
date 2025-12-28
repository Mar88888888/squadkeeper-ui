import { apiClient } from './client';

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  SICK: 'SICK',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export interface AttendanceRecord {
  playerId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface Attendance {
  id: string;
  status: AttendanceStatus;
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
  late: number;
  sick: number;
  excused: number;
  rate: number;
}

export const attendanceApi = {
  getByTraining: async (trainingId: string): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(`/attendance/training/${trainingId}`);
    return response.data;
  },

  markBatch: async (data: MarkAttendanceBatchRequest): Promise<Attendance[]> => {
    const response = await apiClient.post<Attendance[]>('/attendance/batch', data);
    return response.data;
  },

  getMyStats: async (): Promise<AttendanceStats> => {
    const response = await apiClient.get<AttendanceStats>('/attendance/my/stats');
    return response.data;
  },
};
