import { useEffect, useMemo, useState } from 'react';
import { objectivesApi, objectiveMetricLabels, type Objective } from '../../api/objectives';
import { PageContent, PageHeader } from '../../components/layout';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '../../components/ui';

function getStatusVariant(status: Objective['status']): 'default' | 'success' | 'warning' | 'info' {
  if (status === 'achieved') return 'success';
  if (status === 'expired') return 'warning';
  if (status === 'archived') return 'default';
  return 'info';
}

export function MyObjectivesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [objectives, setObjectives] = useState<Objective[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const items = await objectivesApi.getMy();
        setObjectives(items);
      } catch {
        setError('Failed to load objectives');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const completed = useMemo(
    () =>
      objectives
        .filter((objective) => objective.status === 'achieved')
        .sort((a, b) => {
          const aTime = a.achievedAt ? new Date(a.achievedAt).getTime() : 0;
          const bTime = b.achievedAt ? new Date(b.achievedAt).getTime() : 0;
          return bTime - aTime;
        }),
    [objectives],
  );

  return (
    <>
      <PageHeader
        title="My Completed Objectives"
        subtitle="Your achieved goals"
      />

      <PageContent>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completed.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No completed objectives yet.
                  </p>
                ) : (
                  completed.map((objective) => (
                    <div
                      key={objective.id}
                      className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{objective.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {objectiveMetricLabels[objective.metric]} target: {objective.targetValue.toFixed(2)}
                          {objective.badgeLabel ? ` • Badge: ${objective.badgeLabel}` : ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Completed: {objective.achievedAt ? new Date(objective.achievedAt).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant('achieved')}>COMPLETED</Badge>
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

