import { trainingsApi } from './trainings';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('trainingsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /trainings without filters', async () => {
      const mockTrainings = [
        { id: '1', startTime: '2024-01-01T10:00:00Z', endTime: '2024-01-01T12:00:00Z', location: 'Field A', group: { id: 'g1', name: 'U12' } },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockTrainings });

      const result = await trainingsApi.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings');
      expect(result).toEqual(mockTrainings);
    });

    it('should call GET /trainings with date filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await trainingsApi.getAll({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings?dateFrom=2024-01-01&dateTo=2024-01-31');
    });

    it('should call GET /trainings with time filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await trainingsApi.getAll({ timeFilter: 'upcoming' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings?timeFilter=upcoming');
    });

    it('should not add timeFilter=all to query params', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await trainingsApi.getAll({ timeFilter: 'all' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings');
    });
  });

  describe('getMy', () => {
    it('should call GET /trainings/my', async () => {
      const mockTrainings = [{ id: '1', startTime: '2024-01-01T10:00:00Z', endTime: '2024-01-01T12:00:00Z', location: 'Field A', group: { id: 'g1', name: 'U12' } }];
      mockApiClient.get.mockResolvedValue({ data: mockTrainings });

      const result = await trainingsApi.getMy();

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings/my');
      expect(result).toEqual(mockTrainings);
    });

    it('should call GET /trainings/my with filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await trainingsApi.getMy({ timeFilter: 'this_week' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings/my?timeFilter=this_week');
    });
  });

  describe('getOne', () => {
    it('should call GET /trainings/:id', async () => {
      const mockTraining = {
        id: '123',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T12:00:00Z',
        location: 'Field A',
        group: { id: 'g1', name: 'U12', players: [] },
      };
      mockApiClient.get.mockResolvedValue({ data: mockTraining });

      const result = await trainingsApi.getOne('123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings/123');
      expect(result).toEqual(mockTraining);
    });
  });

  describe('getByGroup', () => {
    it('should call GET /trainings/group/:groupId', async () => {
      const mockTrainings = [{ id: '1', startTime: '2024-01-01T10:00:00Z', endTime: '2024-01-01T12:00:00Z', location: 'Field A', group: { id: 'g1', name: 'U12' } }];
      mockApiClient.get.mockResolvedValue({ data: mockTrainings });

      const result = await trainingsApi.getByGroup('g1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/trainings/group/g1');
      expect(result).toEqual(mockTrainings);
    });
  });

  describe('create', () => {
    it('should call POST /trainings with data', async () => {
      const createData = {
        groupId: 'g1',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T12:00:00Z',
        location: 'Field A',
        topic: 'Passing drills',
      };
      const mockResponse = { id: '1', ...createData, group: { id: 'g1', name: 'U12' } };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await trainingsApi.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/trainings', createData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error on create', async () => {
      const error = new Error('Failed to create training');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        trainingsApi.create({
          groupId: 'g1',
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T12:00:00Z',
          location: 'Field A',
        }),
      ).rejects.toThrow('Failed to create training');
    });
  });
});
