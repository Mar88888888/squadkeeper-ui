import { useTheme } from '../contexts/ThemeContext';

/**
 * Theme-aware color hook for Recharts and SVG elements.
 * Returns hex colors that adjust based on light/dark mode.
 */
export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    // Grid and axis colors
    grid: isDark ? '#374151' : '#e5e7eb', // gray-700 / gray-200
    axis: isDark ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
    axisLine: isDark ? '#4b5563' : '#d1d5db', // gray-600 / gray-300

    // Score/rating colors - brighter in dark mode for visibility
    scoreGood: isDark ? '#22c55e' : '#16a34a', // green-500 / green-600
    scoreMedium: isDark ? '#eab308' : '#ca8a04', // yellow-500 / amber-600
    scoreLow: isDark ? '#ef4444' : '#dc2626', // red-500 / red-600

    // Background stroke for rings/circles
    backgroundStroke: isDark ? '#4b5563' : '#e5e7eb', // gray-600 / gray-200

    // Category colors (stay vibrant in both modes)
    average: '#f59e0b', // amber-500
    technical: '#3b82f6', // blue-500
    tactical: '#22c55e', // green-500
    physical: '#ef4444', // red-500
    mental: '#a855f7', // purple-500

    // Tooltip colors
    tooltipBg: isDark ? '#1f2937' : '#ffffff', // gray-800 / white
    tooltipBorder: isDark ? '#374151' : '#e5e7eb', // gray-700 / gray-200
    tooltipText: isDark ? '#f3f4f6' : '#111827', // gray-100 / gray-900

    // Text colors for labels inside charts
    labelPrimary: isDark ? '#f3f4f6' : '#111827', // gray-100 / gray-900
    labelSecondary: isDark ? '#9ca3af' : '#6b7280', // gray-400 / gray-500

    // Line/area chart colors
    lineStroke: isDark ? '#22c55e' : '#16a34a', // green-500 / green-600
    areaFill: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)',
  };
}
