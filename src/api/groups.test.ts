import { groupsApi } from './groups';
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

describe('groupsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /groups', async () => {
      const mockGroups = [
        { id: 'g1', name: 'U12', yearOfBirth: 2012, headCoach: null, assistants: [], players: [] },
        { id: 'g2', name: 'U14', yearOfBirth: 2010, headCoach: { id: 'c1', firstName: 'John', lastName: 'Coach' }, assistants: [], players: [] },
      ];
      mockApiClient.get.mockResolvedValue({ data: mockGroups });

      const result = await groupsApi.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups');
      expect(result).toEqual(mockGroups);
    });
  });

  describe('getMy', () => {
    it('should call GET /groups/my', async () => {
      const mockGroups = [{ id: 'g1', name: 'U12', yearOfBirth: 2012, headCoach: null, assistants: [], players: [] }];
      mockApiClient.get.mockResolvedValue({ data: mockGroups });

      const result = await groupsApi.getMy();

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups/my');
      expect(result).toEqual(mockGroups);
    });
  });

  describe('getMyGroups', () => {
    it('should call GET /groups/my (alias)', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await groupsApi.getMyGroups();

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups/my');
    });
  });

  describe('getOne', () => {
    it('should call GET /groups/:id', async () => {
      const mockGroup = {
        id: 'g1',
        name: 'U12',
        yearOfBirth: 2012,
        headCoach: { id: 'c1', firstName: 'John', lastName: 'Coach' },
        assistants: [{ id: 'c2', firstName: 'Jane', lastName: 'Assistant' }],
        players: [{ id: 'p1', firstName: 'Player', lastName: 'One', dateOfBirth: '2012-05-15', position: 'FW' }],
      };
      mockApiClient.get.mockResolvedValue({ data: mockGroup });

      const result = await groupsApi.getOne('g1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups/g1');
      expect(result).toEqual(mockGroup);
    });
  });

  describe('create', () => {
    it('should call POST /groups with data', async () => {
      const createData = {
        name: 'U16',
        yearOfBirth: 2008,
        headCoachId: 'c1',
        assistantIds: ['c2', 'c3'],
      };
      const mockResponse = { id: 'g3', name: 'U16', yearOfBirth: 2008, headCoach: { id: 'c1', firstName: 'John', lastName: 'Coach' }, assistants: [], players: [] };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await groupsApi.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/groups', createData);
      expect(result).toEqual(mockResponse);
    });

    it('should create group without optional fields', async () => {
      const createData = { name: 'U10', yearOfBirth: 2014 };
      mockApiClient.post.mockResolvedValue({ data: { id: 'g4', ...createData, headCoach: null, assistants: [], players: [] } });

      await groupsApi.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/groups', createData);
    });
  });

  describe('update', () => {
    it('should call PATCH /groups/:id', async () => {
      const updateData = { name: 'U12 Elite', yearOfBirth: 2012 };
      const mockResponse = { id: 'g1', ...updateData, headCoach: null, assistants: [], players: [] };
      mockApiClient.patch.mockResolvedValue({ data: mockResponse });

      const result = await groupsApi.update('g1', updateData);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/groups/g1', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should update only name', async () => {
      mockApiClient.patch.mockResolvedValue({ data: { id: 'g1', name: 'New Name' } });

      await groupsApi.update('g1', { name: 'New Name' });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/groups/g1', { name: 'New Name' });
    });
  });

  describe('updateStaff', () => {
    it('should call PATCH /groups/:id/staff', async () => {
      const staffData = { headCoachId: 'c1', assistantIds: ['c2'] };
      mockApiClient.patch.mockResolvedValue({ data: { id: 'g1' } });

      await groupsApi.updateStaff('g1', staffData);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/groups/g1/staff', staffData);
    });

    it('should clear head coach with null', async () => {
      mockApiClient.patch.mockResolvedValue({ data: { id: 'g1' } });

      await groupsApi.updateStaff('g1', { headCoachId: null });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/groups/g1/staff', { headCoachId: null });
    });
  });

  describe('addPlayers', () => {
    it('should call POST /groups/:id/players', async () => {
      const playerIds = ['p1', 'p2', 'p3'];
      mockApiClient.post.mockResolvedValue({ data: { id: 'g1', players: [] } });

      await groupsApi.addPlayers('g1', playerIds);

      expect(mockApiClient.post).toHaveBeenCalledWith('/groups/g1/players', { playerIds });
    });
  });

  describe('removePlayers', () => {
    it('should call DELETE /groups/:id/players with data', async () => {
      const playerIds = ['p1', 'p2'];
      mockApiClient.delete.mockResolvedValue({ data: { id: 'g1', players: [] } });

      await groupsApi.removePlayers('g1', playerIds);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/groups/g1/players', { data: { playerIds } });
    });
  });

  describe('delete', () => {
    it('should call DELETE /groups/:id', async () => {
      mockApiClient.delete.mockResolvedValue({});

      await groupsApi.delete('g1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/groups/g1');
    });
  });
});
