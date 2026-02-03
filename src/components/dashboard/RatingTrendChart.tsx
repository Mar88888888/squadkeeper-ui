import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RatingDataPoint {
  date: string;
  rating: number;
}

interface RatingTrendChartProps {
  data: RatingDataPoint[];
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-3 py-2 border border-gray-100">
        <p className="text-xs text-gray-500">{formatDate(label)}</p>
        <p className="text-sm font-semibold text-green-600">
          Rating: {payload[0].value.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
}

export function RatingTrendChart({ data, loading }: RatingTrendChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const hasData = data && data.length > 0;
  const currentRating = hasData ? data[data.length - 1].rating : 0;
  const previousRating = hasData && data.length > 1 ? data[data.length - 2].rating : currentRating;
  const trend = currentRating - previousRating;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Rating Trend</h3>
        {hasData && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {currentRating.toFixed(1)}
            </span>
            {trend !== 0 && (
              <span className={`flex items-center text-xs font-medium ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? (
                  <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {Math.abs(trend).toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>

      {hasData ? (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ fill: '#16a34a', r: 3 }}
                activeDot={{ fill: '#16a34a', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
          No rating data available
        </div>
      )}
    </div>
  );
}
