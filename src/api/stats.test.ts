import { statsApi } from './stats';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('statsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyStats', () => {
    it('should call GET /players/stats/my with default period', async () => {
      const mockStats = {
        playerId: 'p1',
        playerName: 'John Doe',
        matchesPlayed: 10,
        goals: 5,
        assists: 3,
        period: 'all_time',
      };
      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await statsApi.getMyStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/my?period=all_time');
      expect(result).toEqual(mockStats);
    });

    it('should call GET /players/stats/my with specified period', async () => {
      mockApiClient.get.mockResolvedValue({ data: {} });

      await statsApi.getMyStats('this_month');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/my?period=this_month');
    });

    it('should call GET /players/stats/my with this_year period', async () => {
      mockApiClient.get.mockResolvedValue({ data: {} });

      await statsApi.getMyStats('this_year');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/my?period=this_year');
    });
  });

  describe('getTeamStats', () => {
    it('should call GET /players/stats/team with default period', async () => {
      const mockTeamStats = [
        {
          groupId: 'g1',
          groupName: 'U12',
          players: [
            { playerId: 'p1', playerName: 'John Doe', matchesPlayed: 10, goals: 5, assists: 3, period: 'all_time' },
            { playerId: 'p2', playerName: 'Jane Doe', matchesPlayed: 8, goals: 2, assists: 1, period: 'all_time' },
          ],
          period: 'all_time',
        },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockTeamStats });

      const result = await statsApi.getTeamStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/team?period=all_time');
      expect(result).toEqual(mockTeamStats);
    });

    it('should call GET /players/stats/team with specified period', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await statsApi.getTeamStats('this_year');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/team?period=this_year');
    });
  });

  describe('getPlayerStats', () => {
    it('should call GET /players/stats/:playerId with default period', async () => {
      const mockStats = {
        playerId: 'p1',
        playerName: 'John Doe',
        matchesPlayed: 10,
        goals: 5,
        assists: 3,
        period: 'all_time',
      };
      mockApiClient.get.mockResolvedValue({ data: mockStats });

      const result = await statsApi.getPlayerStats('p1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/p1?period=all_time');
      expect(result).toEqual(mockStats);
    });

    it('should call GET /players/stats/:playerId with specified period', async () => {
      mockApiClient.get.mockResolvedValue({ data: {} });

      await statsApi.getPlayerStats('p1', 'this_month');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/p1?period=this_month');
    });
  });

  describe('getChildrenStats', () => {
    it('should call GET /players/stats/children with default period', async () => {
      const mockChildrenStats = {
        children: [
          { id: 'p1', firstName: 'John', lastName: 'Doe' },
          { id: 'p2', firstName: 'Jane', lastName: 'Doe' },
        ],
        stats: null,
      };
      mockApiClient.get.mockResolvedValue({ data: mockChildrenStats });

      const result = await statsApi.getChildrenStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/children?period=all_time');
      expect(result).toEqual(mockChildrenStats);
    });

    it('should call GET /players/stats/children with specified period', async () => {
      mockApiClient.get.mockResolvedValue({ data: { children: [], stats: null } });

      await statsApi.getChildrenStats('this_year');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/children?period=this_year');
    });

    it('should call GET /players/stats/children with childId', async () => {
      const mockChildrenStats = {
        children: [{ id: 'p1', firstName: 'John', lastName: 'Doe' }],
        stats: { playerId: 'p1', playerName: 'John Doe', matchesPlayed: 5, goals: 2, assists: 1, period: 'all_time' },
      };
      mockApiClient.get.mockResolvedValue({ data: mockChildrenStats });

      const result = await statsApi.getChildrenStats('all_time', 'p1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/children?period=all_time&childId=p1');
      expect(result).toEqual(mockChildrenStats);
    });

    it('should include childId in query params when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: { children: [], stats: null } });

      await statsApi.getChildrenStats('this_month', 'child123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/players/stats/children?period=this_month&childId=child123');
    });
  });
});
