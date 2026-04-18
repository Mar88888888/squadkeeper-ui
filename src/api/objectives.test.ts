import { objectivesApi, objectiveMetricLabels } from './objectives';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('objectivesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates single objective', async () => {
    const payload = {
      playerId: 'player-1',
      title: 'Score 3 goals',
      metric: 'goals' as const,
      targetValue: 3,
      periodStart: '2026-04-01T00:00:00.000Z',
      periodEnd: '2026-04-30T23:59:59.000Z',
    };
    mockApiClient.post.mockResolvedValue({ data: { id: 'obj-1' } });

    await objectivesApi.create(payload);

    expect(mockApiClient.post).toHaveBeenCalledWith('/objectives', payload);
  });

  it('creates group objective', async () => {
    const payload = {
      title: 'Attendance 90%',
      metric: 'attendance_rate' as const,
      targetValue: 90,
      periodStart: '2026-04-01T00:00:00.000Z',
      periodEnd: '2026-04-30T23:59:59.000Z',
    };
    mockApiClient.post.mockResolvedValue({
      data: {
        id: 'obj-group-1',
        currentValue: 0,
        targetValue: 90,
        progressPercent: 0,
      },
    });

    await objectivesApi.createForGroup('group-1', payload);

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/objectives/group/group-1',
      payload,
    );
  });

  it('gets my objectives and summary', async () => {
    mockApiClient.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 'obj-1',
            currentValue: '2.5',
            targetValue: '4',
            progressPercent: '62.5',
          },
        ],
      })
      .mockResolvedValueOnce({ data: { activeCount: 1 } });

    const items = await objectivesApi.getMy();
    const summary = await objectivesApi.getMySummary();

    expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/objectives/my');
    expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/objectives/summary/my');
    expect(items).toEqual([
      expect.objectContaining({
        id: 'obj-1',
        currentValue: 2.5,
        targetValue: 4,
        progressPercent: 62.5,
      }),
    ]);
    expect(summary).toEqual({ activeCount: 1 });
  });

  it('updates objective', async () => {
    mockApiClient.patch.mockResolvedValue({ data: { id: 'obj-1' } });

    await objectivesApi.update('obj-1', { status: 'archived' });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/objectives/obj-1', {
      status: 'archived',
    });
  });
});

describe('objectiveMetricLabels', () => {
  it('contains readable labels for metrics', () => {
    expect(objectiveMetricLabels.goals).toBe('Goals');
    expect(objectiveMetricLabels.clean_sheets).toBe('Clean Sheets');
    expect(objectiveMetricLabels.average_rating).toBe('Average Rating');
  });
});

