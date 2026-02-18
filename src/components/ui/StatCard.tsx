type StatColor = 'green' | 'blue' | 'purple' | 'amber' | 'red';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: StatColor;
  className?: string;
}

const colorStyles: Record<StatColor, { bg: string; icon: string }> = {
  green: {
    bg: 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  blue: {
    bg: 'from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    bg: 'from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  red: {
    bg: 'from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30',
    icon: 'text-red-600 dark:text-red-400',
  },
};

export function StatCard({ icon, value, label, color = 'green', className = '' }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${styles.bg} rounded-xl flex items-center justify-center`}>
          <div className={styles.icon}>{icon}</div>
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
