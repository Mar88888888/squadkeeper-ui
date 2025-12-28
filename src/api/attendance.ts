import { apiClient } from './client';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  SICK = 'SICK',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

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

export const attendanceApi = {
  getByTraining: async (trainingId: string): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(`/attendance/training/${trainingId}`);
    return response.data;
  },

  markBatch: async (data: MarkAttendanceBatchRequest): Promise<Attendance[]> => {
    const response = await apiClient.post<Attendance[]>('/attendance/batch', data);
    return response.data;
  },
};
