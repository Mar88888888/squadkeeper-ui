import { matchesApi } from './matches';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('matchesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /matches without filters', async () => {
      const mockMatches = [
        { id: '1', startTime: '2024-01-01T15:00:00Z', endTime: '2024-01-01T17:00:00Z', location: 'Stadium', opponent: 'Team B', isHome: true, homeGoals: null, awayGoals: null, group: { id: 'g1', name: 'U12' } },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockMatches });

      const result = await matchesApi.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/matches');
      expect(result).toEqual(mockMatches);
    });

    it('should call GET /matches with filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await matchesApi.getAll({ timeFilter: 'upcoming', dateFrom: '2024-01-01' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/matches?dateFrom=2024-01-01&timeFilter=upcoming');
    });
  });

  describe('getMy', () => {
    it('should call GET /matches/my', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await matchesApi.getMy();

      expect(mockApiClient.get).toHaveBeenCalledWith('/matches/my');
    });

    it('should call GET /matches/my with filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await matchesApi.getMy({ timeFilter: 'past' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/matches/my?timeFilter=past');
    });
  });

  describe('getOne', () => {
    it('should call GET /matches/:id', async () => {
      const mockMatch = {
        id: '123',
        startTime: '2024-01-01T15:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: 'Stadium',
        opponent: 'Team B',
        isHome: true,
        homeGoals: 2,
        awayGoals: 1,
        group: { id: 'g1', name: 'U12', players: [] },
        goals: [],
      };
      mockApiClient.get.mockResolvedValue({ data: mockMatch });

      const result = await matchesApi.getOne('123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/matches/123');
      expect(result).toEqual(mockMatch);
    });
  });

  describe('getByGroup', () => {
    it('should call GET /matches/group/:groupId', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await matchesApi.getByGroup('g1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/matches/group/g1');
    });
  });

  describe('create', () => {
    it('should call POST /matches with data', async () => {
      const createData = {
        groupId: 'g1',
        startTime: '2024-01-01T15:00:00Z',
        endTime: '2024-01-01T17:00:00Z',
        location: 'Stadium',
        opponent: 'Team B',
        isHome: true,
      };
      const mockResponse = { id: '1', ...createData, homeGoals: null, awayGoals: null, group: { id: 'g1', name: 'U12' } };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await matchesApi.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/matches', createData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateResult', () => {
    it('should call PATCH /matches/:id/score', async () => {
      const mockResponse = { id: '123', homeGoals: 3, awayGoals: 1 };
      mockApiClient.patch.mockResolvedValue({ data: mockResponse });

      const result = await matchesApi.updateResult('123', { homeGoals: 3, awayGoals: 1 });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/matches/123/score', { homeGoals: 3, awayGoals: 1 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should call DELETE /matches/:id', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await matchesApi.delete('123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/matches/123');
    });
  });

  describe('goals endpoints', () => {
    describe('getGoals', () => {
      it('should call GET /matches/:matchId/goals', async () => {
        const mockGoals = [{ id: 'goal1', scorer: { id: 'p1', firstName: 'John', lastName: 'Doe', position: 'FW' }, assist: null, minute: 45, isOwnGoal: false }];
        mockApiClient.get.mockResolvedValue({ data: mockGoals });

        const result = await matchesApi.getGoals('123');

        expect(mockApiClient.get).toHaveBeenCalledWith('/matches/123/goals');
        expect(result).toEqual(mockGoals);
      });
    });

    describe('addGoal', () => {
      it('should call POST /matches/:matchId/goals', async () => {
        const goalData = { scorerId: 'p1', assistId: 'p2', minute: 30 };
        const mockGoal = { id: 'goal1', scorer: { id: 'p1' }, assist: { id: 'p2' }, minute: 30, isOwnGoal: false };
        mockApiClient.post.mockResolvedValue({ data: mockGoal });

        const result = await matchesApi.addGoal('123', goalData);

        expect(mockApiClient.post).toHaveBeenCalledWith('/matches/123/goals', goalData);
        expect(result).toEqual(mockGoal);
      });

      it('should handle own goal', async () => {
        const goalData = { scorerId: 'p1', isOwnGoal: true };
        mockApiClient.post.mockResolvedValue({ data: { id: 'goal1', isOwnGoal: true } });

        await matchesApi.addGoal('123', goalData);

        expect(mockApiClient.post).toHaveBeenCalledWith('/matches/123/goals', goalData);
      });
    });

    describe('removeGoal', () => {
      it('should call DELETE /matches/:matchId/goals/:goalId', async () => {
        mockApiClient.delete.mockResolvedValue({});

        await matchesApi.removeGoal('123', 'goal1');

        expect(mockApiClient.delete).toHaveBeenCalledWith('/matches/123/goals/goal1');
      });
    });
  });
});
