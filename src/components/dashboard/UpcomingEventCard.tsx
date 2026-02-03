import { Link } from 'react-router-dom';
import type { Training } from '../../api/trainings';
import type { Match } from '../../api/matches';

type UpcomingEvent =
  | { type: 'training'; data: Training }
  | { type: 'match'; data: Match };

interface UpcomingEventCardProps {
  event: UpcomingEvent | null;
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

export function UpcomingEventCard({ event, loading }: UpcomingEventCardProps) {
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

  if (!event) {
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
            <p className="font-semibold">Your schedule is clear</p>
          </div>
        </div>
      </div>
    );
  }

  const isTraining = event.type === 'training';
  const data = event.data;
  const linkTo = isTraining ? `/trainings/${data.id}` : `/matches/${data.id}`;

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
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
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

      <div className="mt-4 flex items-center gap-4 text-sm text-white/80">
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
