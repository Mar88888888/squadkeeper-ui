import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { PageHeader, PageContent } from '../../components/layout';
import { StatCard, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components/ui';
import {
  attendanceApi,
  type AttendanceStats,
  type PlayerAttendanceStats,
} from '../../api/attendance';
import { trainingsApi, getTrainingEndTime, type Training } from '../../api/trainings';
import { matchesApi, getMatchEndTime, type Match } from '../../api/matches';
import {
  statsApi,
  type ChildInfo,
  type ChildrenStats,
  type PlayerStats,
} from '../../api/stats';
import { evaluationsApi, type RatingStats } from '../../api/evaluations';
import { PerformanceScoreRing } from '../../components/dashboard/PerformanceScoreRing';
import { RatingTrendChart } from '../../components/dashboard/RatingTrendChart';

// Icons
const PlayersIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const GroupsIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
  </svg>
);

const TrainingsIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
  </svg>
);

const MatchesIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
  </svg>
);

const GoalsIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2}/>
    <circle cx="12" cy="12" r="3" strokeWidth={2}/>
  </svg>
);

const AttendanceIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const TeamIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
  </svg>
);

const StatsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>
);

const SquadsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
  </svg>
);

type UpcomingEvent = { type: 'training'; data: Training } | { type: 'match'; data: Match };

