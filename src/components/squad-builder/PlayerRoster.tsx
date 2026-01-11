import React, { useState, useMemo } from 'react';
import { PlayerCard, type PlayerData } from './PlayerCard';
import { type Position, POSITION_GROUPS } from '../../constants/player.constants';

interface PlayerRosterProps {
  players: PlayerData[];
  assignedPlayerIds: Set<string>;
}

export const PlayerRoster: React.FC<PlayerRosterProps> = ({
  players,
  assignedPlayerIds,
}) => {
  const [filter, setFilter] = useState<'all' | 'gk' | 'def' | 'mid' | 'fwd'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = useMemo(() => {
    let result = players;

    if (filter !== 'all') {
      const positionGroup =
        filter === 'gk'
          ? POSITION_GROUPS.GOALKEEPER
          : filter === 'def'
            ? POSITION_GROUPS.DEFENDER
            : filter === 'mid'
              ? POSITION_GROUPS.MIDFIELDER
              : POSITION_GROUPS.FORWARD;

      result = result.filter((p) => positionGroup.includes(p.position as Position));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(term) ||
          p.lastName.toLowerCase().includes(term),
      );
    }

    return result;
  }, [players, filter, searchTerm]);

  const availablePlayers = filteredPlayers.filter(
    (p) => !assignedPlayerIds.has(p.id),
  );
  const usedPlayers = filteredPlayers.filter((p) => assignedPlayerIds.has(p.id));

  const filterButtons = [
    { key: 'all' as const, label: 'All' },
    { key: 'gk' as const, label: 'GK' },
    { key: 'def' as const, label: 'DEF' },
    { key: 'mid' as const, label: 'MID' },
    { key: 'fwd' as const, label: 'FWD' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Players</h3>

        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
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
        </div>

        <div className="flex gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`
                flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors
                ${
                  filter === btn.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {availablePlayers.length === 0 && usedPlayers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No players found</p>
          </div>
        ) : (
          <>
            {availablePlayers.map((player) => (
              <PlayerCard key={player.id} player={player} variant="roster" />
            ))}

            {usedPlayers.length > 0 && (
              <>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider pt-4 pb-2">
                  Already in squad
                </div>
                {usedPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    variant="roster"
                    disabled
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Available: {availablePlayers.length}</span>
          <span>In squad: {assignedPlayerIds.size}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerRoster;
