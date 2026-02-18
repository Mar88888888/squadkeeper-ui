type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
type AvatarColor = 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'gray';

interface AvatarProps {
  initials?: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
  color?: AvatarColor;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
};

const colorStyles: Record<AvatarColor, string> = {
  amber: 'from-amber-400 to-orange-500 shadow-amber-500/25',
  green: 'from-green-400 to-emerald-500 shadow-green-500/25',
  blue: 'from-blue-400 to-indigo-500 shadow-blue-500/25',
  purple: 'from-purple-400 to-violet-500 shadow-purple-500/25',
  red: 'from-red-400 to-rose-500 shadow-red-500/25',
  gray: 'from-gray-400 to-gray-500 shadow-gray-500/25',
};

export function Avatar({ initials, src, alt, size = 'md', color = 'amber', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`${sizeStyles[size]} rounded-xl object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeStyles[size]}
        bg-gradient-to-br ${colorStyles[color]}
        rounded-xl flex items-center justify-center shadow-md flex-shrink-0
        ${className}
      `}
    >
      <span className="font-bold text-white">{initials || 'U'}</span>
    </div>
  );
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || 'U';
}
