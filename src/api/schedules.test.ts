import { schedulesApi } from './schedules';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('schedulesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSchedule', () => {
    it('should call GET /groups/:groupId/schedule', async () => {
      const mockSchedule = [
        { id: 's1', dayOfWeek: 1, startTime: '10:00', durationMinutes: 120, location: 'Field A' },
        { id: 's2', dayOfWeek: 3, startTime: '15:00', durationMinutes: 120, location: 'Field B' },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockSchedule });

      const result = await schedulesApi.getSchedule('g1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups/g1/schedule');
      expect(result).toEqual(mockSchedule);
    });

    it('should return empty array when no schedule', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await schedulesApi.getSchedule('g1');

      expect(result).toEqual([]);
    });
  });

  describe('previewChanges', () => {
    it('should call GET /groups/:groupId/schedule/preview with params', async () => {
      const mockResponse = { total: 10, withAttendance: 2 };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await schedulesApi.previewChanges('g1', '2024-01-01', '2024-03-31');

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups/g1/schedule/preview', {
        params: { fromDate: '2024-01-01', toDate: '2024-03-31' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return zero counts when no trainings exist', async () => {
      mockApiClient.get.mockResolvedValue({ data: { total: 0, withAttendance: 0 } });

      const result = await schedulesApi.previewChanges('g1', '2024-01-01', '2024-01-31');

      expect(result).toEqual({ total: 0, withAttendance: 0 });
    });
  });

  describe('applySchedule', () => {
    it('should call PUT /groups/:groupId/schedule', async () => {
      const requestData = {
        items: [
          { dayOfWeek: 1, startTime: '10:00', durationMinutes: 120, location: 'Field A' },
          { dayOfWeek: 5, startTime: '16:00', durationMinutes: 90, location: 'Field C' },
        ],
        fromDate: '2024-01-01',
        toDate: '2024-03-31',
        defaultTopic: 'Regular training',
      };
      const mockResponse = { deleted: 5, created: 24 };
      mockApiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await schedulesApi.applySchedule('g1', requestData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/groups/g1/schedule', requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should apply schedule without defaultTopic', async () => {
      const requestData = {
        items: [
          { dayOfWeek: 1, startTime: '10:00', durationMinutes: 120, location: 'Field A' },
        ],
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
      };
      mockApiClient.put.mockResolvedValue({ data: { deleted: 0, created: 4 } });

      const result = await schedulesApi.applySchedule('g1', requestData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/groups/g1/schedule', requestData);
      expect(result).toEqual({ deleted: 0, created: 4 });
    });

    it('should handle error on apply', async () => {
      const error = new Error('Network error');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        schedulesApi.applySchedule('g1', {
          items: [],
          fromDate: '2024-01-01',
          toDate: '2024-01-31',
        }),
      ).rejects.toThrow('Network error');
    });
  });
});
