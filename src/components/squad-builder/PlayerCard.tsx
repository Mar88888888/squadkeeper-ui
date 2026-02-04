import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Position, POSITION_LABELS } from '../../constants/player.constants';

export interface PlayerData {
  id: string;
  firstName: string;
  lastName: string;
  position: Position;
  dateOfBirth?: string;
}

interface PlayerCardProps {
  player: PlayerData;
  variant?: 'roster' | 'pitch' | 'bench';
  role?: Position | null;
  onRemove?: () => void;
  disabled?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  variant = 'roster',
  role,
  onRemove,
  disabled = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: player.id,
      data: {
        type: 'player',
        player,
      },
      disabled,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getInitials = () => {
    return `${player.firstName[0]}${player.lastName[0]}`.toUpperCase();
  };

  const getPositionColor = (pos: Position) => {
    switch (pos) {
      case Position.GK:
        return 'bg-yellow-500';
      case Position.CB:
      case Position.LB:
      case Position.RB:
        return 'bg-blue-500';
      case Position.CDM:
      case Position.CM:
      case Position.CAM:
        return 'bg-green-500';
      case Position.LW:
      case Position.RW:
      case Position.ST:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (variant === 'pitch') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`
          flex flex-col items-center cursor-grab active:cursor-grabbing
          ${isDragging ? 'opacity-50 z-50' : 'z-10'}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            text-white font-bold text-sm shadow-lg border-2 border-white
            ${getPositionColor(player.position)}
          `}
        >
          {getInitials()}
        </div>
        <div className="mt-1 px-1.5 py-0.5 bg-black/70 rounded text-white text-[10px] font-medium whitespace-nowrap">
          {player.lastName}
        </div>
        {role && (
          <div className="px-1 py-0.5 bg-white/90 dark:bg-gray-800/90 rounded text-gray-700 dark:text-gray-300 text-[9px] font-medium">
            {role}
          </div>
        )}
        {onRemove && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  if (variant === 'bench') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`
          flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
          cursor-grab active:cursor-grabbing
          ${isDragging ? 'opacity-50' : ''}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            text-white font-bold text-xs
            ${getPositionColor(player.position)}
          `}
        >
          {getInitials()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {player.firstName} {player.lastName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{POSITION_LABELS[player.position]}</div>
        </div>
        {onRemove && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-800' : ''}
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          text-white font-bold text-sm
          ${getPositionColor(player.position)}
        `}
      >
        {getInitials()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {player.firstName} {player.lastName}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{POSITION_LABELS[player.position]}</div>
      </div>
      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-950 px-2 py-1 rounded">
        {player.position}
      </div>
    </div>
  );
};

export default PlayerCard;
