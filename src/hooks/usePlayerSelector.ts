import { useState, useEffect, useMemo, useCallback } from 'react';
import { usersApi, type PlayerInfo, type GroupInfo } from '../api/users';

interface Filters {
  name: string;
  year: string;
  groupId: string;
  noParentOnly: boolean;
}

interface ConfirmDialogState {
  isOpen: boolean;
  playerId: string;
  playerName: string;
  parentName: string;
}

const initialFilters: Filters = {
  name: '',
  year: '',
  groupId: '',
  noParentOnly: false,
};

const initialConfirmDialog: ConfirmDialogState = {
  isOpen: false,
  playerId: '',
  playerName: '',
  parentName: '',
};

export function usePlayerSelector(enabled: boolean) {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(initialConfirmDialog);

  useEffect(() => {
    if (!enabled) return;

    setIsLoading(true);
    Promise.all([usersApi.getPlayers(), usersApi.getGroups()])
      .then(([playersData, groupsData]) => {
        setPlayers(playersData);
        setGroups(groupsData);
      })
      .catch(() => {
        setPlayers([]);
        setGroups([]);
      })
      .finally(() => setIsLoading(false));
  }, [enabled]);

  const birthYears = useMemo(() => {
    const years = new Set<number>();
    players.forEach((p) => {
      const year = new Date(p.dateOfBirth).getFullYear();
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const matchesName = !filters.name || fullName.includes(filters.name.toLowerCase());
      const playerYear = new Date(player.dateOfBirth).getFullYear().toString();
      const matchesYear = !filters.year || playerYear === filters.year;
      const matchesGroup = !filters.groupId || player.group?.id === filters.groupId;
      const matchesNoParent = !filters.noParentOnly || !player.parent;
      return matchesName && matchesYear && matchesGroup && matchesNoParent;
    });
  }, [players, filters]);

  const playersWithParentSelected = useMemo(() => {
    return players.filter((p) => selectedIds.includes(p.id) && p.parent);
  }, [players, selectedIds]);

  const updateFilter = useCallback(<K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSelection = useCallback((playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    const isCurrentlySelected = selectedIds.includes(playerId);

    if (!isCurrentlySelected && player?.parent) {
      setConfirmDialog({
        isOpen: true,
        playerId,
        playerName: `${player.firstName} ${player.lastName}`,
        parentName: `${player.parent.firstName} ${player.parent.lastName}`,
      });
      return;
    }

    setSelectedIds((prev) =>
      isCurrentlySelected
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }, [players, selectedIds]);

  const confirmReassign = useCallback(() => {
    setSelectedIds((prev) => [...prev, confirmDialog.playerId]);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, [confirmDialog.playerId]);

  const cancelReassign = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const reset = useCallback(() => {
    setSelectedIds([]);
    setFilters(initialFilters);
  }, []);

  return {
    players,
    groups,
    selectedIds,
    isLoading,
    filters,
    filteredPlayers,
    birthYears,
    playersWithParentSelected,
    confirmDialog,
    updateFilter,
    toggleSelection,
    confirmReassign,
    cancelReassign,
    reset,
  };
}

export type { Filters, ConfirmDialogState, PlayerInfo, GroupInfo };