function findNextEvent(trainings: Training[], matches: Match[]): UpcomingEvent | null {
  const now = new Date();
  const upcomingTrainings = trainings
    .filter((t) => new Date(t.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const upcomingMatches = matches
    .filter((m) => new Date(m.startTime) > now)
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

function formatEventTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function getTimeUntil(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  return 'soon';
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [childrenStats, setChildrenStats] = useState<PlayerAttendanceStats[]>([]);
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [childrenWithGroups, setChildrenWithGroups] = useState<ChildInfo[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (user?.role === UserRole.PLAYER) {
          const [trainingsRes, matchesRes, stats, attendance, ratings] = await Promise.all([
            trainingsApi
              .getMy({ timeFilter: 'upcoming', take: 10 })
              .catch(() => ({ items: [], total: 0 })),
            matchesApi
              .getMy({ timeFilter: 'upcoming', take: 10 })
              .catch(() => ({ items: [], total: 0 })),
            statsApi.getMyStats().catch(() => null),
            attendanceApi.getMyStats().catch(() => null),
            evaluationsApi.getMyRatingStats().catch(() => null),
          ]);
          const trainings = trainingsRes.items;
          const matches = matchesRes.items;

          setUpcomingEvent(findNextEvent(trainings, matches));
          setPlayerStats(stats);
          setAttendanceStats(attendance);
          setRatingStats(ratings);

          // Build upcoming events list
          const events: UpcomingEvent[] = [
            ...trainings.slice(0, 3).map((t): UpcomingEvent => ({ type: 'training', data: t })),
            ...matches.slice(0, 3).map((m): UpcomingEvent => ({ type: 'match', data: m })),
          ].sort((a, b) => new Date(a.data.startTime).getTime() - new Date(b.data.startTime).getTime()).slice(0, 3);
          setUpcomingEvents(events);
        } else if (user?.role === UserRole.PARENT) {
          const [trainingsRes, matchesRes, attendanceStats, childrenData] = await Promise.all([
            trainingsApi
              .getMy({ timeFilter: 'upcoming', take: 10 })
              .catch(() => ({ items: [], total: 0 })),
            matchesApi
              .getMy({ timeFilter: 'upcoming', take: 10 })
              .catch(() => ({ items: [], total: 0 })),
            attendanceApi.getMyChildrenStats().catch((): PlayerAttendanceStats[] => []),
            statsApi.getChildrenStats().catch((): ChildrenStats => ({ children: [] })),
          ]);
          const trainings = trainingsRes.items;
          const matches = matchesRes.items;

          if (childrenData.children.length > 0) {
            setChildrenWithGroups(childrenData.children);
          }

          setUpcomingEvent(findNextEvent(trainings, matches));
          setChildrenStats(attendanceStats);

          const events: UpcomingEvent[] = [
            ...trainings.slice(0, 3).map((t): UpcomingEvent => ({ type: 'training', data: t })),
            ...matches.slice(0, 3).map((m): UpcomingEvent => ({ type: 'match', data: m })),
          ].sort((a, b) => new Date(a.data.startTime).getTime() - new Date(b.data.startTime).getTime()).slice(0, 3);
          setUpcomingEvents(events);
        } else if (user?.role === UserRole.COACH || user?.role === UserRole.ADMIN) {
          const [trainingsRes, matchesRes] = await Promise.all([
            trainingsApi
              .getMy({ timeFilter: 'upcoming', take: 10 })
              .catch(() => ({ items: [], total: 0 })),
            matchesApi
              .getMy({ timeFilter: 'upcoming', take: 10 })
              .catch(() => ({ items: [], total: 0 })),
          ]);
          const trainings = trainingsRes.items;
          const matches = matchesRes.items;
          setUpcomingEvent(findNextEvent(trainings, matches));

          const events: UpcomingEvent[] = [
            ...trainings.slice(0, 3).map((t): UpcomingEvent => ({ type: 'training', data: t })),
            ...matches.slice(0, 3).map((m): UpcomingEvent => ({ type: 'match', data: m })),
          ].sort((a, b) => new Date(a.data.startTime).getTime() - new Date(b.data.startTime).getTime()).slice(0, 3);
          setUpcomingEvents(events);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const getPerformanceBreakdown = () => {
    if (!ratingStats?.byCategory) return undefined;
    const { technical, tactical, physical, psychological } = ratingStats.byCategory;
    return [
      { label: 'Technical', value: technical ?? 0, maxValue: 10, color: 'bg-blue-500' },
      { label: 'Tactical', value: tactical ?? 0, maxValue: 10, color: 'bg-green-500' },
      { label: 'Physical', value: physical ?? 0, maxValue: 10, color: 'bg-red-500' },
      { label: 'Mental', value: psychological ?? 0, maxValue: 10, color: 'bg-purple-500' },
    ];
  };

  const getRatingTrendData = () => {
    if (!ratingStats?.history) return [];
    return ratingStats.history.map((point) => ({ date: point.date, rating: point.averageRating }));
  };

  // Quick actions based on role
  const quickActions = (() => {
    switch (user?.role) {
      case UserRole.COACH:
        return [
          { to: '/trainings', label: 'New Training', icon: <PlusIcon />, color: 'green' },
          { to: '/matches', label: 'New Match', icon: <PlusIcon />, color: 'blue' },
          { to: '/squads', label: 'Create Squad', icon: <SquadsIcon />, color: 'purple' },
          { to: '/stats/team', label: 'Team Statistics', icon: <StatsIcon />, color: 'amber' },
        ];
      case UserRole.ADMIN:
        return [
          { to: '/admin/users', label: 'Create User', icon: <PlusIcon />, color: 'green' },
          { to: '/admin/groups', label: 'Manage Groups', icon: <TeamIcon />, color: 'blue' },
          { to: '/trainings', label: 'View Trainings', icon: <TrainingsIcon />, color: 'purple' },
          { to: '/matches', label: 'View Matches', icon: <MatchesIcon />, color: 'amber' },
        ];
      case UserRole.PLAYER:
        return [
          { to: '/trainings', label: 'My Trainings', icon: <TrainingsIcon />, color: 'green' },
          { to: '/matches', label: 'My Matches', icon: <MatchesIcon />, color: 'blue' },
          { to: '/stats/my', label: 'My Statistics', icon: <StatsIcon />, color: 'purple' },
          { to: '/calendar', label: 'Calendar', icon: <ClockIcon />, color: 'amber' },
        ];
      case UserRole.PARENT:
        return [
          { to: '/trainings', label: 'View Trainings', icon: <TrainingsIcon />, color: 'green' },
          { to: '/matches', label: 'View Matches', icon: <MatchesIcon />, color: 'blue' },
          { to: '/stats/children', label: 'Children Stats', icon: <StatsIcon />, color: 'purple' },
          { to: '/calendar', label: 'Calendar', icon: <ClockIcon />, color: 'amber' },
        ];
      default:
        return [];
    }
  })();

  const colorClasses: Record<string, { bg: string; hover: string; icon: string }> = {
    green: { bg: 'bg-green-100 dark:bg-green-900/30', hover: 'hover:bg-green-50 dark:hover:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/40', icon: 'text-green-600 dark:text-green-400' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40', icon: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40', icon: 'text-purple-600 dark:text-purple-400' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/40', icon: 'text-amber-600 dark:text-amber-400' },
  };

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.firstName || 'User'}!`}
        subtitle="Here's what's happening today"
      />
      <PageContent>
        {/* Welcome Card with Next Event */}
        {upcomingEvent && (
          <Link
            to={upcomingEvent.type === 'training' ? `/trainings/${upcomingEvent.data.id}` : `/matches/${upcomingEvent.data.id}`}
            className="block bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-8 relative overflow-hidden hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-2">Next Event</h2>
              <p className="text-green-100 mb-4">
                {upcomingEvent.type === 'training' ? 'Training' : 'Match'} {getTimeUntil(upcomingEvent.data.startTime)}
              </p>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="text-green-200"><ClockIcon /></div>
                  <span className="font-medium">{formatEventTime(
                    upcomingEvent.data.startTime,
                    upcomingEvent.type === 'training'
                      ? getTrainingEndTime(upcomingEvent.data).toISOString()
                      : getMatchEndTime(upcomingEvent.data).toISOString()
                  )}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-green-200"><LocationIcon /></div>
                  <span className="font-medium">{upcomingEvent.data.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-green-200"><TeamIcon /></div>
                  <span className="font-medium">
                    {upcomingEvent.type === 'training'
                      ? upcomingEvent.data.group.name
                      : `vs ${(upcomingEvent.data as Match).opponent}`}
                  </span>
                </div>
              </div>
              <button className="mt-6 px-6 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors">
                View Details
              </button>
            </div>
          </Link>
        )}

        {/* Stats Grid - Player */}
        {user?.role === UserRole.PLAYER && playerStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<GoalsIcon />} value={playerStats.goals} label="Goals" color="green" />
            <StatCard icon={<PlayersIcon />} value={playerStats.assists} label="Assists" color="blue" />
            <StatCard icon={<MatchesIcon />} value={playerStats.matchesPlayed} label="Matches Played" color="purple" />
            <StatCard icon={<AttendanceIcon />} value={`${attendanceStats?.rate ?? 0}%`} label="Attendance" color="amber" />
          </div>
        )}

        {/* Stats Grid - Coach/Admin */}
        {(user?.role === UserRole.COACH || user?.role === UserRole.ADMIN) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<PlayersIcon />} value={childrenWithGroups.length || '-'} label="Players" color="green" />
            <StatCard icon={<GroupsIcon />} value="-" label="Groups" color="blue" />
            <StatCard icon={<TrainingsIcon />} value="-" label="Trainings" color="purple" />
            <StatCard icon={<MatchesIcon />} value="-" label="Matches" color="amber" />
          </div>
        )}

        {/* Performance Charts - Player */}
        {user?.role === UserRole.PLAYER && ratingStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PerformanceScoreRing
              score={Math.round((ratingStats?.averageRating ?? 0) * 10)}
              maxScore={100}
              breakdown={getPerformanceBreakdown()}
              loading={loading}
            />
            <RatingTrendChart data={getRatingTrendData()} loading={loading} />
          </div>
        )}

        {/* Children Attendance - Parent */}
        {user?.role === UserRole.PARENT && childrenStats.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Children Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childrenStats.map((child) => (
                  <div key={child.playerId} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <AttendanceIcon />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{child.playerName}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{child.rate}%</p>
                        {child.total > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {child.present} / {child.total} events
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <Card className="lg:col-span-2">
            <CardHeader action={<Link to="/calendar" className="text-sm text-green-600 hover:text-green-700 font-medium">View All</Link>}>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => {
                  const isTraining = event.type === 'training';
                  const isToday = new Date(event.data.startTime).toDateString() === new Date().toDateString();
                  return (
                    <Link
                      key={`${event.type}-${event.data.id}`}
                      to={isTraining ? `/trainings/${event.data.id}` : `/matches/${event.data.id}`}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                        isToday && index === 0
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isTraining ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {isTraining ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {isTraining ? `Training - ${event.data.group.name}` : `Match vs ${(event.data as Match).opponent}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatEventDate(event.data.startTime)}</p>
                      </div>
                      <Badge variant={isToday && index === 0 ? 'success' : isTraining ? 'default' : 'info'}>
                        {isToday && index === 0 ? 'Today' : isTraining ? 'Training' : 'Match'}
                      </Badge>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No upcoming events
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors group"
                >
                  <div className={`w-10 h-10 ${colorClasses[action.color].bg} ${colorClasses[action.color].hover} rounded-lg flex items-center justify-center transition-colors`}>
                    <span className={colorClasses[action.color].icon}>{action.icon}</span>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {action.label}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
