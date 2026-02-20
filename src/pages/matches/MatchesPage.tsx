import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesApi, type Match } from '../../api/matches';
import { groupsApi, type GroupInfo } from '../../api/groups';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { PageHeader, PageContent } from '../../components/layout';
import { Card, Button, Modal, Tabs, EmptyState } from '../../components/ui';

// Icons
const WinIcon = () => (
  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const DrawIcon = () => (
  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const LossIcon = () => (
  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const GoalsIcon = () => (
  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
  </svg>
);

// Team colors for initials
const teamColors = [
  'from-green-500 to-emerald-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-violet-600',
  'from-blue-500 to-indigo-600',
  'from-red-500 to-rose-600',
  'from-teal-500 to-cyan-600',
  'from-pink-500 to-fuchsia-600',
];

function getTeamColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return teamColors[hash % teamColors.length];
}

function getTeamInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type ViewTab = 'upcoming' | 'completed';

export function MatchesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ViewTab>('upcoming');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    groupId: '',
    startTime: '',
    duration: 90,
    location: '',
    opponent: '',
    isHome: true,
  });

  const canCreate = user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const isAdmin = user?.role === UserRole.ADMIN;
      const [matchesData, groupsData] = await Promise.all([
        isAdmin ? matchesApi.getAll() : matchesApi.getMy(),
        isAdmin ? groupsApi.getAll() : groupsApi.getMy(),
      ]);
      setMatches(matchesData);
      setGroups(groupsData);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Computed stats
  const stats = useMemo(() => {
    const result = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
    matches.forEach(match => {
      if (match.homeGoals === null || match.awayGoals === null) return;
      const ourGoals = match.isHome ? match.homeGoals : match.awayGoals;
      const theirGoals = match.isHome ? match.awayGoals : match.homeGoals;
      result.goalsFor += ourGoals;
      result.goalsAgainst += theirGoals;
      if (ourGoals > theirGoals) result.wins++;
      else if (ourGoals < theirGoals) result.losses++;
      else result.draws++;
    });
    return result;
  }, [matches]);

  // Filtered and sorted matches
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Filter by group
    if (filterGroupId) {
      result = result.filter(m => m.group.id === filterGroupId);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.opponent.toLowerCase().includes(query) ||
        m.group.name.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query)
      );
    }

    // Filter by result
    if (resultFilter) {
      result = result.filter(m => {
        if (m.homeGoals === null || m.awayGoals === null) {
          return resultFilter === 'upcoming';
        }
        const ourGoals = m.isHome ? m.homeGoals : m.awayGoals;
        const theirGoals = m.isHome ? m.awayGoals : m.homeGoals;
        if (resultFilter === 'win') return ourGoals > theirGoals;
        if (resultFilter === 'draw') return ourGoals === theirGoals;
        if (resultFilter === 'loss') return ourGoals < theirGoals;
        return true;
      });
    }

    // Split by upcoming/completed
    const now = new Date();
    if (activeTab === 'upcoming') {
      result = result.filter(m => new Date(m.startTime) > now || (m.homeGoals === null && m.awayGoals === null));
    } else {
      result = result.filter(m => m.homeGoals !== null && m.awayGoals !== null);
    }

    // Sort
    return result.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  }, [matches, filterGroupId, searchQuery, resultFilter, activeTab]);

  const openCreateModal = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    startTime.setMinutes(0, 0, 0);

    setFormData({
      groupId: groups[0]?.id || '',
      startTime: formatDateTimeLocal(startTime),
      duration: 90,
      location: '',
      opponent: '',
      isHome: true,
    });
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleCreate = async () => {
    if (!formData.groupId) {
      setError('Please select a group');
      return;
    }
    if (!formData.startTime) {
      setError('Please set start time');
      return;
    }
    if (!formData.location.trim()) {
      setError('Please enter a location');
      return;
    }
    if (!formData.opponent.trim()) {
      setError('Please enter opponent name');
      return;
    }

    const start = new Date(formData.startTime);

    try {
      const newMatch = await matchesApi.create({
        groupId: formData.groupId,
        startTime: start.toISOString(),
        durationMinutes: formData.duration,
        location: formData.location,
        opponent: formData.opponent,
        isHome: formData.isHome,
      });
      setMatches(prev => [...prev, newMatch]);
      closeModal();
    } catch {
      setError('Failed to create match');
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatMatchDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) + ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMatchResult = (match: Match): 'win' | 'draw' | 'loss' | null => {
    if (match.homeGoals === null || match.awayGoals === null) return null;
    const ourGoals = match.isHome ? match.homeGoals : match.awayGoals;
    const theirGoals = match.isHome ? match.awayGoals : match.homeGoals;
    if (ourGoals > theirGoals) return 'win';
    if (ourGoals < theirGoals) return 'loss';
    return 'draw';
  };

  const resultBorderColors = {
    win: 'from-green-500 to-emerald-600',
    draw: 'from-amber-500 to-yellow-600',
    loss: 'from-red-500 to-rose-600',
  };

  const resultBadgeColors = {
    win: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    draw: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    loss: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <>
      <PageHeader
        title="Matches"
        subtitle="Manage games and results"
        actions={canCreate && <Button onClick={openCreateModal}>New Match</Button>}
      />

      <PageContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                <WinIcon />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.wins}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Wins</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl flex items-center justify-center">
                <DrawIcon />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.draws}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Draws</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl flex items-center justify-center">
                <LossIcon />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.losses}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Losses</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center">
                <GoalsIcon />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.goalsFor}:{stats.goalsAgainst}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Goals (for:against)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search matches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-gray-900 dark:text-white"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </div>
              </div>
            </div>
            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-gray-900 dark:text-white"
            >
              <option value="">All groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-gray-900 dark:text-white"
            >
              <option value="">All results</option>
              <option value="win">Wins</option>
              <option value="draw">Draws</option>
              <option value="loss">Losses</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as ViewTab)}
          />
        </div>

        {/* Error */}
        {error && !isModalOpen && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Matches List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <Card>
            <EmptyState
              title={activeTab === 'upcoming' ? 'No upcoming matches' : 'No completed matches'}
              description={
                activeTab === 'upcoming'
                  ? 'Schedule your first match to get started.'
                  : 'Completed matches will appear here.'
              }
              action={
                activeTab === 'upcoming' && canCreate ? (
                  <Button onClick={openCreateModal}>Schedule Match</Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => {
              const result = getMatchResult(match);
              const isUpcoming = result === null;
              const ourTeam = match.group.name;
              const ourGoals = match.isHome ? match.homeGoals : match.awayGoals;
              const theirGoals = match.isHome ? match.awayGoals : match.homeGoals;

              return (
                <button
                  key={match.id}
                  onClick={() => navigate(`/matches/${match.id}`)}
                  className="block w-full text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <div className="flex">
                    {/* Color border for completed matches */}
                    {result && (
                      <div className={`w-2 bg-gradient-to-b ${resultBorderColors[result]}`}></div>
                    )}
                    <div className="flex-1 p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-full">
                            {match.group.name}
                          </span>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            match.isHome
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          }`}>
                            {match.isHome ? 'Home' : 'Away'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatMatchDate(match.startTime)}
                          </span>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          isUpcoming
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : resultBadgeColors[result!]
                        }`}>
                          {isUpcoming ? 'Scheduled' : result!.charAt(0).toUpperCase() + result!.slice(1)}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="flex items-center justify-between">
                        {/* Our Team */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-16 h-16 bg-gradient-to-br ${getTeamColor(ourTeam)} rounded-xl flex items-center justify-center shadow-lg`}>
                            <span className="text-lg font-bold text-white">{getTeamInitials(ourTeam)}</span>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{ourTeam}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{match.isHome ? 'Home' : 'Away'}</p>
                          </div>
                        </div>

                        {/* Score / VS */}
                        <div className="px-8">
                          {isUpcoming ? (
                            <div className="text-2xl font-bold text-gray-300 dark:text-gray-600">VS</div>
                          ) : (
                            <div className="flex items-center gap-4">
                              <span className={`text-4xl font-bold ${
                                result === 'win' ? 'text-green-600 dark:text-green-400' :
                                result === 'draw' ? 'text-amber-500' : 'text-gray-400'
                              }`}>
                                {ourGoals}
                              </span>
                              <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">:</span>
                              <span className={`text-4xl font-bold ${
                                result === 'loss' ? 'text-red-500' :
                                result === 'draw' ? 'text-amber-500' : 'text-gray-400'
                              }`}>
                                {theirGoals}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Opponent */}
                        <div className="flex items-center gap-4 flex-1 justify-end text-right">
                          <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{match.opponent}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{match.isHome ? 'Away' : 'Home'}</p>
                          </div>
                          <div className={`w-16 h-16 bg-gradient-to-br ${getTeamColor(match.opponent)} rounded-xl flex items-center justify-center shadow-lg`}>
                            <span className="text-lg font-bold text-white">{getTeamInitials(match.opponent)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <LocationIcon />
                            {match.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ClockIcon />
                            {formatTime(match.startTime)}
                          </span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 font-medium group-hover:underline">
                          View details
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PageContent>

      {/* Create Match Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="New Match"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Our Team
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => setFormData((prev) => ({ ...prev, groupId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select team</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opponent
              </label>
              <input
                type="text"
                value={formData.opponent}
                onChange={(e) => setFormData((prev) => ({ ...prev, opponent: e.target.value }))}
                placeholder="Opponent team name"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Home / Away
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isHome"
                  checked={formData.isHome}
                  onChange={() => setFormData((prev) => ({ ...prev, isHome: true }))}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Home</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isHome"
                  checked={!formData.isHome}
                  onChange={() => setFormData((prev) => ({ ...prev, isHome: false }))}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Away</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={150}>2.5 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Stadium or field name"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {error && isModalOpen && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="flex-1">
              Create Match
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
