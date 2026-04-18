import { UserRole } from '../types';

/**
 * Centralized color system for the SquadKeeper app.
 *
 * Color Philosophy:
 * - Primary (Green): Main brand color, represents football/pitch
 * - Accent (Amber): Highlights, awards, special elements
 * - Semantic: Red (errors), Amber (warnings), Green (success)
 * - Roles: Used ONLY for badges, not for general styling
 *
 * Dark mode support:
 * - All colors include dark: variants for seamless theme switching
 * - Light backgrounds use translucent dark variants (e.g., dark:bg-green-900/30)
 */

// Role badge colors - only use for role badges/tags
export const roleColors: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  [UserRole.COACH]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [UserRole.PLAYER]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [UserRole.PARENT]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

// Event type colors for calendar
export const eventColors = {
  training: {
    bg: 'bg-green-500',
    text: 'text-white',
    dot: 'bg-green-500',
    lightDot: 'bg-green-300 dark:bg-green-400',
  },
  match: {
    bg: 'bg-blue-500',
    text: 'text-white',
    dot: 'bg-blue-500',
    lightDot: 'bg-blue-300 dark:bg-blue-400',
  },
} as const;

// Dashboard card styling - unified approach with dark mode support
export const cardStyles = {
  // Default card (green primary)
  default: {
    bg: 'bg-gray-50 hover:bg-green-50 dark:bg-gray-800 dark:hover:bg-green-900/20',
    iconBg: 'bg-green-100 group-hover:bg-green-200 dark:bg-green-900/30 dark:group-hover:bg-green-900/50',
    iconText: 'text-green-600 dark:text-green-400',
    linkText: 'text-green-600 group-hover:text-green-700 dark:text-green-400 dark:group-hover:text-green-300',
  },
  // Accent card (amber) - for special/highlighted items
  accent: {
    bg: 'bg-gray-50 hover:bg-amber-50 dark:bg-gray-800 dark:hover:bg-amber-900/20',
    iconBg: 'bg-amber-100 group-hover:bg-amber-200 dark:bg-amber-900/30 dark:group-hover:bg-amber-900/50',
    iconText: 'text-amber-600 dark:text-amber-400',
    linkText: 'text-amber-600 group-hover:text-amber-700 dark:text-amber-400 dark:group-hover:text-amber-300',
  },
  // Secondary card (for matches - keeps blue for visual distinction)
  secondary: {
    bg: 'bg-gray-50 hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20',
    iconBg: 'bg-blue-100 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50',
    iconText: 'text-blue-600 dark:text-blue-400',
    linkText: 'text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300',
  },
  // Stats card (non-interactive)
  stats: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconText: 'text-amber-600 dark:text-amber-400',
  },
} as const;
