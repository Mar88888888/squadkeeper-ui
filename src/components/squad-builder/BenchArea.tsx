import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { PlayerCard, type PlayerData } from './PlayerCard';

interface BenchPosition {
  id: string;
  player: PlayerData;
  orderIndex: number;
}

interface BenchAreaProps {
  benchPlayers: BenchPosition[];
  onRemovePlayer: (playerId: string) => void;
}

export const BenchArea: React.FC<BenchAreaProps> = ({
  benchPlayers,
  onRemovePlayer,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'bench',
    data: {
      type: 'bench',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        p-4 rounded-lg border-2 border-dashed transition-colors min-h-[120px]
        ${
          isOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Substitutes ({benchPlayers.length})
        </h4>
      </div>

      {benchPlayers.length === 0 ? (
        <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
          Drag players here to add substitutes
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {benchPlayers
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((benchPos) => (
              <PlayerCard
                key={benchPos.id}
                player={benchPos.player}
                variant="bench"
                onRemove={() => onRemovePlayer(benchPos.player.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default BenchArea;
