import { schedulesApi } from './schedules';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
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
        { id: 's1', dayOfWeek: 1, startTime: '10:00', endTime: '12:00', location: 'Field A' },
        { id: 's2', dayOfWeek: 3, startTime: '15:00', endTime: '17:00', location: 'Field B' },
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

  describe('updateSchedule', () => {
    it('should call PUT /groups/:groupId/schedule', async () => {
      const scheduleItems = [
        { dayOfWeek: 1, startTime: '10:00', endTime: '12:00', location: 'Field A' },
        { dayOfWeek: 5, startTime: '16:00', endTime: '18:00', location: 'Field C' },
      ];
      const mockResponse = [
        { id: 's1', ...scheduleItems[0] },
        { id: 's2', ...scheduleItems[1] },
      ];
      mockApiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await schedulesApi.updateSchedule('g1', scheduleItems);

      expect(mockApiClient.put).toHaveBeenCalledWith('/groups/g1/schedule', { items: scheduleItems });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty schedule update', async () => {
      mockApiClient.put.mockResolvedValue({ data: [] });

      const result = await schedulesApi.updateSchedule('g1', []);

      expect(mockApiClient.put).toHaveBeenCalledWith('/groups/g1/schedule', { items: [] });
      expect(result).toEqual([]);
    });
  });

  describe('generateTrainings', () => {
    it('should call POST /groups/:groupId/schedule/generate', async () => {
      const generateData = {
        fromDate: '2024-01-01',
        toDate: '2024-03-31',
        defaultTopic: 'Regular training',
      };
      const mockResponse = { created: 24, skipped: 2 };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await schedulesApi.generateTrainings('g1', generateData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/groups/g1/schedule/generate', generateData);
      expect(result).toEqual(mockResponse);
    });

    it('should generate without defaultTopic', async () => {
      const generateData = {
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
      };
      mockApiClient.post.mockResolvedValue({ data: { created: 8, skipped: 0 } });

      await schedulesApi.generateTrainings('g1', generateData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/groups/g1/schedule/generate', generateData);
    });

    it('should handle error on generate', async () => {
      const error = new Error('No schedule defined');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        schedulesApi.generateTrainings('g1', { fromDate: '2024-01-01', toDate: '2024-01-31' }),
      ).rejects.toThrow('No schedule defined');
    });
  });

  describe('deleteFutureGenerated', () => {
    it('should call DELETE /groups/:groupId/schedule/trainings', async () => {
      const mockResponse = { deleted: 10, kept: 5 };
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const result = await schedulesApi.deleteFutureGenerated('g1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/groups/g1/schedule/trainings');
      expect(result).toEqual(mockResponse);
    });

    it('should return zero counts when nothing to delete', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { deleted: 0, kept: 0 } });

      const result = await schedulesApi.deleteFutureGenerated('g1');

      expect(result).toEqual({ deleted: 0, kept: 0 });
    });
  });
});
