import { test as base, Page } from '@playwright/test';

// Create a mock JWT token (base64 encoded)
// Format: header.payload.signature
function createMockJWT(user: { id: string; email: string; role: string; firstName: string; lastName: string }) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

// Mock data
export const mockCoachUser = {
  id: 'u1',
  email: 'coach@test.com',
  firstName: 'John',
  lastName: 'Coach',
  role: 'COACH',
};

export const mockPlayerUser = {
  id: 'u2',
  email: 'player@test.com',
  firstName: 'Tom',
  lastName: 'Player',
  role: 'PLAYER',
};

export const mockAdminUser = {
  id: 'u3',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
};

export const mockParentUser = {
  id: 'u4',
  email: 'parent@test.com',
  firstName: 'Parent',
  lastName: 'User',
  role: 'PARENT',
};

export const mockGroups = [
  {
    id: 'g1',
    name: 'U12',
    yearOfBirth: 2012,
    headCoach: { id: 'c1', firstName: 'John', lastName: 'Coach' },
    assistants: [],
    players: [
      { id: 'p1', firstName: 'Tom', lastName: 'Player', position: 'FW' },
      { id: 'p2', firstName: 'Jane', lastName: 'Player', position: 'MF' },
    ],
  },
  {
    id: 'g2',
    name: 'U14',
    yearOfBirth: 2010,
    headCoach: null,
    assistants: [],
    players: [],
  },
];

export const mockTrainings = [
  {
    id: 't1',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 86400000 + 5400000).toISOString(),
    location: 'Training Field A',
    topic: 'Passing drills',
    group: { id: 'g1', name: 'U12' },
  },
  {
    id: 't2',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86400000 + 5400000).toISOString(),
    location: 'Training Field B',
    topic: 'Shooting practice',
    group: { id: 'g1', name: 'U12' },
  },
];

export const mockMatches = [
  {
    id: 'm1',
    startTime: new Date(Date.now() + 172800000).toISOString(),
    endTime: new Date(Date.now() + 172800000 + 5400000).toISOString(),
    location: 'Stadium A',
    opponent: 'FC Dynamo U12',
    isHome: true,
    homeGoals: null,
    awayGoals: null,
    group: { id: 'g1', name: 'U12' },
  },
  {
    id: 'm2',
    startTime: new Date(Date.now() - 172800000).toISOString(),
    endTime: new Date(Date.now() - 172800000 + 5400000).toISOString(),
    location: 'Stadium B',
    opponent: 'FC Shakhtar U12',
    isHome: false,
    homeGoals: 1,
    awayGoals: 3,
    group: { id: 'g1', name: 'U12' },
  },
];

export const mockPlayerStats = {
  player: { id: 'p1', firstName: 'Tom', lastName: 'Player' },
  matchesPlayed: 15,
  goalsScored: 8,
  assists: 5,
  trainingsAttended: 42,
  trainingsTotal: 45,
  averageRating: 7.5,
};

// Setup API mocks for a page
export async function setupApiMocks(page: Page, user: typeof mockCoachUser) {
  const mockToken = createMockJWT(user);

  // Mock auth endpoints
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: mockToken }),
    });
  });

  await page.route('**/api/auth/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });

  // Mock groups endpoints - specific routes first
  await page.route('**/api/groups/my', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGroups),
    });
  });

  await page.route('**/api/groups', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGroups),
    });
  });

  // Mock individual training details - MUST be before general /trainings route
  await page.route('**/api/trainings/my**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTrainings),
    });
  });

  await page.route('**/api/trainings/t1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockTrainings[0],
        group: {
          ...mockGroups[0],
          players: mockGroups[0].players,
        },
      }),
    });
  });

  await page.route('**/api/trainings/t2', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockTrainings[1],
        group: {
          ...mockGroups[0],
          players: mockGroups[0].players,
        },
      }),
    });
  });

  // Mock trainings endpoints - general route last
  await page.route('**/api/trainings', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTrainings),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 't3', ...mockTrainings[0] }),
      });
    }
  });

  // Mock individual match details - MUST be before general /matches route
  await page.route('**/api/matches/my**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockMatches),
    });
  });

  await page.route('**/api/matches/m1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockMatches[0],
        group: {
          ...mockGroups[0],
          players: mockGroups[0].players,
        },
      }),
    });
  });

  await page.route('**/api/matches/m2', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...mockMatches[1],
        group: {
          ...mockGroups[0],
          players: mockGroups[0].players,
        },
      }),
    });
  });

  // Mock matches endpoints - general route last
  await page.route('**/api/matches', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockMatches),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'm3', ...mockMatches[0] }),
      });
    }
  });

  // Mock stats endpoints
  await page.route('**/api/stats/player/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPlayerStats),
    });
  });

  await page.route('**/api/stats/my', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPlayerStats),
    });
  });

  // Mock player stats with query params
  await page.route('**/api/players/stats/my**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPlayerStats),
    });
  });

  // Mock attendance stats
  await page.route('**/api/attendance/my/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        trainingsAttended: 42,
        trainingsTotal: 45,
        matchesAttended: 12,
        matchesTotal: 15,
      }),
    });
  });

  // Mock schedule endpoints
  await page.route('**/api/schedules/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock attendance for training
  await page.route('**/api/attendance/training/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'a1', status: 'PRESENT', player: { id: 'p1', firstName: 'Tom', lastName: 'Player' } },
      ]),
    });
  });

  // Mock attendance for match
  await page.route('**/api/attendance/match/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock evaluations
  await page.route('**/api/evaluations/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock goals for matches
  await page.route('**/api/goals/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

// Extended test with auto-login capability
export const test = base.extend<{ loginAs: (user: typeof mockCoachUser) => Promise<void> }>({
  loginAs: async ({ page }, use) => {
    const loginAs = async (user: typeof mockCoachUser) => {
      await setupApiMocks(page, user);

      // Set token in localStorage before navigating
      const mockToken = createMockJWT(user);
      await page.addInitScript((token) => {
        localStorage.setItem('token', token);
      }, mockToken);
    };
    await use(loginAs);
  },
});

export { expect } from '@playwright/test';
