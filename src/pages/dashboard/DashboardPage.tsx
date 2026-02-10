import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { attendanceApi, type AttendanceStats, type PlayerAttendanceStats } from '../../api/attendance';
import { trainingsApi, type Training } from '../../api/trainings';
import { matchesApi, type Match } from '../../api/matches';
import { statsApi, type PlayerStats } from '../../api/stats';
import { evaluationsApi, type RatingStats } from '../../api/evaluations';
import { usersApi } from '../../api/users';
import { roleColors } from '../../constants/colors';
import { UpcomingEventCard } from '../../components/dashboard/UpcomingEventCard';
import { QuickStatsRow, statIcons } from '../../components/dashboard/QuickStatsRow';
import { PerformanceScoreRing, defaultBreakdownColors } from '../../components/dashboard/PerformanceScoreRing';
import { RatingTrendChart } from '../../components/dashboard/RatingTrendChart';
import { CompactNavigation, navIcons } from '../../components/dashboard/CompactNavigation';
import { ParentUpcomingEvents } from '../../components/dashboard/ParentUpcomingEvents';
import { ThemeToggle } from '../../components/ThemeToggle';

const roleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.COACH]: 'Coach',
  [UserRole.PLAYER]: 'Player',
  [UserRole.PARENT]: 'Parent',
};

type UpcomingEvent =
  | { type: 'training'; data: Training }
  | { type: 'match'; data: Match };

