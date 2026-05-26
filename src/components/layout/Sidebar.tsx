import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { UserRole } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

interface NavSection {
  label?: string;
  items: NavItem[];
  roles?: UserRole[];
}

const HomeIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const GroupsIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const TrainingsIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
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

const MatchesIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
    />
  </svg>
);

const StatsIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const TeamOfMonthIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3l2.3 4.66L19.5 8.4l-3.75 3.65.88 5.15L12 14.77 7.37 17.2l.88-5.15L4.5 8.4l5.2-.74L12 3z"
    />
  </svg>
);

const ObjectivesIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3l2.3 4.66L19.5 8.4l-3.75 3.65.88 5.15L12 14.77 7.37 17.2l.88-5.15L4.5 8.4l5.2-.74L12 3z"
    />
  </svg>
);

const SquadsIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
    />
  </svg>
);

const UsersIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const ContactsIcon = () => (
  <svg
    className="w-5 h-5 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const LogoutIcon = () => (
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
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

function getNavSections(role: UserRole, t: (key: string) => string): NavSection[] {
  const sections: NavSection[] = [
    {
      items: [{ to: '/dashboard', label: t('nav.dashboard'), icon: <HomeIcon /> }],
    },
  ];

  // Admin sees groups management
  if (role === UserRole.ADMIN) {
    sections[0].items.push({
      to: '/admin/groups',
      label: t('nav.groups'),
      icon: <GroupsIcon />,
    });
  }

  // Coach sees "My Groups"
  if (role === UserRole.COACH) {
    sections[0].items.push({
      to: '/my-groups',
      label: t('nav.myGroups'),
      icon: <GroupsIcon />,
    });
  }

  // Common items for all roles
  sections[0].items.push(
    { to: '/calendar', label: t('nav.calendar'), icon: <CalendarIcon /> },
    { to: '/trainings', label: t('nav.trainings'), icon: <TrainingsIcon /> },
    { to: '/matches', label: t('nav.matches'), icon: <MatchesIcon /> },
  );

  // Stats - different routes per role
  if (role === UserRole.PLAYER) {
    sections[0].items.push({
      to: '/stats/my',
      label: t('nav.myStatistics'),
      icon: <StatsIcon />,
    });
    sections[0].items.push({
      to: '/objectives/my',
      label: t('nav.myObjectives'),
      icon: <ObjectivesIcon />,
    });
  } else if (role === UserRole.PARENT) {
    sections[0].items.push({
      to: '/stats/children',
      label: t('nav.childrenStats'),
      icon: <StatsIcon />,
    });
  } else if (role === UserRole.COACH || role === UserRole.ADMIN) {
    sections[0].items.push({
      to: '/stats/team',
      label: t('nav.statistics'),
      icon: <StatsIcon />,
    });
    sections[0].items.push({
      to: '/objectives/manage',
      label: t('nav.objectives'),
      icon: <ObjectivesIcon />,
    });
  }

  sections[0].items.push({
    to: '/stats/team-of-month',
    label: t('nav.teamOfMonth'),
    icon: <TeamOfMonthIcon />,
  });

  // Coach features
  if (role === UserRole.COACH) {
    sections[0].items.push({ to: '/squads', label: t('nav.squads'), icon: <SquadsIcon /> });
  }

  // Contacts for all
  sections[0].items.push({
    to: '/contacts',
    label: t('nav.contacts'),
    icon: <ContactsIcon />,
  });

  // Admin section
  if (role === UserRole.ADMIN) {
    sections.push({
      label: t('nav.admin'),
      items: [{ to: '/admin/users', label: t('nav.users'), icon: <UsersIcon /> }],
    });
  }

  return sections;
}

function getUserInitials(firstName: string, lastName: string): string {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || 'U';
}

function getRoleLabel(role: UserRole, t: (key: string) => string): string {
  const labels: Record<UserRole, string> = {
    [UserRole.ADMIN]: t('roles.admin'),
    [UserRole.COACH]: t('roles.coach'),
    [UserRole.PLAYER]: t('roles.player'),
    [UserRole.PARENT]: t('roles.parent'),
  };
  return labels[role] || t('roles.user');
}
export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useI18n();

  if (!user) return null;

  const sections = getNavSections(user.role, t);
  const initials = getUserInitials(user.firstName, user.lastName);
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName?.[0] || ''}.`.trim()
    : user.email;

  return (
    /* 1. Changed to 'fixed' or 'absolute'
       2. Added z-50 to stay on top
       3. Dynamic width based on isExpanded
    */
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`fixed left-0 top-0 h-full z-50 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-xl transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo Section */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-white dark:bg-gray-800">
          <img
            src="/logo.png"
            alt="SquadKeeper logo"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Hide text when collapsed to prevent awkward wrapping */}
        <div
          className={`logo-text transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
        >
          <h1 className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
            {t('common.appName')}
          </h1>
          <p className="text-xs text-gray-400">{t('common.management')}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.label && isExpanded && (
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {section.label}
                </p>
              </div>
            )}
            {section.items.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to !== '/dashboard' &&
                  item.to !== '/stats/team' &&
                  location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  <span
                    className={`transition-opacity duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-all overflow-hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div
            className={`flex-1 min-w-0 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {getRoleLabel(user.role, t)}
            </p>
          </div>
          {isExpanded && (
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-500"
            >
              <LogoutIcon />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
