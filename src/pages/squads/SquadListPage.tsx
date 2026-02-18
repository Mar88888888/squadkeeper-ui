import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi, type GroupInfo } from '../../api/groups';
import { squadsApi, type Squad } from '../../api/squads';
import { GAME_FORMAT_LABELS } from '../../constants/squad.constants';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageContent } from '../../components/layout/PageContent';
import { Card, Modal, Button, EmptyState } from '../../components/ui';

export function SquadListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    squadId: string;
    squadName: string;
  }>({ isOpen: false, squadId: '', squadName: '' });
  const [duplicateDialog, setDuplicateDialog] = useState<{
    isOpen: boolean;
    squadId: string;
    newName: string;
  }>({ isOpen: false, squadId: '', newName: '' });

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data =
          user?.role === UserRole.ADMIN
            ? await groupsApi.getAll()
            : await groupsApi.getMy();
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      } catch {
        setError('Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };
    loadGroups();
  }, [user?.role]);

  useEffect(() => {
    const loadSquads = async () => {
      if (!selectedGroupId) {
        setSquads([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await squadsApi.getByGroup(selectedGroupId);
        setSquads(data);
      } catch {
        setError('Failed to load squads');
      } finally {
        setIsLoading(false);
      }
    };
    loadSquads();
  }, [selectedGroupId]);

  const handleDelete = async () => {
    try {
      await squadsApi.delete(deleteDialog.squadId);
      setSquads((prev) => prev.filter((s) => s.id !== deleteDialog.squadId));
      setDeleteDialog({ isOpen: false, squadId: '', squadName: '' });
    } catch {
      setError('Failed to delete squad');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateDialog.newName.trim()) {
      setError('Please enter a name for the duplicate');
      return;
    }
    try {
      const newSquad = await squadsApi.duplicate(
        duplicateDialog.squadId,
        duplicateDialog.newName,
      );
      setSquads((prev) => [newSquad, ...prev]);
      setDuplicateDialog({ isOpen: false, squadId: '', newName: '' });
    } catch {
      setError('Failed to duplicate squad');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const NoSquadsIcon = () => (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );

  const SelectGroupIcon = () => (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  return (
    <>
      <PageHeader
        title="Squads"
        subtitle="Team formations and lineups"
        actions={
          <Button onClick={() => navigate('/squads/new')}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Squad
          </Button>
        }
      />

      <PageContent>
        {/* Group Selector */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Group
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full md:w-64 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select a group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.players.length} players)
              </option>
            ))}
          </select>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : !selectedGroupId ? (
          <Card>
            <EmptyState
              icon={<SelectGroupIcon />}
              title="Select a group"
              description="Choose a group from the dropdown above to view and manage squads."
            />
          </Card>
        ) : squads.length === 0 ? (
          <Card>
            <EmptyState
              icon={<NoSquadsIcon />}
              title="No squads created"
              description="Create your first squad to start planning your team formations."
              action={
                <Button onClick={() => navigate('/squads/new')}>
                  Create Squad
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {squads.map((squad) => {
              const starterCount = squad.positions.filter((p) => p.isStarter).length;
              const filledCount = squad.positions.filter(
                (p) => p.isStarter && p.player,
              ).length;
              const benchCount = squad.positions.filter(
                (p) => !p.isStarter && p.player,
              ).length;

              return (
                <Card key={squad.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white">
                    <h3 className="font-bold text-lg">{squad.name}</h3>
                    <p className="text-green-100 text-sm">
                      {GAME_FORMAT_LABELS[squad.gameFormat]}
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-gray-500 dark:text-gray-400">Players</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {filledCount}/{starterCount} starters
                        {benchCount > 0 && ` + ${benchCount} subs`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {squad.positions
                        .filter((p) => p.player)
                        .slice(0, 6)
                        .map((pos) => (
                          <span
                            key={pos.id}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {pos.player!.lastName}
                          </span>
                        ))}
                      {squad.positions.filter((p) => p.player).length > 6 && (
                        <span className="px-2 py-0.5 text-gray-400 dark:text-gray-500 text-xs">
                          +{squad.positions.filter((p) => p.player).length - 6} more
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                      {squad.createdBy && (
                        <span>
                          By {squad.createdBy.firstName} {squad.createdBy.lastName} •{' '}
                        </span>
                      )}
                      Updated {formatDate(squad.updatedAt)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/squads/${squad.id}`)}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-md shadow-green-500/25 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDuplicateDialog({
                            isOpen: true,
                            squadId: squad.id,
                            newName: `${squad.name} (Copy)`,
                          })
                        }
                        className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        title="Duplicate"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            squadId: squad.id,
                            squadName: squad.name,
                          })
                        }
                        className="px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContent>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Squad"
        message={`Are you sure you want to delete "${deleteDialog.squadName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, squadId: '', squadName: '' })}
      />

      {/* Duplicate Modal */}
      <Modal
        isOpen={duplicateDialog.isOpen}
        onClose={() => setDuplicateDialog({ isOpen: false, squadId: '', newName: '' })}
        title="Duplicate Squad"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Squad Name
            </label>
            <input
              type="text"
              value={duplicateDialog.newName}
              onChange={(e) =>
                setDuplicateDialog((prev) => ({ ...prev, newName: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                setDuplicateDialog({ isOpen: false, squadId: '', newName: '' })
              }
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <Button onClick={handleDuplicate} className="flex-1">
              Duplicate
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
