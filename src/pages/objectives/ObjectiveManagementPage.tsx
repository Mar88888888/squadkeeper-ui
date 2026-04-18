import { useEffect, useMemo, useState } from 'react';
import {
  objectivesApi,
  objectiveMetricLabels,
  type CreateGroupObjectiveRequest,
  type CreateObjectiveRequest,
  type Objective,
  type ObjectiveMetric,
} from '../../api/objectives';
import { groupsApi, type GroupInfo } from '../../api/groups';
import { PageContent, PageHeader } from '../../components/layout';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '../../components/ui';

const METRIC_OPTIONS: ObjectiveMetric[] = [
  'attendance_rate',
  'clean_sheets',
  'goals',
  'assists',
  'goal_contributions',
  'average_rating',
];

function getStatusVariant(status: Objective['status']): 'default' | 'success' | 'warning' | 'info' {
  if (status === 'achieved') return 'success';
  if (status === 'expired') return 'warning';
  if (status === 'archived') return 'default';
  return 'info';
}

function getInitialFormState() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    title: '',
    description: '',
    metric: 'goals' as ObjectiveMetric,
    targetValue: 1,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    badgeLabel: '',
  };
}

export function ObjectiveManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [mode, setMode] = useState<'player' | 'group'>('player');
  const [form, setForm] = useState(getInitialFormState());

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  const players = selectedGroup?.players ?? [];

  const reloadObjectives = async () => {
    const items = await objectivesApi.getMy();
    setObjectives(items);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [groupList, objectiveList] = await Promise.all([
          groupsApi.getMy().catch(() => groupsApi.getAll()),
          objectivesApi.getMy(),
        ]);

        setGroups(groupList);
        setObjectives(objectiveList);

        const firstGroup = groupList[0];
        if (firstGroup) {
          setSelectedGroupId(firstGroup.id);
          if (firstGroup.players[0]) {
            setSelectedPlayerId(firstGroup.players[0].id);
          }
        }
      } catch {
        setError('Failed to load objective management data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async () => {
    if (!selectedGroupId) {
      setError('Select a group first');
      return;
    }
    if (mode === 'player' && !selectedPlayerId) {
      setError('Select a player for personal objective');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const commonPayload: CreateGroupObjectiveRequest = {
        title: form.title,
        description: form.description || undefined,
        metric: form.metric,
        targetValue: Number(form.targetValue),
        periodStart: new Date(`${form.periodStart}T00:00:00`).toISOString(),
        periodEnd: new Date(`${form.periodEnd}T23:59:59`).toISOString(),
        badgeLabel: form.badgeLabel || undefined,
      };

      if (mode === 'player') {
        const payload: CreateObjectiveRequest = {
          playerId: selectedPlayerId,
          ...commonPayload,
        };
        await objectivesApi.create(payload);
      } else {
        await objectivesApi.createForGroup(selectedGroupId, commonPayload);
      }

      setForm(getInitialFormState());
      await reloadObjectives();
    } catch {
      setError('Failed to save objective');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Objective Management"
        subtitle="Set and monitor player and team objectives"
      />

      <PageContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Create Objective</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fill in all fields below. Choose whether this objective is for one player or for the whole group.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Group
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(event) => {
                        const groupId = event.target.value;
                        setSelectedGroupId(groupId);
                        const group = groups.find((item) => item.id === groupId);
                        setSelectedPlayerId(group?.players[0]?.id ?? '');
                      }}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    >
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Objective Type
                    </label>
                    <select
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value as 'player' | 'group')
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    >
                      <option value="player">Personal objective</option>
                      <option value="group">Group objective</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Player
                    </label>
                    <select
                      value={selectedPlayerId}
                      onChange={(event) => setSelectedPlayerId(event.target.value)}
                      disabled={mode === 'group'}
                      className="w-full px-3 py-2 bg-gray-50 disabled:opacity-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    >
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Metric
                    </label>
                    <select
                      value={form.metric}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          metric: event.target.value as ObjectiveMetric,
                        }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    >
                      {METRIC_OPTIONS.map((metric) => (
                        <option key={metric} value={metric}>
                          {objectiveMetricLabels[metric]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Objective Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="e.g. Club goals"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Badge Label (optional)
                    </label>
                    <input
                      type="text"
                      value={form.badgeLabel}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, badgeLabel: event.target.value }))
                      }
                      placeholder="e.g. Scoring Machine"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Description (optional)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Add coaching context or success criteria"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Target Value
                    </label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={form.targetValue}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          targetValue: Number(event.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.periodStart}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, periodStart: event.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.periodEnd}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, periodEnd: event.target.value }))
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving...' : mode === 'group' ? 'Assign to Group' : 'Assign to Player'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {objectives.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No objectives yet.</p>
                ) : (
                  objectives.map((objective) => (
                    <div
                      key={objective.id}
                      className="border border-gray-100 dark:border-gray-800 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {objective.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {objective.scope === 'group'
                              ? `Team objective${objective.group ? ` • ${objective.group.name}` : ''}`
                              : objective.player
                                ? `${objective.player.firstName} ${objective.player.lastName}${objective.player.group ? ` • ${objective.player.group.name}` : ''}`
                                : 'Personal objective'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {objectiveMetricLabels[objective.metric]}: {objective.currentValue.toFixed(2)} / {objective.targetValue.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(objective.status)}>
                          {objective.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${Math.min(objective.progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContent>
    </>
  );
}

