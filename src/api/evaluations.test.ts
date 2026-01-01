import { evaluationsApi, EvaluationType, EvaluationTypeLabels } from './evaluations';
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
          type: EvaluationType.TECHNICAL,
          rating: 4,
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
          type: EvaluationType.TACTICAL,
          rating: 5,
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
          { playerId: 'p1', type: EvaluationType.TECHNICAL, rating: 4, comment: 'Good' },
          { playerId: 'p2', type: EvaluationType.PHYSICAL, rating: 3 },
        ],
      };
      const mockResponse = [
        { id: 'e1', type: EvaluationType.TECHNICAL, rating: 4, comment: 'Good', player: { id: 'p1', firstName: 'John', lastName: 'Doe' }, coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' } },
        { id: 'e2', type: EvaluationType.PHYSICAL, rating: 3, comment: null, player: { id: 'p2', firstName: 'Jane', lastName: 'Doe' }, coach: { id: 'c1', firstName: 'Coach', lastName: 'Smith' } },
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
          { playerId: 'p1', type: EvaluationType.TACTICAL, rating: 5 },
        ],
      };
      mockApiClient.post.mockResolvedValue({ data: [] });

      await evaluationsApi.createBatch(batchData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/evaluations/batch', batchData);
    });

    it('should handle all evaluation types', async () => {
      const batchData = {
        trainingId: 't1',
        records: [
          { playerId: 'p1', type: EvaluationType.TECHNICAL, rating: 4 },
          { playerId: 'p1', type: EvaluationType.TACTICAL, rating: 3 },
          { playerId: 'p1', type: EvaluationType.PHYSICAL, rating: 5 },
          { playerId: 'p1', type: EvaluationType.PSYCHOLOGICAL, rating: 4 },
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
          records: [{ playerId: 'p1', type: EvaluationType.TECHNICAL, rating: 4 }],
        }),
      ).rejects.toThrow('Failed to create evaluations');
    });
  });
});

describe('EvaluationType constants', () => {
  it('should have all expected type values', () => {
    expect(EvaluationType.TECHNICAL).toBe('TECHNICAL');
    expect(EvaluationType.TACTICAL).toBe('TACTICAL');
    expect(EvaluationType.PHYSICAL).toBe('PHYSICAL');
    expect(EvaluationType.PSYCHOLOGICAL).toBe('PSYCHOLOGICAL');
  });
});

describe('EvaluationTypeLabels', () => {
  it('should have labels for all types', () => {
    expect(EvaluationTypeLabels[EvaluationType.TECHNICAL]).toBe('Technical');
    expect(EvaluationTypeLabels[EvaluationType.TACTICAL]).toBe('Tactical');
    expect(EvaluationTypeLabels[EvaluationType.PHYSICAL]).toBe('Physical');
    expect(EvaluationTypeLabels[EvaluationType.PSYCHOLOGICAL]).toBe('Psychological');
  });
});
