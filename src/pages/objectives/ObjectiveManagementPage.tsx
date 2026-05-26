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
import { useI18n } from '../../contexts/I18nContext';

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
  const { t } = useI18n();
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
        setError(t('objectives.management.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async () => {
    if (!selectedGroupId) {
      setError(t('objectives.management.errors.selectGroup'));
      return;
    }
    if (mode === 'player' && !selectedPlayerId) {
      setError(t('objectives.management.errors.selectPlayer'));
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
      setError(t('objectives.management.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('objectives.management.title')}
        subtitle={t('objectives.management.subtitle')}
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
                <CardTitle>{t('objectives.management.createTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('objectives.management.createDescription')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('objectives.management.labels.group')}
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
                      {t('objectives.management.labels.type')}
                    </label>
                    <select
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value as 'player' | 'group')
                      }
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    >
                      <option value="player">{t('objectives.management.types.player')}</option>
                      <option value="group">{t('objectives.management.types.group')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('objectives.management.labels.player')}
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
                      {t('objectives.management.labels.metric')}
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
                          {t(`objectives.metrics.${metric}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('objectives.management.labels.title')}
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder={t('objectives.management.placeholders.title')}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('objectives.management.labels.badge')}
                    </label>
                    <input
                      type="text"
                      value={form.badgeLabel}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, badgeLabel: event.target.value }))
                      }
                      placeholder={t('objectives.management.placeholders.badge')}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t('objectives.management.labels.description')}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder={t('objectives.management.placeholders.description')}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t('objectives.management.labels.target')}
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
                      {t('objectives.management.labels.startDate')}
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
                      {t('objectives.management.labels.endDate')}
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
                    {saving
                      ? t('objectives.management.saving')
                      : mode === 'group'
                        ? t('objectives.management.assignGroup')
                        : t('objectives.management.assignPlayer')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('objectives.management.currentTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {objectives.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('objectives.management.empty')}</p>
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
                              ? `${t('objectives.management.scope.group')}${objective.group ? ` • ${objective.group.name}` : ''}`
                              : objective.player
                                ? `${objective.player.firstName} ${objective.player.lastName}${objective.player.group ? ` • ${objective.player.group.name}` : ''}`
                                : t('objectives.management.scope.player')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t(`objectives.metrics.${objective.metric}`)}: {objective.currentValue.toFixed(2)} / {objective.targetValue.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(objective.status)}>
                          {t(`objectives.status.${objective.status}`)}
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
