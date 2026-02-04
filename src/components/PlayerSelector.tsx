import type { PlayerInfo, GroupInfo, Filters } from '../hooks/usePlayerSelector';

interface PlayerSelectorProps {
  isLoading: boolean;
  players: PlayerInfo[];
  filteredPlayers: PlayerInfo[];
  groups: GroupInfo[];
  birthYears: number[];
  selectedIds: string[];
  filters: Filters;
  playersWithParentSelected: PlayerInfo[];
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onToggleSelection: (playerId: string) => void;
}

export function PlayerSelector({
  isLoading,
  players,
  filteredPlayers,
  groups,
  birthYears,
  selectedIds,
  filters,
  playersWithParentSelected,
  onFilterChange,
  onToggleSelection,
}: PlayerSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 dark:border-green-400"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading players...</span>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm py-2">
        No players available. You can create a parent without linking to players and link them later.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => onFilterChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <div>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange('year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          >
            <option value="">All years</option>
            {birthYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filters.groupId}
            onChange={(e) => onFilterChange('groupId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          >
            <option value="">All groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.noParentOnly}
          onChange={(e) => onFilterChange('noParentOnly', e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:bg-gray-800"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Only players without a parent</span>
      </label>

      <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
        {filteredPlayers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm py-2 text-center">
            No players match the filters
          </p>
        ) : (
          filteredPlayers.map((player) => (
            <label
              key={player.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                selectedIds.includes(player.id)
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-transparent'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(player.id)}
                onChange={() => onToggleSelection(player.id)}
                className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:bg-gray-800"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {player.firstName} {player.lastName}
                  </p>
                  {player.parent && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                      Has parent
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {player.position} | {new Date(player.dateOfBirth).getFullYear()}
                  {player.group && ` | ${player.group.name}`}
                </p>
                {player.parent && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Current parent: {player.parent.firstName} {player.parent.lastName}
                  </p>
                )}
              </div>
            </label>
          ))
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-green-600 dark:text-green-400">
            {selectedIds.length} player(s) selected
          </p>
          {playersWithParentSelected.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Warning: {playersWithParentSelected.length} selected player(s) will be reassigned from their current parent
              </p>
              <ul className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                {playersWithParentSelected.map((p) => (
                  <li key={p.id}>
                    {p.firstName} {p.lastName} (from {p.parent?.firstName} {p.parent?.lastName})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
