import { UserRole } from '../types';

/**
 * Centralized color system for the Football Academy app.
 *
 * Color Philosophy:
 * - Primary (Green): Main brand color, represents football/pitch
 * - Accent (Amber): Highlights, awards, special elements
 * - Semantic: Red (errors), Amber (warnings), Green (success)
 * - Roles: Used ONLY for badges, not for general styling
 */

// Role badge colors - only use for role badges/tags
export const roleColors: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
  [UserRole.COACH]: 'bg-blue-100 text-blue-800',
  [UserRole.PLAYER]: 'bg-green-100 text-green-800',
  [UserRole.PARENT]: 'bg-amber-100 text-amber-800',
};

// Event type colors for calendar
export const eventColors = {
  training: {
    bg: 'bg-green-500',
    text: 'text-white',
    dot: 'bg-green-500',
    lightDot: 'bg-green-300',
  },
  match: {
    bg: 'bg-blue-500',
    text: 'text-white',
    dot: 'bg-blue-500',
    lightDot: 'bg-blue-300',
  },
} as const;

// Dashboard card styling - unified approach
export const cardStyles = {
  // Default card (green primary)
  default: {
    bg: 'bg-gray-50 hover:bg-green-50',
    iconBg: 'bg-green-100 group-hover:bg-green-200',
    iconText: 'text-green-600',
    linkText: 'text-green-600 group-hover:text-green-700',
  },
  // Accent card (amber) - for special/highlighted items
  accent: {
    bg: 'bg-gray-50 hover:bg-amber-50',
    iconBg: 'bg-amber-100 group-hover:bg-amber-200',
    iconText: 'text-amber-600',
    linkText: 'text-amber-600 group-hover:text-amber-700',
  },
  // Secondary card (for matches - keeps blue for visual distinction)
  secondary: {
    bg: 'bg-gray-50 hover:bg-blue-50',
    iconBg: 'bg-blue-100 group-hover:bg-blue-200',
    iconText: 'text-blue-600',
    linkText: 'text-blue-600 group-hover:text-blue-700',
  },
  // Stats card (non-interactive)
  stats: {
    bg: 'bg-gray-50',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
} as const;
