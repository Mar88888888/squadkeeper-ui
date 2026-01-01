import { attendanceApi, AttendanceStatus } from './attendance';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('attendanceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByTraining', () => {
    it('should call GET /attendance/training/:trainingId', async () => {
      const mockAttendance = [
        { id: 'a1', status: AttendanceStatus.PRESENT, notes: null, player: { id: 'p1', firstName: 'John', lastName: 'Doe' } },
        { id: 'a2', status: AttendanceStatus.ABSENT, notes: 'Sick', player: { id: 'p2', firstName: 'Jane', lastName: 'Doe' } },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockAttendance });

      const result = await attendanceApi.getByTraining('t1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/training/t1');
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('getByMatch', () => {
    it('should call GET /attendance/match/:matchId', async () => {
      const mockAttendance = [
        { id: 'a1', status: AttendanceStatus.PRESENT, notes: null, player: { id: 'p1', firstName: 'John', lastName: 'Doe' } },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockAttendance });

      const result = await attendanceApi.getByMatch('m1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/match/m1');
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('markBatch', () => {
    it('should call POST /attendance/batch for training', async () => {
      const batchData = {
        eventId: 't1',
        eventType: 'TRAINING' as const,
        records: [
          { playerId: 'p1', status: AttendanceStatus.PRESENT },
          { playerId: 'p2', status: AttendanceStatus.LATE, notes: 'Traffic' },
        ],
      };
      const mockResponse = [
        { id: 'a1', status: AttendanceStatus.PRESENT, notes: null, player: { id: 'p1', firstName: 'John', lastName: 'Doe' } },
        { id: 'a2', status: AttendanceStatus.LATE, notes: 'Traffic', player: { id: 'p2', firstName: 'Jane', lastName: 'Doe' } },
      ];
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await attendanceApi.markBatch(batchData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/batch', batchData);
      expect(result).toEqual(mockResponse);
    });

    it('should call POST /attendance/batch for match', async () => {
      const batchData = {
        eventId: 'm1',
        eventType: 'MATCH' as const,
        records: [
          { playerId: 'p1', status: AttendanceStatus.PRESENT },
        ],
      };
      mockApiClient.post.mockResolvedValue({ data: [] });

      await attendanceApi.markBatch(batchData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/batch', batchData);
    });

    it('should handle all attendance statuses', async () => {
      const batchData = {
        eventId: 't1',
        eventType: 'TRAINING' as const,
        records: [
          { playerId: 'p1', status: AttendanceStatus.PRESENT },
          { playerId: 'p2', status: AttendanceStatus.ABSENT },
          { playerId: 'p3', status: AttendanceStatus.SICK },
          { playerId: 'p4', status: AttendanceStatus.LATE },
          { playerId: 'p5', status: AttendanceStatus.EXCUSED },
        ],
      };
      mockApiClient.post.mockResolvedValue({ data: [] });

      await attendanceApi.markBatch(batchData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/batch', batchData);
    });
  });

  describe('getMyStats', () => {
    it('should call GET /attendance/my/stats', async () => {
      const mockStats = {
        total: 20,
        present: 15,
        absent: 2,
        late: 1,
        sick: 1,
        excused: 1,
        rate: 0.75,
        totalTrainings: 15,
        totalMatches: 5,
      };
      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await attendanceApi.getMyStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/my/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getMyStatsAsParent', () => {
    it('should call GET /attendance/my/stats and return array', async () => {
      const mockStats = [
        { playerId: 'p1', playerName: 'John Doe', total: 10, present: 8, absent: 1, late: 1, sick: 0, excused: 0, rate: 0.8, totalTrainings: 8, totalMatches: 2 },
        { playerId: 'p2', playerName: 'Jane Doe', total: 10, present: 9, absent: 0, late: 0, sick: 1, excused: 0, rate: 0.9, totalTrainings: 8, totalMatches: 2 },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await attendanceApi.getMyStatsAsParent();

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/my/stats');
      expect(result).toEqual(mockStats);
    });
  });
});

describe('AttendanceStatus constants', () => {
  it('should have all expected status values', () => {
    expect(AttendanceStatus.PRESENT).toBe('PRESENT');
    expect(AttendanceStatus.ABSENT).toBe('ABSENT');
    expect(AttendanceStatus.SICK).toBe('SICK');
    expect(AttendanceStatus.LATE).toBe('LATE');
    expect(AttendanceStatus.EXCUSED).toBe('EXCUSED');
  });
});
