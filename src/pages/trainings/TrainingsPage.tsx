import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PageHeader, PageContent } from '../../components/layout';
import {
  Button,
  Card,
  Badge,
  Modal,
  Tabs,
  EmptyState,
} from '../../components/ui';
import {
  trainingsApi,
  getTrainingEndTime,
  type Training,
  type TrainingTimeFilter,
  type TrainingFilters,
} from '../../api/trainings';
import { groupsApi, type GroupInfo } from '../../api/groups';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const TIME_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
];

const PlusIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const TrainingIcon = () => (
  <svg
    className="w-7 h-7"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

function groupTrainingsByDate(
  trainings: Training[],
): Record<string, Training[]> {
  const grouped: Record<string, Training[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  trainings.forEach((training) => {
    const date = new Date(training.startTime);
    const dateStr = date.toDateString();
    let key: string;

    if (dateStr === today) {
      key = 'Today';
    } else if (dateStr === tomorrowStr) {
      key = 'Tomorrow';
    } else {
      key = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(training);
  });

  return grouped;
}

export function TrainingsPage() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<TrainingTimeFilter>('upcoming');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalTrainings, setTotalTrainings] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    groupId: '',
    startTime: '',
    duration: 90,
    location: '',
    topic: '',
  });

  const canCreate =
    user?.role === UserRole.ADMIN || user?.role === UserRole.COACH;

  const buildFilters = useCallback((): TrainingFilters => {
    const filters: TrainingFilters = {};
    if (timeFilter !== 'all') filters.timeFilter = timeFilter;
    if (dateFrom) filters.dateFrom = formatDateForApi(dateFrom);
    if (dateTo) filters.dateTo = formatDateForApi(dateTo);
    return filters;
  }, [timeFilter, dateFrom, dateTo]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const isAdmin = user?.role === UserRole.ADMIN;
      const filters = buildFilters();
      filters.groupId = filterGroupId || undefined;
      filters.search = searchQuery || undefined;
      filters.skip = (currentPage - 1) * itemsPerPage;
      filters.take = itemsPerPage;
      const [trainingsData, groupsData] = await Promise.all([
        isAdmin ? trainingsApi.getAll(filters) : trainingsApi.getMy(filters),
        isAdmin ? groupsApi.getAll() : groupsApi.getMy(),
      ]);
      setTrainings(trainingsData.items);
      setTotalTrainings(trainingsData.total);
      setGroups(groupsData);
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user, buildFilters, filterGroupId, searchQuery, currentPage]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const groupedTrainings = groupTrainingsByDate(trainings);
  const totalPages = Math.ceil(totalTrainings / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterGroupId, timeFilter, dateFrom, dateTo, searchQuery]);

  const openCreateModal = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    startTime.setMinutes(0, 0, 0);

    setFormData({
      groupId: groups[0]?.id || '',
      startTime: formatDateTimeLocal(startTime),
      duration: 90,
      location: '',
      topic: '',
    });
    setIsModalOpen(true);
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

    const start = new Date(formData.startTime);

    try {
      const newTraining = await trainingsApi.create({
        groupId: formData.groupId,
        startTime: start.toISOString(),
        durationMinutes: formData.duration,
        location: formData.location,
        topic: formData.topic,
      });
      setTrainings((prev) => [newTraining, ...prev]);
      setIsModalOpen(false);
      loadData();
    } catch {
      setError('Failed to create training');
    }
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  return (
    <>
      <PageHeader
        title="Trainings"
        subtitle="Manage training sessions"
        actions={
          canCreate && (
            <Button onClick={openCreateModal} icon={<PlusIcon />}>
              New Training
            </Button>
          )
        }
      />
      <PageContent>
        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search trainings..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <SearchIcon />
                  </div>
                </div>
              </div>
              <select
                value={filterGroupId}
                onChange={(e) => {
                  setFilterGroupId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:text-white"
              >
                <option value="">All groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <DatePicker
                selected={dateFrom}
                onChange={(date: Date | null) => {
                  setDateFrom(date);
                  if (date) setTimeFilter('all');
                  setCurrentPage(1);
                }}
                selectsStart
                startDate={dateFrom}
                endDate={dateTo}
                maxDate={dateTo || undefined}
                dateFormat="MMM d, yyyy"
                placeholderText="From date"
                className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 w-36 dark:text-white"
                isClearable
              />
              <DatePicker
                selected={dateTo}
                onChange={(date: Date | null) => {
                  setDateTo(date);
                  if (date) setTimeFilter('all');
                  setCurrentPage(1);
                }}
                selectsEnd
                startDate={dateFrom}
                endDate={dateTo}
                minDate={dateFrom || undefined}
                dateFormat="MMM d, yyyy"
                placeholderText="To date"
                className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 w-36 dark:text-white"
                isClearable
              />
            </div>
          </div>
        </Card>

        {/* Time Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <Tabs
            tabs={TIME_FILTER_OPTIONS}
            activeTab={timeFilter}
            onChange={(id) => {
              setTimeFilter(id as TrainingTimeFilter);
              setDateFrom(null);
              setDateTo(null);
              setCurrentPage(1);
            }}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found:{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {totalTrainings}
            </span>{' '}
            trainings
          </p>
        </div>

        {/* Error */}
        {error && !isModalOpen && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Trainings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : trainings.length === 0 ? (
          <EmptyState
            title={
              totalTrainings === 0
                ? 'No trainings scheduled'
                : 'No trainings found'
            }
            description={
              totalTrainings === 0
                ? 'Start by scheduling your first training session.'
                : 'No trainings match your current filters.'
            }
            action={
              canCreate && totalTrainings === 0 ? (
                <Button onClick={openCreateModal}>Schedule Training</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTrainings).map(
              ([dateLabel, dateTrainings]) => (
                <div key={dateLabel}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {dateLabel}
                  </h3>
                  <div className="space-y-3">
                    {dateTrainings.map((training) => (
                      <Link
                        key={training.id}
                        to={`/trainings/${training.id}`}
                        className={`block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group ${
                          !isUpcoming(training.startTime) ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="flex">
                          <div
                            className={`w-2 ${isUpcoming(training.startTime) ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                          />
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                    isUpcoming(training.startTime)
                                      ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
                                      : 'bg-gray-100 dark:bg-gray-800'
                                  }`}
                                >
                                  <span
                                    className={
                                      isUpcoming(training.startTime)
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-400'
                                    }
                                  >
                                    <TrainingIcon />
                                  </span>
                                </div>
                                <div>
                                  <h4
                                    className={`text-lg font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${
                                      isUpcoming(training.startTime)
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                                  >
                                    Training Session
                                  </h4>
                                  {training.topic && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Topic: {training.topic}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                      <ClockIcon />
                                      {formatTime(training.startTime)} -{' '}
                                      {formatTime(
                                        getTrainingEndTime(
                                          training,
                                        ).toISOString(),
                                      )}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                      <LocationIcon />
                                      {training.location}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="info">
                                  {training.group.name}
                                </Badge>
                                <Badge
                                  variant={
                                    isUpcoming(training.startTime)
                                      ? 'success'
                                      : 'default'
                                  }
                                >
                                  {isUpcoming(training.startTime)
                                    ? 'Planned'
                                    : 'Completed'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            )}

            {totalPages > 1 && (
              <Card>
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, totalTrainings)} of {totalTrainings} trainings
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-green-500 text-white'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </PageContent>

      {/* Create Training Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Training"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Training</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topic (optional)
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, topic: e.target.value }))
              }
              placeholder="e.g., Ball control & passing drills"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group *
            </label>
            <select
              value={formData.groupId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, groupId: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                min={formatDateTimeLocal(new Date())}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration *
              </label>
              <select
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
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
              Location *
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select location</option>
              <option value="Main Field">Main Field</option>
              <option value="Training Field 2">Training Field 2</option>
              <option value="Gym">Gym</option>
              <option value="Indoor Arena">Indoor Arena</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
