import { useEffect, useMemo, useState } from 'react';
import { statsApi, type TeamOfMonth, type TeamOfMonthPlayer } from '../../api/stats';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { FootballPitch } from '../../components/squad-builder';
import { Card, EmptyState } from '../../components/ui';
import { emptyStateIcons } from '../../components/EmptyState';

interface PitchSlot {
  x: number;
  y: number;
  label: string;
}

const DEFENDER_SLOTS: PitchSlot[] = [
  { x: 15, y: 76, label: 'LB' },
  { x: 38, y: 80, label: 'CB' },
  { x: 62, y: 80, label: 'CB' },
  { x: 85, y: 76, label: 'RB' },
];

const MIDFIELDER_SLOTS: PitchSlot[] = [
  { x: 30, y: 56, label: 'CM' },
  { x: 50, y: 60, label: 'CDM' },
  { x: 70, y: 56, label: 'CM' },
];

const FORWARD_SLOTS: PitchSlot[] = [
  { x: 20, y: 28, label: 'LW' },
  { x: 50, y: 14, label: 'ST' },
  { x: 80, y: 28, label: 'RW' },
];

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), 1);

  for (let i = 0; i < 24; i++) {
    const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
    const value = getMonthKey(date);
    options.push({ value, label: getMonthLabel(value) });
  }

  return options;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const shifted = new Date(year, month - 1 + delta, 1);
  return getMonthKey(shifted);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function getLineColor(line: TeamOfMonthPlayer['line']): string {
  if (line === 'GK') return 'bg-yellow-500';
  if (line === 'DEF') return 'bg-blue-500';
  if (line === 'MID') return 'bg-green-500';
  return 'bg-red-500';
}

function hasAnyPlayer(data: TeamOfMonth): boolean {
  return !!(
    data.players.goalkeeper ||
    data.players.defenders.length ||
    data.players.midfielders.length ||
    data.players.forwards.length
  );
}

function PitchPlayer({
  player,
  x,
  y,
  fallbackLabel,
}: {
  player: TeamOfMonthPlayer | null;
  x: number;
  y: number;
  fallbackLabel: string;
}) {
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {player ? (
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white ${getLineColor(player.line)}`}
            title={`${player.playerName} (${player.position})`}
          >
            {getInitials(player.playerName)}
          </div>
          <div className="mt-1 px-1.5 py-0.5 bg-black/70 rounded text-white text-[10px] font-medium whitespace-nowrap">
            {formatShortName(player.playerName)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center bg-white/10">
            <span className="text-white/80 text-[10px] font-bold">{fallbackLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeamOfMonthPage() {
  const monthOptions = useMemo(buildMonthOptions, []);
  const monthOptionSet = useMemo(
    () => new Set(monthOptions.map((option) => option.value)),
    [monthOptions],
  );
  const latestMonth = monthOptions[0]?.value ?? getMonthKey(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0]?.value ?? getMonthKey(new Date()));
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [data, setData] = useState<TeamOfMonth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const prevMonth = shiftMonth(selectedMonth, -1);
  const nextMonth = shiftMonth(selectedMonth, 1);
  const canGoPrev = monthOptionSet.has(prevMonth);
  const canGoNext = monthOptionSet.has(nextMonth) && selectedMonth !== latestMonth;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await statsApi.getTeamOfMonth(selectedMonth);
        setData(response);
      } catch {
        setError('Failed to load Team of the Month');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [selectedMonth]);

  const noData = data ? !hasAnyPlayer(data) : false;

  return (
    <>
      <PageHeader
        title="Team of the Month"
        subtitle="Symbolic XI (4-3-3) selected by TOPSIS"
        actions={
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1">
            <button
              type="button"
              onClick={() => canGoPrev && setSelectedMonth(prevMonth)}
              disabled={!canGoPrev}
              className="h-9 w-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous month"
            >
              ←
            </button>
            {isMonthPickerOpen ? (
              <input
                type="month"
                value={selectedMonth}
                max={latestMonth}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  if (monthOptionSet.has(value)) {
                    setSelectedMonth(value);
                    return;
                  }
                  if (value < monthOptions[monthOptions.length - 1]?.value) {
                    setSelectedMonth(monthOptions[monthOptions.length - 1].value);
                    return;
                  }
                  if (value > latestMonth) {
                    setSelectedMonth(latestMonth);
                    return;
                  }
                  setSelectedMonth(value);
                }}
                onBlur={() => setIsMonthPickerOpen(false)}
                className="h-9 min-w-36 px-2 text-sm text-center font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none"
                style={{ WebkitAppearance: 'none' }}
                aria-label="Choose month"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(true)}
                className="h-9 min-w-36 px-2 text-sm font-medium text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Open month picker"
              >
                {getMonthLabel(selectedMonth)}
              </button>
            )}
            <button
              type="button"
              onClick={() => canGoNext && setSelectedMonth(nextMonth)}
              disabled={!canGoNext}
              className="h-9 w-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        }
      />

      <PageContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-6">
            <Card className="p-4 md:p-6">
              {noData ? (
                <EmptyState
                  icon={emptyStateIcons.stats}
                  title="No Team of the Month data for selected month"
                  description="There are no eligible player records for this month yet."
                />
              ) : (
                <FootballPitch>
                  <PitchPlayer
                    player={data.players.goalkeeper}
                    x={50}
                    y={92}
                    fallbackLabel="GK"
                  />

                  {DEFENDER_SLOTS.map((slot, index) => (
                    <PitchPlayer
                      key={`def-${slot.label}-${index}`}
                      player={data.players.defenders[index] ?? null}
                      x={slot.x}
                      y={slot.y}
                      fallbackLabel={slot.label}
                    />
                  ))}

                  {MIDFIELDER_SLOTS.map((slot, index) => (
                    <PitchPlayer
                      key={`mid-${slot.label}-${index}`}
                      player={data.players.midfielders[index] ?? null}
                      x={slot.x}
                      y={slot.y}
                      fallbackLabel={slot.label}
                    />
                  ))}

                  {FORWARD_SLOTS.map((slot, index) => (
                    <PitchPlayer
                      key={`fwd-${slot.label}-${index}`}
                      player={data.players.forwards[index] ?? null}
                      x={slot.x}
                      y={slot.y}
                      fallbackLabel={slot.label}
                    />
                  ))}
                </FootballPitch>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selection criteria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                  <p><span className="font-medium">Formation:</span> {data.formation}</p>
                  <p><span className="font-medium">Month:</span> {getMonthLabel(data.month)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                  <p><span className="font-medium">Total events:</span> {data.groupTotalEvents}</p>
                  <p><span className="font-medium">Min attended events required:</span> {data.minRequiredEvents}</p>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </PageContent>
    </>
  );
}
