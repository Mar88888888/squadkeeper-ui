import { apiClient } from './client';

export type ObjectiveMetric =
  | 'attendance_rate'
  | 'clean_sheets'
  | 'goals'
  | 'assists'
  | 'goal_contributions'
  | 'average_rating';

export type ObjectiveStatus = 'active' | 'achieved' | 'expired' | 'archived';
export type ObjectiveScope = 'player' | 'group';

export interface ObjectivePlayer {
  id: string;
  firstName: string;
  lastName: string;
  group: {
    id: string;
    name: string;
  } | null;
}

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  scope: ObjectiveScope;
  metric: ObjectiveMetric;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
  badgeLabel: string | null;
  status: ObjectiveStatus;
  currentValue: number;
  progressPercent: number;
  achievedAt: string | null;
  archivedAt: string | null;
  player: ObjectivePlayer | null;
  group: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

type NumericApiValue = number | string | null | undefined;

type ApiObjective = Omit<Objective, 'targetValue' | 'currentValue' | 'progressPercent'> & {
  scope?: ObjectiveScope;
  targetValue: NumericApiValue;
  currentValue: NumericApiValue;
  progressPercent: NumericApiValue;
};

export interface ObjectiveSummary {
  activeCount: number;
  achievedCount: number;
  expiredCount: number;
  recentAchievements: Array<{
    id: string;
    title: string;
    badgeLabel: string | null;
    achievedAt: string;
  }>;
}

export interface CreateObjectiveRequest {
  playerId: string;
  title: string;
  description?: string;
  metric: ObjectiveMetric;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
  badgeLabel?: string;
}

export interface CreateGroupObjectiveRequest {
  title: string;
  description?: string;
  metric: ObjectiveMetric;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
  badgeLabel?: string;
}

export interface UpdateObjectiveRequest {
  title?: string;
  description?: string;
  metric?: ObjectiveMetric;
  targetValue?: number;
  periodStart?: string;
  periodEnd?: string;
  badgeLabel?: string;
  status?: ObjectiveStatus;
}

export const objectiveMetricLabels: Record<ObjectiveMetric, string> = {
  attendance_rate: 'Attendance Rate (%)',
  clean_sheets: 'Clean Sheets',
  goals: 'Goals',
  assists: 'Assists',
  goal_contributions: 'Goal Contributions',
  average_rating: 'Average Rating',
};

function toSafeNumber(value: NumericApiValue): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeObjective(objective: ApiObjective): Objective {
  const scope: ObjectiveScope =
    objective.scope ?? (objective.group ? 'group' : 'player');

  return {
    ...objective,
    scope,
    targetValue: toSafeNumber(objective.targetValue),
    currentValue: toSafeNumber(objective.currentValue),
    progressPercent: toSafeNumber(objective.progressPercent),
    player: objective.player ?? null,
    group: objective.group ?? null,
  };
}

export const objectivesApi = {
  create: async (data: CreateObjectiveRequest): Promise<Objective> => {
    const response = await apiClient.post<ApiObjective>('/objectives', data);
    return normalizeObjective(response.data);
  },

  createForGroup: async (
    groupId: string,
    data: CreateGroupObjectiveRequest,
  ): Promise<Objective> => {
    const response = await apiClient.post<ApiObjective>(
      `/objectives/group/${encodeURIComponent(groupId)}`,
      data,
    );
    return normalizeObjective(response.data);
  },

  getMy: async (): Promise<Objective[]> => {
    const response = await apiClient.get<ApiObjective[]>('/objectives/my');
    return response.data.map(normalizeObjective);
  },

  getByPlayer: async (playerId: string): Promise<Objective[]> => {
    const response = await apiClient.get<ApiObjective[]>(
      `/objectives/player/${encodeURIComponent(playerId)}`,
    );
    return response.data.map(normalizeObjective);
  },

  getMySummary: async (): Promise<ObjectiveSummary> => {
    const response = await apiClient.get<ObjectiveSummary>('/objectives/summary/my');
    return response.data;
  },

  update: async (id: string, data: UpdateObjectiveRequest): Promise<Objective> => {
    const response = await apiClient.patch<ApiObjective>(
      `/objectives/${encodeURIComponent(id)}`,
      data,
    );
    return normalizeObjective(response.data);
  },
};

