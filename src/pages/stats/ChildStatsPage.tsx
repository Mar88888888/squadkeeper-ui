import { useState, useEffect } from 'react';
import {
  statsApi,
  type ChildrenStats,
  type StatsPeriod,
} from '../../api/stats';
import { evaluationsApi, type RatingStats } from '../../api/evaluations';
import { objectivesApi, objectiveMetricLabels, type Objective } from '../../api/objectives';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { PlayerStatsView } from '../../components/PlayerStatsView';
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from '../../components/ui';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'this_season', label: 'This Season' },
  { value: 'this_year', label: 'This Year' },
  { value: 'this_month', label: 'This Month' },
];

export function ChildStatsPage() {
  const [data, setData] = useState<ChildrenStats | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const [period, setPeriod] = useState<StatsPeriod>('all_time');
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadChildrenInfo = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await statsApi.getChildrenStats(period);
        setData(result);

        const childId = selectedChildId || result.children[0]?.id;
        if (!selectedChildId && result.children.length > 0) {
          setSelectedChildId(childId);
        }
      } catch {
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadChildrenInfo();
  }, [period]);

  useEffect(() => {
    const loadstats = async () => {
      setError('');
      try {
        if (data && selectedChildId) {
          const [ratings, objectiveItems] = await Promise.all([
            evaluationsApi
              .getPlayerRatingStats(selectedChildId, period)
              .catch((error) => {
                console.error('Failed to load rating stats:', error);
                return null;
              }),
            objectivesApi.getByPlayer(selectedChildId).catch((error) => {
              console.error('Failed to load objectives:', error);
              return [];
            }),
          ]);
          setRatingStats(ratings);
          setObjectives(objectiveItems);
        }
      } catch {
        setError('Failed to load statistics');
      }
    };
    loadstats();
  }, [selectedChildId, period, data]);

  const children = data?.children || [];
  const currentChild = data?.children.find((c) => c.id === selectedChildId);

  const NoChildrenIcon = () => (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  return (
    <>
      <PageHeader
        title="Children Statistics"
        subtitle="Performance analytics for your children"
        actions={
          <div className="flex items-center gap-3">
            {children.length > 1 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </option>
                ))}
              </select>
            )}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as StatsPeriod)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <PageContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : children.length === 0 ? (
          <Card>
            <EmptyState
              icon={<NoChildrenIcon />}
              title="No children linked"
              description="No children are linked to your account yet. Contact an administrator to link your children."
            />
          </Card>
        ) : currentChild?.stats ? (
          <div className="space-y-6">
            <PlayerStatsView
              stats={currentChild?.stats || null}
              ratingStats={ratingStats}
              period={period}
              playerName={
                children.length > 1 ? currentChild?.stats.playerName : undefined
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Child Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {objectives.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No objectives assigned yet.
                  </p>
                ) : (
                  objectives.map((objective) => (
                    <div
                      key={objective.id}
                      className="border border-gray-100 dark:border-gray-800 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{objective.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {objectiveMetricLabels[objective.metric]}: {objective.currentValue.toFixed(2)} / {objective.targetValue.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant={objective.status === 'achieved' ? 'success' : 'info'}>
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
        ) : null}
      </PageContent>
    </>
  );
}