function findNextEvent(trainings: Training[], matches: Match[]): UpcomingEvent | null {
  const now = new Date();

  const upcomingTrainings = trainings
    .filter(t => new Date(t.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const upcomingMatches = matches
    .filter(m => new Date(m.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextTraining = upcomingTrainings[0];
  const nextMatch = upcomingMatches[0];

  if (!nextTraining && !nextMatch) return null;
  if (!nextTraining) return { type: 'match', data: nextMatch };
  if (!nextMatch) return { type: 'training', data: nextTraining };

  return new Date(nextTraining.startTime) < new Date(nextMatch.startTime)
    ? { type: 'training', data: nextTraining }
    : { type: 'match', data: nextMatch };
}

interface ChildWithGroup {
  id: string;
  firstName: string;
  lastName: string;
  groupId: string | null;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [childrenStats, setChildrenStats] = useState<PlayerAttendanceStats[]>([]);
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  // Parent-specific state
  const [parentTrainings, setParentTrainings] = useState<Training[]>([]);
  const [parentMatches, setParentMatches] = useState<Match[]>([]);
  const [childrenWithGroups, setChildrenWithGroups] = useState<ChildWithGroup[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (user?.role === UserRole.PLAYER) {
          const [trainings, matches, stats, attendance, ratings] = await Promise.all([
            trainingsApi.getMy({ timeFilter: 'upcoming' }).catch(() => []),
            matchesApi.getMy({ timeFilter: 'upcoming' }).catch(() => []),
            statsApi.getMyStats().catch(() => null),
            attendanceApi.getMyStats().catch(() => null),
            evaluationsApi.getMyRatingStats().catch(() => null),
          ]);

          setUpcomingEvent(findNextEvent(trainings, matches));
          setPlayerStats(stats);
          setAttendanceStats(attendance);
          setRatingStats(ratings);
        } else if (user?.role === UserRole.PARENT) {
          const [trainings, matches, attendanceStats, childrenData] = await Promise.all([
            trainingsApi.getMy({ timeFilter: 'upcoming' }).catch(() => []),
            matchesApi.getMy({ timeFilter: 'upcoming' }).catch(() => []),
            attendanceApi.getMyStatsAsParent().catch(() => []),
            statsApi.getChildrenStats().catch(() => ({ children: [], stats: null })),
          ]);

          // Build children info - prefer childrenData as it's more reliable
          let childrenFromStats: ChildWithGroup[] = [];

          if (childrenData.children.length > 0) {
            // Use children from stats API
            childrenFromStats = childrenData.children.map(c => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              groupId: null as string | null,
            }));
          } else if (attendanceStats.length > 0) {
            // Fallback to attendance stats
            childrenFromStats = attendanceStats.map(s => {
              const nameParts = s.playerName.split(' ');
              return {
                id: s.playerId,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                groupId: null as string | null,
              };
            });
          }

          // Collect all unique group IDs from events
          const eventGroups = new Set<string>();
          trainings.forEach(t => eventGroups.add(t.group.id));
          matches.forEach(m => eventGroups.add(m.group.id));

          // If single child, assign all groups to them
          // If multiple children and multiple groups, we can't determine mapping without more data
          if (childrenFromStats.length === 1 && eventGroups.size > 0) {
            // Single child - all events are theirs, pick first group for mapping
            childrenFromStats[0].groupId = Array.from(eventGroups)[0];
            // Actually, add all groups for this child
            const allGroupIds = Array.from(eventGroups);
            // We need to handle multiple groups for single child
            // For now, we'll show child name for all events
          }

          // For the component, we need to map groups to children
          // If we have same number of children and groups, try to match them
          // Otherwise, show group names as fallback
          const childrenWithGroupInfo = childrenFromStats.map((child, index) => {
            const groupIds = Array.from(eventGroups);
            // If single child, they get all groups
            // If multiple children and same count as groups, assign 1:1
            if (childrenFromStats.length === 1) {
              return { ...child, groupId: groupIds[0] || null };
            }
            if (childrenFromStats.length === groupIds.length) {
              return { ...child, groupId: groupIds[index] || null };
            }
            return child;
          });

          setParentTrainings(trainings);
          setParentMatches(matches);
          setChildrenWithGroups(childrenWithGroupInfo);
          setChildrenStats(attendanceStats);
        } else if (user?.role === UserRole.COACH) {
          const [trainings, matches] = await Promise.all([
            trainingsApi.getMy({ timeFilter: 'upcoming' }).catch(() => []),
            matchesApi.getMy({ timeFilter: 'upcoming' }).catch(() => []),
          ]);
          setUpcomingEvent(findNextEvent(trainings, matches));
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const playerNavItems = [
    { to: '/trainings', label: 'Trainings', icon: navIcons.trainings },
    { to: '/matches', label: 'Matches', icon: navIcons.matches },
    { to: '/calendar', label: 'Calendar', icon: navIcons.calendar },
    { to: '/stats/my', label: 'My Stats', icon: navIcons.stats },
    { to: '/contacts', label: 'Contacts', icon: navIcons.contacts },
  ];

  const parentNavItems = [
    { to: '/trainings', label: 'Trainings', icon: navIcons.trainings },
    { to: '/matches', label: 'Matches', icon: navIcons.matches },
    { to: '/calendar', label: 'Calendar', icon: navIcons.calendar },
    { to: '/stats/children', label: 'Child Stats', icon: navIcons.children },
    { to: '/contacts', label: 'Contacts', icon: navIcons.contacts },
  ];

  const coachNavItems = [
    { to: '/trainings', label: 'Trainings', icon: navIcons.trainings },
    { to: '/matches', label: 'Matches', icon: navIcons.matches },
    { to: '/calendar', label: 'Calendar', icon: navIcons.calendar },
    { to: '/stats/team', label: 'Team Stats', icon: navIcons.stats },
    { to: '/my-groups', label: 'My Groups', icon: navIcons.groups },
    { to: '/squads', label: 'Squads', icon: navIcons.squads },
    { to: '/analytics/performance', label: 'Performance', icon: navIcons.performance },
  ];

  const adminNavItems = [
    { to: '/admin/users', label: 'Create User', icon: navIcons.users },
    { to: '/admin/users/list', label: 'User List', icon: navIcons.groups },
    { to: '/admin/groups', label: 'Groups', icon: navIcons.groups },
    { to: '/trainings', label: 'Trainings', icon: navIcons.trainings },
    { to: '/matches', label: 'Matches', icon: navIcons.matches },
    { to: '/calendar', label: 'Calendar', icon: navIcons.calendar },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case UserRole.PLAYER: return playerNavItems;
      case UserRole.PARENT: return parentNavItems;
      case UserRole.COACH: return coachNavItems;
      case UserRole.ADMIN: return adminNavItems;
      default: return [];
    }
  };

  const getQuickStats = () => {
    if (user?.role === UserRole.PLAYER && playerStats) {
      return [
        { label: 'Goals', value: playerStats.goals, icon: statIcons.goals, color: 'green' as const },
        { label: 'Assists', value: playerStats.assists, icon: statIcons.assists, color: 'amber' as const },
        { label: 'Matches', value: playerStats.matchesPlayed, icon: statIcons.matches, color: 'blue' as const },
        { label: 'Attendance', value: `${attendanceStats?.rate ?? 0}%`, icon: statIcons.attendance, color: 'purple' as const },
      ];
    }
    return [];
  };

  const getPerformanceBreakdown = () => {
    if (!ratingStats?.byCategory) return undefined;
    const { technical, tactical, physical, psychological } = ratingStats.byCategory;
    return [
      { label: 'Technical', value: technical ?? 0, maxValue: 10, color: defaultBreakdownColors.technical },
      { label: 'Tactical', value: tactical ?? 0, maxValue: 10, color: defaultBreakdownColors.tactical },
      { label: 'Physical', value: physical ?? 0, maxValue: 10, color: defaultBreakdownColors.physical },
      { label: 'Mental', value: psychological ?? 0, maxValue: 10, color: defaultBreakdownColors.mental },
    ];
  };

  const getRatingTrendData = () => {
    if (!ratingStats?.history) return [];
    return ratingStats.history.map(point => ({
      date: point.date,
      rating: point.averageRating,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Football Academy</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.firstName} {user?.lastName}
              </span>
              <ThemeToggle />
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200 dark:focus:ring-red-900 active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center select-none">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Welcome back, {user?.firstName}!
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</span>
                {user?.role && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                  >
                    {roleLabels[user.role]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Dashboard */}
        {user?.role === UserRole.PLAYER && (
          <div className="space-y-6">
            {/* Hero: Upcoming Event */}
            <UpcomingEventCard event={upcomingEvent} loading={loading} />

            {/* Quick Stats Row */}
            <QuickStatsRow stats={getQuickStats()} loading={loading} />

            {/* Performance & Trend Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceScoreRing
                score={Math.round((ratingStats?.averageRating ?? 0) * 10)}
                maxScore={100}
                breakdown={getPerformanceBreakdown()}
                loading={loading}
              />
              <RatingTrendChart data={getRatingTrendData()} loading={loading} />
            </div>

            {/* Compact Navigation */}
            <CompactNavigation items={getNavItems()} />
          </div>
        )}

        {/* Parent Dashboard */}
        {user?.role === UserRole.PARENT && (
          <div className="space-y-6">
            {/* Upcoming Events for Children */}
            <ParentUpcomingEvents
              trainings={parentTrainings}
              matches={parentMatches}
              children={childrenWithGroups}
              loading={loading}
            />

            {/* Children Attendance Overview */}
            {childrenStats.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Children Attendance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {childrenStats.map((child) => (
                    <div key={child.playerId} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-amber-600 dark:text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{child.playerName}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{child.rate}%</p>
                          {child.total > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {child.present + child.late} / {child.total} events
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Navigation */}
            <CompactNavigation items={getNavItems()} />
          </div>
        )}

        {/* Coach Dashboard */}
        {user?.role === UserRole.COACH && (
          <div className="space-y-6">
            {/* Hero: Upcoming Event */}
            <UpcomingEventCard event={upcomingEvent} loading={loading} />

            {/* Compact Navigation */}
            <CompactNavigation items={getNavItems()} />
          </div>
        )}

        {/* Admin Dashboard */}
        {user?.role === UserRole.ADMIN && (
          <div className="space-y-6">
            {/* Compact Navigation */}
            <CompactNavigation items={getNavItems()} />
          </div>
        )}

        {/* Account Information */}
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">Account Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Full Name</dt>
              <dd className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Email</dt>
              <dd className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">{user?.email}</dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Role</dt>
              <dd className="mt-1 text-base font-medium text-gray-900 dark:text-gray-100">
                {user?.role ? roleLabels[user.role] : '-'}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
