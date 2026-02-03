import { Link } from 'react-router-dom';
import type { Training } from '../../api/trainings';
import type { Match } from '../../api/matches';

interface ChildWithGroup {
  id: string;
  firstName: string;
  lastName: string;
  groupId: string | null;
}

type EventWithChildren =
  | { type: 'training'; data: Training; children: string[] }
  | { type: 'match'; data: Match; children: string[] };

interface ParentUpcomingEventsProps {
  trainings: Training[];
  matches: Match[];
  children: ChildWithGroup[];
  loading?: boolean;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
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

function buildGroupToChildrenMap(children: ChildWithGroup[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const child of children) {
    if (child.groupId) {
      const names = map.get(child.groupId) || [];
      names.push(`${child.firstName} ${child.lastName}`);
      map.set(child.groupId, names);
    }
  }
  return map;
}

function getUpcomingEventsWithChildren(
  trainings: Training[],
  matches: Match[],
  groupToChildren: Map<string, string[]>,
  allChildrenNames: string[]
): EventWithChildren[] {
  const now = new Date();
  const events: EventWithChildren[] = [];
  const hasMapping = groupToChildren.size > 0;
  const singleChild = allChildrenNames.length === 1;

  for (const training of trainings) {
    if (new Date(training.startTime) > now) {
      let children = groupToChildren.get(training.group.id) || [];
      // Fallback: if no mapping but single child, show their name
      // If no mapping and multiple children, show group name as identifier
      if (children.length === 0) {
        if (singleChild) {
          children = allChildrenNames;
        } else if (!hasMapping) {
          children = [training.group.name];
        }
      }
      if (children.length > 0) {
        events.push({ type: 'training', data: training, children });
      }
    }
  }

  for (const match of matches) {
    if (new Date(match.startTime) > now) {
      let children = groupToChildren.get(match.group.id) || [];
      if (children.length === 0) {
        if (singleChild) {
          children = allChildrenNames;
        } else if (!hasMapping) {
          children = [match.group.name];
        }
      }
      if (children.length > 0) {
        events.push({ type: 'match', data: match, children });
      }
    }
  }

  // Sort by start time
  events.sort((a, b) =>
    new Date(a.data.startTime).getTime() - new Date(b.data.startTime).getTime()
  );

  return events;
}

function EventCard({ event }: { event: EventWithChildren }) {
  const isTraining = event.type === 'training';
  const data = event.data;
  const linkTo = isTraining ? `/trainings/${data.id}` : `/matches/${data.id}`;
  const childrenText = event.children.join(', ');

  return (
    <Link
      to={linkTo}
      className="block bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-5 text-white hover:from-green-700 hover:to-green-600 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
            {isTraining ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm text-white/70">Next {isTraining ? 'Training' : 'Match'}</p>
            <p className="font-semibold text-lg">
              {isTraining
                ? data.group.name
                : `vs ${(data as Match).opponent}`
              }
            </p>
          </div>
        </div>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
          {getTimeUntil(data.startTime)}
        </span>
      </div>

      {/* Children names */}
      <div className="mt-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm text-white/90">{childrenText}</span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-white/80">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatEventDate(data.startTime)}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {data.location}
        </span>
      </div>

      {!isTraining && (
        <div className="mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            (data as Match).isHome
              ? 'bg-white/20 text-white'
              : 'bg-amber-400/20 text-amber-100'
          }`}>
            {(data as Match).isHome ? 'Home' : 'Away'}
          </span>
        </div>
      )}
    </Link>
  );
}

function CompactEventCard({ event }: { event: EventWithChildren }) {
  const isTraining = event.type === 'training';
  const data = event.data;
  const linkTo = isTraining ? `/trainings/${data.id}` : `/matches/${data.id}`;
  const childrenText = event.children.join(', ');

  return (
    <Link
      to={linkTo}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-green-200 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isTraining ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {isTraining ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">{isTraining ? 'Training' : 'Match'}</p>
            <p className="font-medium text-gray-900 text-sm">
              {isTraining ? data.group.name : `vs ${(data as Match).opponent}`}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-500">{getTimeUntil(data.startTime)}</span>
      </div>

      <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>{childrenText}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatEventDate(data.startTime)}
        </span>
      </div>
    </Link>
  );
}

export function ParentUpcomingEvents({ trainings, matches, children, loading }: ParentUpcomingEventsProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-5 text-white">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-24 mb-3"></div>
          <div className="h-6 bg-white/20 rounded w-48 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const groupToChildren = buildGroupToChildrenMap(children);
  const allChildrenNames = children.map(c => `${c.firstName} ${c.lastName}`);
  const eventsWithChildren = getUpcomingEventsWithChildren(trainings, matches, groupToChildren, allChildrenNames);

  if (eventsWithChildren.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-600 to-gray-500 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-white/70">No upcoming events</p>
            <p className="font-semibold">Your children's schedule is clear</p>
          </div>
        </div>
      </div>
    );
  }

  // If only one event or all events are for the same children at the same time, show single hero
  if (eventsWithChildren.length === 1) {
    return <EventCard event={eventsWithChildren[0]} />;
  }

  // Multiple events - show hero for first, grid for rest
  const [firstEvent, ...restEvents] = eventsWithChildren;
  const maxRestEvents = 3; // Limit to avoid overwhelming the UI

  return (
    <div className="space-y-4">
      <EventCard event={firstEvent} />

      {restEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">More upcoming events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {restEvents.slice(0, maxRestEvents).map((event, index) => (
              <CompactEventCard key={`${event.type}-${event.data.id}-${index}`} event={event} />
            ))}
          </div>
          {restEvents.length > maxRestEvents && (
            <Link
              to="/calendar"
              className="mt-3 inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              View all events
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
