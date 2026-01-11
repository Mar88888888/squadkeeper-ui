import { evaluationsApi, getEvaluationAverage, Evaluation } from './evaluations';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('evaluationsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByTraining', () => {
    it('should call GET /evaluations/training/:trainingId', async () => {
      const mockEvaluations = [
        {
          id: 'e1',
          technical: 4,
          tactical: 3,
          physical: 5,
          psychological: 4,
          comment: 'Good performance',
          player: { id: 'p1', firstName: 'John', lastName: 'Doe' },
          coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' },
        },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockEvaluations });

      const result = await evaluationsApi.getByTraining('t1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/evaluations/training/t1');
      expect(result).toEqual(mockEvaluations);
    });

    it('should return empty array when no evaluations', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await evaluationsApi.getByTraining('t1');

      expect(result).toEqual([]);
    });
  });

  describe('getByMatch', () => {
    it('should call GET /evaluations/match/:matchId', async () => {
      const mockEvaluations = [
        {
          id: 'e1',
          technical: 5,
          tactical: 5,
          physical: 4,
          psychological: 5,
          comment: 'Excellent positioning',
          player: { id: 'p1', firstName: 'John', lastName: 'Doe' },
          coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' },
        },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockEvaluations });

      const result = await evaluationsApi.getByMatch('m1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/evaluations/match/m1');
      expect(result).toEqual(mockEvaluations);
    });
  });

  describe('createBatch', () => {
    it('should call POST /evaluations/batch for training', async () => {
      const batchData = {
        trainingId: 't1',
        records: [
          { playerId: 'p1', technical: 4, tactical: 3, physical: 5, psychological: 4, comment: 'Good' },
          { playerId: 'p2', technical: 3, tactical: 4, physical: 3, psychological: 3 },
        ],
      };
      const mockResponse = [
        {
          id: 'e1',
          technical: 4,
          tactical: 3,
          physical: 5,
          psychological: 4,
          comment: 'Good',
          player: { id: 'p1', firstName: 'John', lastName: 'Doe' },
          coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' },
        },
        {
          id: 'e2',
          technical: 3,
          tactical: 4,
          physical: 3,
          psychological: 3,
          comment: null,
          player: { id: 'p2', firstName: 'Jane', lastName: 'Doe' },
          coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' },
        },
      ];
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await evaluationsApi.createBatch(batchData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/evaluations/batch', batchData);
      expect(result).toEqual(mockResponse);
    });

    it('should call POST /evaluations/batch for match', async () => {
      const batchData = {
        matchId: 'm1',
        records: [
          { playerId: 'p1', technical: 5, tactical: 5, physical: 4, psychological: 4 },
        ],
      };
      mockApiClient.post.mockResolvedValue({ data: [] });

      await evaluationsApi.createBatch(batchData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/evaluations/batch', batchData);
    });

    it('should handle partial ratings', async () => {
      const batchData = {
        trainingId: 't1',
        records: [
          { playerId: 'p1', technical: 4 },
          { playerId: 'p2', tactical: 3, physical: 5 },
        ],
      };
      mockApiClient.post.mockResolvedValue({ data: [] });

      await evaluationsApi.createBatch(batchData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/evaluations/batch', batchData);
    });

    it('should handle error on createBatch', async () => {
      const error = new Error('Failed to create evaluations');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        evaluationsApi.createBatch({
          trainingId: 't1',
          records: [{ playerId: 'p1', technical: 4 }],
        }),
      ).rejects.toThrow('Failed to create evaluations');
    });
  });

  describe('getMyRatingStats', () => {
    it('should call GET /evaluations/stats/my with default period', async () => {
      const mockStats = {
        averageRating: 4.2,
        totalEvents: 10,
        byCategory: { technical: 4.0, tactical: 4.5, physical: 4.0, psychological: 4.3 },
        history: [],
      };
      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await evaluationsApi.getMyRatingStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/evaluations/stats/my?period=all_time');
      expect(result).toEqual(mockStats);
    });

    it('should call GET /evaluations/stats/my with specified period', async () => {
      mockApiClient.get.mockResolvedValue({ data: {} });

      await evaluationsApi.getMyRatingStats('this_month');

      expect(mockApiClient.get).toHaveBeenCalledWith('/evaluations/stats/my?period=this_month');
    });
  });

  describe('getPlayerRatingStats', () => {
    it('should call GET /evaluations/stats/:playerId', async () => {
      mockApiClient.get.mockResolvedValue({ data: {} });

      await evaluationsApi.getPlayerRatingStats('p1', 'this_year');

      expect(mockApiClient.get).toHaveBeenCalledWith('/evaluations/stats/p1?period=this_year');
    });
  });
});

describe('getEvaluationAverage', () => {
  it('should calculate average of all ratings', () => {
    const evaluation: Evaluation = {
      id: 'e1',
      technical: 4,
      tactical: 3,
      physical: 5,
      psychological: 4,
      comment: null,
      player: { id: 'p1', firstName: 'John', lastName: 'Doe' },
      coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' },
    };

    expect(getEvaluationAverage(evaluation)).toBe(4);
  });

  it('should handle partial ratings', () => {
    const evaluation: Evaluation = {
      id: 'e1',
      technical: 4,
      tactical: null,
      physical: 5,
      psychological: null,
      comment: null,
      player: { id: 'p1', firstName: 'John', lastName: 'Doe' },
      coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' },
    };

    expect(getEvaluationAverage(evaluation)).toBe(4.5);
  });

  it('should return null when no ratings', () => {
    const evaluation: Evaluation = {
      id: 'e1',
      technical: null,
      tactical: null,
      physical: null,
      psychological: null,
      comment: null,
      player: { id: 'p1', firstName: 'John', lastName: 'Doe' },
      coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' },
    };

    expect(getEvaluationAverage(evaluation)).toBeNull();
  });
});
