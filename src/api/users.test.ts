import { usersApi } from './users';
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

describe('usersApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Coaches', () => {
    describe('getCoaches', () => {
      it('should call GET /coaches', async () => {
        const mockCoaches = [
          {
            id: 'c1',
            firstName: 'John',
            lastName: 'Coach',
            dateOfBirth: '1985-05-15',
            licenseLevel: 'UEFA A',
            experienceYears: 10,
            phoneNumber: '+1234567890',
            user: { id: 'u1', email: 'john@example.com' },
          },
        ];
        mockApiClient.get.mockResolvedValue({ data: mockCoaches });

        const result = await usersApi.getCoaches();

        expect(mockApiClient.get).toHaveBeenCalledWith('/coaches');
        expect(result).toEqual(mockCoaches);
      });
    });

    describe('createCoach', () => {
      it('should call POST /coaches', async () => {
        const createData = {
          email: 'newcoach@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'Coach',
          dateOfBirth: '1990-01-01',
          licenseLevel: 'UEFA B',
          experienceYears: 5,
        };
        const mockResponse = { id: 'c2', email: 'newcoach@example.com', firstName: 'New', lastName: 'Coach', role: 'COACH' };
        mockApiClient.post.mockResolvedValue({ data: mockResponse });

        const result = await usersApi.createCoach(createData);

        expect(mockApiClient.post).toHaveBeenCalledWith('/coaches', createData);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateCoach', () => {
      it('should call PATCH /coaches/:id', async () => {
        const updateData = { firstName: 'Updated', licenseLevel: 'UEFA Pro' };
        mockApiClient.patch.mockResolvedValue({ data: { id: 'c1', ...updateData } });

        await usersApi.updateCoach('c1', updateData);

        expect(mockApiClient.patch).toHaveBeenCalledWith('/coaches/c1', updateData);
      });
    });

    describe('deleteCoach', () => {
      it('should call DELETE /coaches/:id', async () => {
        mockApiClient.delete.mockResolvedValue({});

        await usersApi.deleteCoach('c1');

        expect(mockApiClient.delete).toHaveBeenCalledWith('/coaches/c1');
      });
    });
  });

  describe('Players', () => {
    describe('getPlayers', () => {
      it('should call GET /players', async () => {
        const mockPlayers = [
          {
            id: 'p1',
            firstName: 'Player',
            lastName: 'One',
            dateOfBirth: '2010-03-20',
            position: 'FW',
            user: { id: 'u2', email: 'player@example.com' },
            group: { id: 'g1', name: 'U14', ageGroup: '2010' },
            parent: null,
          },
        ];
        mockApiClient.get.mockResolvedValue({ data: mockPlayers });

        const result = await usersApi.getPlayers();

        expect(mockApiClient.get).toHaveBeenCalledWith('/players');
        expect(result).toEqual(mockPlayers);
      });
    });

    describe('createPlayer', () => {
      it('should call POST /players', async () => {
        const createData = {
          email: 'newplayer@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'Player',
          dateOfBirth: '2012-06-15',
          position: 'MF',
        };
        const mockResponse = { id: 'p2', email: 'newplayer@example.com', firstName: 'New', lastName: 'Player', role: 'PLAYER' };
        mockApiClient.post.mockResolvedValue({ data: mockResponse });

        const result = await usersApi.createPlayer(createData);

        expect(mockApiClient.post).toHaveBeenCalledWith('/players', createData);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updatePlayer', () => {
      it('should call PATCH /players/:id', async () => {
        const updateData = { position: 'GK', height: 175, weight: 70 };
        mockApiClient.patch.mockResolvedValue({ data: { id: 'p1', ...updateData } });

        await usersApi.updatePlayer('p1', updateData);

        expect(mockApiClient.patch).toHaveBeenCalledWith('/players/p1', updateData);
      });
    });

    describe('deletePlayer', () => {
      it('should call DELETE /players/:id', async () => {
        mockApiClient.delete.mockResolvedValue({});

        await usersApi.deletePlayer('p1');

        expect(mockApiClient.delete).toHaveBeenCalledWith('/players/p1');
      });
    });
  });

  describe('Parents', () => {
    describe('getParents', () => {
      it('should call GET /parents', async () => {
        const mockParents = [
          {
            id: 'par1',
            firstName: 'Parent',
            lastName: 'One',
            phoneNumber: '+1234567890',
            user: { id: 'u3', email: 'parent@example.com' },
            children: [{ id: 'p1', firstName: 'Child', lastName: 'One' }],
          },
        ];
        mockApiClient.get.mockResolvedValue({ data: mockParents });

        const result = await usersApi.getParents();

        expect(mockApiClient.get).toHaveBeenCalledWith('/parents');
        expect(result).toEqual(mockParents);
      });
    });

    describe('createParent', () => {
      it('should call POST /parents', async () => {
        const createData = {
          email: 'newparent@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'Parent',
        };
        const mockResponse = { id: 'par2', email: 'newparent@example.com', firstName: 'New', lastName: 'Parent', role: 'PARENT' };
        mockApiClient.post.mockResolvedValue({ data: mockResponse });

        const result = await usersApi.createParent(createData);

        expect(mockApiClient.post).toHaveBeenCalledWith('/parents', createData);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateParent', () => {
      it('should call PATCH /parents/:id', async () => {
        const updateData = { phoneNumber: '+9999999999' };
        mockApiClient.patch.mockResolvedValue({ data: { id: 'par1', ...updateData } });

        await usersApi.updateParent('par1', updateData);

        expect(mockApiClient.patch).toHaveBeenCalledWith('/parents/par1', updateData);
      });
    });

    describe('deleteParent', () => {
      it('should call DELETE /parents/:id', async () => {
        mockApiClient.delete.mockResolvedValue({});

        await usersApi.deleteParent('par1');

        expect(mockApiClient.delete).toHaveBeenCalledWith('/parents/par1');
      });
    });

    describe('linkChildToParent', () => {
      it('should call POST /parents/:parentId/children/:playerId', async () => {
        const mockResponse = {
          id: 'par1',
          firstName: 'Parent',
          lastName: 'One',
          children: [{ id: 'p1', firstName: 'Child', lastName: 'One' }],
        };
        mockApiClient.post.mockResolvedValue({ data: mockResponse });

        const result = await usersApi.linkChildToParent('par1', 'p1');

        expect(mockApiClient.post).toHaveBeenCalledWith('/parents/par1/children/p1');
        expect(result).toEqual(mockResponse);
      });
    });

    describe('unlinkChildFromParent', () => {
      it('should call DELETE /parents/:parentId/children/:playerId', async () => {
        const mockResponse = {
          id: 'par1',
          firstName: 'Parent',
          lastName: 'One',
          children: [],
        };
        mockApiClient.delete.mockResolvedValue({ data: mockResponse });

        const result = await usersApi.unlinkChildFromParent('par1', 'p1');

        expect(mockApiClient.delete).toHaveBeenCalledWith('/parents/par1/children/p1');
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Groups', () => {
    describe('getGroups', () => {
      it('should call GET /groups', async () => {
        const mockGroups = [
          { id: 'g1', name: 'U12', ageGroup: '2012' },
          { id: 'g2', name: 'U14', ageGroup: '2010' },
        ];
        mockApiClient.get.mockResolvedValue({ data: mockGroups });

        const result = await usersApi.getGroups();

        expect(mockApiClient.get).toHaveBeenCalledWith('/groups');
        expect(result).toEqual(mockGroups);
      });
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from API', async () => {
      const error = new Error('User already exists');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        usersApi.createCoach({
          email: 'existing@example.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          licenseLevel: 'B',
          experienceYears: 0,
        }),
      ).rejects.toThrow('User already exists');
    });
  });
});
