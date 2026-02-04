import { useChartColors } from '../../hooks/useChartColors';

interface ScoreBreakdown {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

interface PerformanceScoreRingProps {
  score: number;
  maxScore?: number;
  breakdown?: ScoreBreakdown[];
  loading?: boolean;
}

function CircularProgress({ score, maxScore }: { score: number; maxScore: number }) {
  const chartColors = useChartColors();
  const percentage = Math.min((score / maxScore) * 100, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return { stroke: chartColors.scoreGood, text: 'text-green-600 dark:text-green-400' };
    if (pct >= 60) return { stroke: chartColors.scoreMedium, text: 'text-amber-600 dark:text-amber-400' };
    return { stroke: chartColors.scoreLow, text: 'text-red-600 dark:text-red-400' };
  };

  const colors = getScoreColor(percentage);

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={chartColors.backgroundStroke}
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={colors.stroke}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">/ {maxScore}</span>
      </div>
    </div>
  );
}

function BreakdownBar({ item }: { item: ScoreBreakdown }) {
  const percentage = Math.min((item.value / item.maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 dark:text-gray-400 w-20 truncate">{item.label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${item.color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
        {item.value}
      </span>
    </div>
  );
}

export function PerformanceScoreRing({
  score,
  maxScore = 100,
  breakdown,
  loading,
}: PerformanceScoreRingProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="flex items-center gap-6">
            <div className="w-36 h-36 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Performance Score</h3>
      <div className="flex items-center gap-6">
        <CircularProgress score={score} maxScore={maxScore} />
        {breakdown && breakdown.length > 0 && (
          <div className="flex-1 space-y-2">
            {breakdown.map((item, index) => (
              <BreakdownBar key={index} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const defaultBreakdownColors = {
  technical: 'bg-green-500',
  tactical: 'bg-blue-500',
  physical: 'bg-amber-500',
  mental: 'bg-purple-500',
};
