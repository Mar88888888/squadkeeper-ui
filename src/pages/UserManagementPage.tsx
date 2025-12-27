import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, type PlayerInfo, type GroupInfo } from '../api/users';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type {
  CreateCoachRequest,
  CreatePlayerRequest,
  CreateParentRequest,
} from '../types';

type UserType = 'coach' | 'player' | 'parent';

interface ConfirmDialogState {
  isOpen: boolean;
  playerId: string;
  playerName: string;
  parentName: string;
}

export function UserManagementPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>('coach');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Coach-specific fields
  const [licenseLevel, setLicenseLevel] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);

  // Player-specific fields
  const [position, setPosition] = useState('');
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [strongFoot, setStrongFoot] = useState('right');

  // Parent-specific fields
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // Player filters
  const [filterName, setFilterName] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterGroupId, setFilterGroupId] = useState('');
  const [filterNoParent, setFilterNoParent] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    playerId: '',
    playerName: '',
    parentName: '',
  });

  // Load players and groups when parent tab is selected
  useEffect(() => {
    if (userType === 'parent') {
      setLoadingPlayers(true);
      Promise.all([usersApi.getPlayers(), usersApi.getGroups()])
        .then(([playersData, groupsData]) => {
          setPlayers(playersData);
          setGroups(groupsData);
        })
        .catch(() => {
          setPlayers([]);
          setGroups([]);
        })
        .finally(() => setLoadingPlayers(false));
    }
  }, [userType]);

  // Get unique birth years from players
  const birthYears = useMemo(() => {
    const years = new Set<number>();
    players.forEach((p) => {
      const year = new Date(p.dateOfBirth).getFullYear();
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [players]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const matchesName = !filterName || fullName.includes(filterName.toLowerCase());
      const playerYear = new Date(player.dateOfBirth).getFullYear().toString();
      const matchesYear = !filterYear || playerYear === filterYear;
      const matchesGroup = !filterGroupId || player.group?.id === filterGroupId;
      const matchesNoParent = !filterNoParent || !player.parent;
      return matchesName && matchesYear && matchesGroup && matchesNoParent;
    });
  }, [players, filterName, filterYear, filterGroupId, filterNoParent]);

  const toggleChildSelection = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    const isCurrentlySelected = selectedChildrenIds.includes(playerId);

    // If selecting (not deselecting) and player has existing parent, show confirm dialog
    if (!isCurrentlySelected && player?.parent) {
      setConfirmDialog({
        isOpen: true,
        playerId,
        playerName: `${player.firstName} ${player.lastName}`,
        parentName: `${player.parent.firstName} ${player.parent.lastName}`,
      });
      return;
    }

    setSelectedChildrenIds((prev) =>
      isCurrentlySelected
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleConfirmReassign = useCallback(() => {
    setSelectedChildrenIds((prev) => [...prev, confirmDialog.playerId]);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, [confirmDialog.playerId]);

  const handleCancelReassign = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setDateOfBirth('');
    setLicenseLevel('');
    setExperienceYears(0);
    setPosition('');
    setHeight(170);
    setWeight(70);
    setStrongFoot('right');
    setSelectedChildrenIds([]);
    setFilterName('');
    setFilterYear('');
    setFilterGroupId('');
    setFilterNoParent(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (userType === 'coach') {
        const data: CreateCoachRequest = {
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          dateOfBirth,
          licenseLevel,
          experienceYears,
        };
        await usersApi.createCoach(data);
        setSuccess(`Coach ${firstName} ${lastName} created successfully!`);
      } else if (userType === 'player') {
        const data: CreatePlayerRequest = {
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          dateOfBirth,
          position,
          height,
          weight,
          strongFoot,
        };
        await usersApi.createPlayer(data);
        setSuccess(`Player ${firstName} ${lastName} created successfully!`);
      } else {
        const data: CreateParentRequest = {
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
          childrenIds: selectedChildrenIds.length > 0 ? selectedChildrenIds : undefined,
        };
        await usersApi.createParent(data);
        const childrenCount = selectedChildrenIds.length;
        setSuccess(
          `Parent ${firstName} ${lastName} created successfully!` +
            (childrenCount > 0 ? ` Linked to ${childrenCount} player(s).` : '')
        );
      }
      resetForm();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const userTypeLabels: Record<UserType, string> = {
    coach: 'Coach',
    player: 'Player',
    parent: 'Parent',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New User</h2>

          {/* User Type Selector */}
          <div className="flex space-x-2 mb-6">
            {(['coach', 'player', 'parent'] as UserType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setUserType(type);
                  setError('');
                  setSuccess('');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  userType === type
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {userTypeLabels[type]}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Coach-specific fields */}
            {userType === 'coach' && (
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Coach Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Level *
                    </label>
                    <select
                      value={licenseLevel}
                      onChange={(e) => setLicenseLevel(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select level</option>
                      <option value="D">D License</option>
                      <option value="C">C License</option>
                      <option value="B">B License</option>
                      <option value="A">A License</option>
                      <option value="PRO">PRO License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience (years) *
                    </label>
                    <input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                      required
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Player-specific fields */}
            {userType === 'player' && (
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Player Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position *
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select position</option>
                      <option value="GK">Goalkeeper</option>
                      <option value="CB">Center Back</option>
                      <option value="LB">Left Back</option>
                      <option value="RB">Right Back</option>
                      <option value="CDM">Defensive Midfielder</option>
                      <option value="CM">Central Midfielder</option>
                      <option value="CAM">Attacking Midfielder</option>
                      <option value="LW">Left Winger</option>
                      <option value="RW">Right Winger</option>
                      <option value="ST">Striker</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                      required
                      min={100}
                      max={250}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                      required
                      min={30}
                      max={150}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strong Foot *
                    </label>
                    <select
                      value={strongFoot}
                      onChange={(e) => setStrongFoot(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Parent-specific fields */}
            {userType === 'parent' && (
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Link to Players (Children)</h3>
                {loadingPlayers ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-gray-600">Loading players...</span>
                  </div>
                ) : players.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">
                    No players available. You can create a parent without linking to players and link them later.
                  </p>
                ) : (
                  <>
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Search by name..."
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                      <div>
                        <select
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
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
                          value={filterGroupId}
                          onChange={(e) => setFilterGroupId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
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

                    {/* No parent filter */}
                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterNoParent}
                        onChange={(e) => setFilterNoParent(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">
                        Only players without a parent
                      </span>
                    </label>

                    {/* Player list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {filteredPlayers.length === 0 ? (
                        <p className="text-gray-500 text-sm py-2 text-center">
                          No players match the filters
                        </p>
                      ) : (
                        filteredPlayers.map((player) => (
                          <label
                            key={player.id}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedChildrenIds.includes(player.id)
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedChildrenIds.includes(player.id)}
                              onChange={() => toggleChildSelection(player.id)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {player.firstName} {player.lastName}
                                </p>
                                {player.parent && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                                    Has parent
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {player.position} | {new Date(player.dateOfBirth).getFullYear()}
                                {player.group && ` | ${player.group.name}`}
                              </p>
                              {player.parent && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Current parent: {player.parent.firstName} {player.parent.lastName}
                                </p>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </>
                )}
                {selectedChildrenIds.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-green-600">
                      {selectedChildrenIds.length} player(s) selected
                    </p>
                    {(() => {
                      const playersWithParent = players.filter(
                        (p) => selectedChildrenIds.includes(p.id) && p.parent
                      );
                      if (playersWithParent.length > 0) {
                        return (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm font-medium text-amber-800">
                              Warning: {playersWithParent.length} selected player(s) will be reassigned from their current parent
                            </p>
                            <ul className="mt-1 text-xs text-amber-700">
                              {playersWithParent.map((p) => (
                                <li key={p.id}>
                                  {p.firstName} {p.lastName} (from {p.parent?.firstName} {p.parent?.lastName})
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : (
                `Create ${userTypeLabels[userType]}`
              )}
            </button>
          </form>
        </div>
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Reassign Player"
        message={`${confirmDialog.playerName} is already linked to "${confirmDialog.parentName}".\n\nDo you want to reassign this player to the new parent?`}
        confirmLabel="Reassign"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleConfirmReassign}
        onCancel={handleCancelReassign}
      />
    </div>
  );
}
