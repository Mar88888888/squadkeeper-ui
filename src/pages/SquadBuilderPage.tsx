import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupsApi, type GroupInfo } from '../api/groups';
import { squadsApi } from '../api/squads';
import { FootballPitch, FormatSelector, type PlayerData } from '../components/squad-builder';
import { GameFormat, DEFAULT_FORMATIONS } from '../constants/squad.constants';
import { Position, POSITION_LABELS } from '../constants/player.constants';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface SquadPositionState {
  id: string;
  playerId: string | null;
  player: PlayerData | null;
  role: Position;
  isStarter: boolean;
  orderIndex: number;
}

export function SquadBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [squadName, setSquadName] = useState('');
  const [gameFormat, setGameFormat] = useState<GameFormat>(GameFormat.ELEVEN_A_SIDE);
  const [positions, setPositions] = useState<SquadPositionState[]>([]);
  const [benchPlayers, setBenchPlayers] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data =
          user?.role === UserRole.ADMIN
            ? await groupsApi.getAll()
            : await groupsApi.getMy();
        setGroups(data);
        if (data.length > 0 && !isEditMode) {
          setSelectedGroupId(data[0].id);
        }
      } catch {
        setError('Failed to load groups');
      }
    };
    loadGroups();
  }, [user?.role, isEditMode]);

  useEffect(() => {
    const loadSquad = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const squad = await squadsApi.getOne(id);
        setSquadName(squad.name);
        setGameFormat(squad.gameFormat);
        setSelectedGroupId(squad.group.id);

        const starterPos: SquadPositionState[] = [];
        const benchList: PlayerData[] = [];

        squad.positions.forEach((pos) => {
          if (pos.isStarter) {
            starterPos.push({
              id: pos.id || crypto.randomUUID(),
              playerId: pos.player?.id || null,
              player: pos.player
                ? {
                    id: pos.player.id,
                    firstName: pos.player.firstName,
                    lastName: pos.player.lastName,
                    position: pos.player.position,
                  }
                : null,
              role: pos.role,
              isStarter: true,
              orderIndex: pos.orderIndex,
            });
          } else if (pos.player) {
            benchList.push({
              id: pos.player.id,
              firstName: pos.player.firstName,
              lastName: pos.player.lastName,
              position: pos.player.position,
            });
          }
        });

        setPositions(starterPos);
        setBenchPlayers(benchList);
      } catch {
        setError('Failed to load squad');
      } finally {
        setIsLoading(false);
      }
    };
    loadSquad();
  }, [id]);

  const groupPlayers = useMemo(() => {
    const group = groups.find((g) => g.id === selectedGroupId);
    if (!group) return [];
    return group.players.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      position: p.position as Position,
      dateOfBirth: p.dateOfBirth,
    }));
  }, [groups, selectedGroupId]);

  const assignedPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    positions.forEach((p) => {
      if (p.playerId) ids.add(p.playerId);
    });
    benchPlayers.forEach((p) => ids.add(p.id));
    return ids;
  }, [positions, benchPlayers]);

  const availablePlayers = useMemo(() => {
    return groupPlayers.filter((p) => !assignedPlayerIds.has(p.id));
  }, [groupPlayers, assignedPlayerIds]);

  const initializeFormation = useCallback((format: GameFormat) => {
    const defaultPositions = DEFAULT_FORMATIONS[format];
    setPositions(
      defaultPositions.map((pos, index) => ({
        id: crypto.randomUUID(),
        playerId: null,
        player: null,
        role: pos.role,
        isStarter: true,
        orderIndex: index,
      })),
    );
    setBenchPlayers([]);
  }, []);

  const handleFormatChange = (format: GameFormat) => {
    setGameFormat(format);

    const currentPlayers = positions
      .filter((p) => p.player)
      .map((p) => p.player!);

    const newFormation = DEFAULT_FORMATIONS[format];
    const newPositionCount = newFormation.length;

    const playersForField = currentPlayers.slice(0, newPositionCount);
    const playersForBench = currentPlayers.slice(newPositionCount);

    const newPositions = newFormation.map((pos, index) => ({
      id: crypto.randomUUID(),
      playerId: playersForField[index]?.id || null,
      player: playersForField[index] || null,
      role: pos.role,
      isStarter: true,
      orderIndex: index,
    }));

    setPositions(newPositions);

    if (playersForBench.length > 0) {
      setBenchPlayers((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newBenchPlayers = playersForBench.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newBenchPlayers];
      });
    }
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    initializeFormation(gameFormat);
  };

  const handlePositionClick = (positionId: string) => {
    const position = positions.find((p) => p.id === positionId);
    if (!position) return;

    if (position.playerId) {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === positionId ? { ...p, playerId: null, player: null } : p
        )
      );
    } else {
      setSelectedPositionId(positionId);
    }
  };

  const handleAssignPlayer = (player: PlayerData) => {
    if (!selectedPositionId) return;

    setPositions((prev) =>
      prev.map((p) =>
        p.id === selectedPositionId
          ? { ...p, playerId: player.id, player }
          : p
      )
    );
    setSelectedPositionId(null);
  };

  const handleAddToBench = (player: PlayerData) => {
    setBenchPlayers((prev) => [...prev, player]);
  };

  const handleRemoveFromBench = (playerId: string) => {
    setBenchPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  const handleSave = async () => {
    if (!squadName.trim()) {
      setError('Squad name is required');
      return;
    }
    if (!selectedGroupId) {
      setError('Please select a group');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const positionsData = [
        ...positions.map((pos) => ({
          playerId: pos.playerId,
          role: pos.role,
          isStarter: true,
          orderIndex: pos.orderIndex,
        })),
        ...benchPlayers.map((player, index) => ({
          playerId: player.id,
          role: player.position,
          isStarter: false,
          orderIndex: index,
        })),
      ];

      if (isEditMode && id) {
        await squadsApi.update(id, { name: squadName, gameFormat });
        await squadsApi.updatePositions(id, { positions: positionsData });
      } else {
        await squadsApi.create({
          name: squadName,
          gameFormat,
          groupId: selectedGroupId,
          positions: positionsData,
        });
      }

      navigate('/squads');
    } catch {
      setError('Failed to save squad');
    } finally {
      setIsSaving(false);
    }
  };

  const getPositionColor = (role: Position | null) => {
    if (!role) return 'bg-gray-500';
    switch (role) {
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
      default:
        return 'bg-red-500';
    }
  };

  const getPositionCoords = (orderIndex: number) => {
    const formation = DEFAULT_FORMATIONS[gameFormat];
    if (orderIndex < formation.length) {
      return { x: formation[orderIndex].x, y: formation[orderIndex].y };
    }
    return { x: 50, y: 50 };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const filledPositions = positions.filter((p) => p.playerId).length;
  const totalPositions = positions.length;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Squad' : 'Create Squad'}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Squad'}
            </button>
            <button
              onClick={() => navigate('/squads')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Available Players</h3>

              {availablePlayers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">All players assigned</p>
              ) : (
                <div className="space-y-2">
                  {availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getPositionColor(player.position)}`}
                      >
                        {player.firstName[0]}{player.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{POSITION_LABELS[player.position]}</p>
                      </div>
                      <button
                        onClick={() => handleAddToBench(player)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        + Bench
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Squad Name *
                  </label>
                  <input
                    type="text"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    placeholder="e.g., Main XI, Cup Squad"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleGroupChange(e.target.value)}
                    disabled={isEditMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Select group...</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} ({group.players.length} players)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Game Format
                </label>
                <FormatSelector value={gameFormat} onChange={handleFormatChange} />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Starters: {filledPositions} / {totalPositions}
                </span>
                <button
                  onClick={() => initializeFormation(gameFormat)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Reset Formation
                </button>
              </div>
            </div>

            <FootballPitch>
              {positions.map((pos) => {
                const coords = getPositionCoords(pos.orderIndex);
                return (
                <div
                  key={pos.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                  }}
                  onClick={() => handlePositionClick(pos.id)}
                >
                  {pos.player ? (
                    <div className="flex flex-col items-center group">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white ${getPositionColor(pos.player.position)}`}
                      >
                        {pos.player.firstName[0]}{pos.player.lastName[0]}
                      </div>
                      <div className="mt-1 px-1.5 py-0.5 bg-black/70 rounded text-white text-[10px] font-medium whitespace-nowrap">
                        {pos.player.lastName}
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs items-center justify-center hidden group-hover:flex">
                        ×
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
                        <span className="text-white/80 text-xs font-bold">+</span>
                      </div>
                      <div className="mt-1 px-1.5 py-0.5 bg-black/40 rounded text-white/80 text-[10px] font-medium">
                        {pos.role}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </FootballPitch>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                Substitutes ({benchPlayers.length})
              </h4>
              {benchPlayers.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm">No substitutes added</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {benchPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-950 rounded-lg"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getPositionColor(player.position)}`}
                      >
                        {player.firstName[0]}{player.lastName[0]}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {player.firstName} {player.lastName}
                      </span>
                      <button
                        onClick={() => handleRemoveFromBench(player.id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Squad Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Format</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{gameFormat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Starters</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{filledPositions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Substitutes</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{benchPlayers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Empty Slots</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{totalPositions - filledPositions}</span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Starting Lineup</h4>
                <div className="space-y-1">
                  {positions
                    .filter((p) => p.player)
                    .map((pos) => (
                      <div
                        key={pos.id}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <span className="text-gray-900 dark:text-gray-100">
                          {pos.player?.firstName[0]}. {pos.player?.lastName}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{pos.role}</span>
                      </div>
                    ))}
                  {filledPositions === 0 && (
                    <p className="text-gray-400 dark:text-gray-500 text-sm">Click positions to assign players</p>
                  )}
                </div>
              </div>

              {benchPlayers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Substitutes</h4>
                  <div className="space-y-1">
                    {benchPlayers.map((player) => (
                      <div key={player.id} className="text-sm py-1 text-gray-600 dark:text-gray-400">
                        {player.firstName[0]}. {player.lastName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedPositionId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  Select Player for {positions.find((p) => p.id === selectedPositionId)?.role}
                </h2>
                <button
                  onClick={() => setSelectedPositionId(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {availablePlayers.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No available players. Remove a player from another position first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availablePlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handleAssignPlayer(player)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-colors text-left"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getPositionColor(player.position)}`}
                        >
                          {player.firstName[0]}{player.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{POSITION_LABELS[player.position]}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
