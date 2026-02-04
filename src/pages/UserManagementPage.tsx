import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlayerSelector } from '../components/PlayerSelector';
import { useUserForm, type UserType } from '../hooks/useUserForm';
import { usePlayerSelector } from '../hooks/usePlayerSelector';
import {
  POSITIONS,
  POSITION_LABELS,
  STRONG_FEET,
  STRONG_FOOT_LABELS,
  Position,
  StrongFoot,
} from '../constants/player.constants';

const USER_TYPE_LABELS: Record<UserType, string> = {
  coach: 'Coach',
  player: 'Player',
  parent: 'Parent',
};

export function UserManagementPage() {
  const navigate = useNavigate();
  const {
    form,
    ui,
    updateField,
    setUserType,
    setLoading,
    setError,
    setSuccess,
    resetForm,
    getCoachData,
    getPlayerData,
    getParentData,
  } = useUserForm();

  const playerSelector = usePlayerSelector(form.userType === 'parent');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (form.userType === 'coach') {
        await usersApi.createCoach(getCoachData());
        setSuccess(`Coach ${form.firstName} ${form.lastName} created successfully!`);
      } else if (form.userType === 'player') {
        await usersApi.createPlayer(getPlayerData());
        setSuccess(`Player ${form.firstName} ${form.lastName} created successfully!`);
      } else {
        await usersApi.createParent(getParentData(playerSelector.selectedIds));
        const childrenCount = playerSelector.selectedIds.length;
        setSuccess(
          `Parent ${form.firstName} ${form.lastName} created successfully!` +
            (childrenCount > 0 ? ` Linked to ${childrenCount} player(s).` : '')
        );
      }
      resetForm();
      playerSelector.reset();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }, [form, playerSelector, getCoachData, getPlayerData, getParentData, resetForm, setLoading, setError, setSuccess]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">User Management</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-6">Create New User</h2>

          <UserTypeSelector
            currentType={form.userType}
            onSelect={setUserType}
          />

          {ui.error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-gray-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {ui.error}
            </div>
          )}

          {ui.success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-gray-700 text-green-700 dark:text-green-400 rounded-lg text-sm">
              {ui.success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <CommonFields form={form} updateField={updateField} />

            {form.userType === 'coach' && (
              <CoachFields form={form} updateField={updateField} />
            )}

            {form.userType === 'player' && (
              <PlayerFields form={form} updateField={updateField} />
            )}

            {form.userType === 'parent' && (
              <div className="border-t dark:border-gray-700 pt-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Link to Players (Children)</h3>
                <PlayerSelector
                  isLoading={playerSelector.isLoading}
                  players={playerSelector.players}
                  filteredPlayers={playerSelector.filteredPlayers}
                  groups={playerSelector.groups}
                  birthYears={playerSelector.birthYears}
                  selectedIds={playerSelector.selectedIds}
                  filters={playerSelector.filters}
                  playersWithParentSelected={playerSelector.playersWithParentSelected}
                  onFilterChange={playerSelector.updateFilter}
                  onToggleSelection={playerSelector.toggleSelection}
                />
              </div>
            )}

            <SubmitButton
              isLoading={ui.isLoading}
              label={`Create ${USER_TYPE_LABELS[form.userType]}`}
            />
          </form>
        </div>
      </main>

      <ConfirmDialog
        isOpen={playerSelector.confirmDialog.isOpen}
        title="Reassign Player"
        message={`${playerSelector.confirmDialog.playerName} is already linked to "${playerSelector.confirmDialog.parentName}".\n\nDo you want to reassign this player to the new parent?`}
        confirmLabel="Reassign"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={playerSelector.confirmReassign}
        onCancel={playerSelector.cancelReassign}
      />
    </div>
  );
}

// Sub-components to keep JSX clean

interface UserTypeSelectorProps {
  currentType: UserType;
  onSelect: (type: UserType) => void;
}

function UserTypeSelector({ currentType, onSelect }: UserTypeSelectorProps) {
  return (
    <div className="flex space-x-2 mb-6">
      {(['coach', 'player', 'parent'] as UserType[]).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            currentType === type
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {USER_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}

interface FieldProps {
  form: ReturnType<typeof useUserForm>['form'];
  updateField: ReturnType<typeof useUserForm>['updateField'];
}

function CommonFields({ form, updateField }: FieldProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password *
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => updateField('phoneNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
    </>
  );
}

function CoachFields({ form, updateField }: FieldProps) {
  return (
    <div className="border-t dark:border-gray-700 pt-4">
      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Coach Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            License Level *
          </label>
          <select
            value={form.licenseLevel}
            onChange={(e) => updateField('licenseLevel', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Experience (years) *
          </label>
          <input
            type="number"
            value={form.experienceYears}
            onChange={(e) => updateField('experienceYears', parseInt(e.target.value) || 0)}
            required
            min={0}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>
    </div>
  );
}

function PlayerFields({ form, updateField }: FieldProps) {
  return (
    <div className="border-t dark:border-gray-700 pt-4">
      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Player Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position *
          </label>
          <select
            value={form.position}
            onChange={(e) => updateField('position', e.target.value as Position)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Select position</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {POSITION_LABELS[pos]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Height (cm) *
          </label>
          <input
            type="number"
            value={form.height}
            onChange={(e) => updateField('height', parseInt(e.target.value) || 0)}
            required
            min={100}
            max={250}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Weight (kg) *
          </label>
          <input
            type="number"
            value={form.weight}
            onChange={(e) => updateField('weight', parseInt(e.target.value) || 0)}
            required
            min={30}
            max={150}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Strong Foot *
          </label>
          <select
            value={form.strongFoot}
            onChange={(e) => updateField('strongFoot', e.target.value as StrongFoot)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-800 dark:text-gray-100"
          >
            {STRONG_FEET.map((foot) => (
              <option key={foot} value={foot}>
                {STRONG_FOOT_LABELS[foot]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

interface SubmitButtonProps {
  isLoading: boolean;
  label: string;
}

function SubmitButton({ isLoading, label }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        label
      )}
    </button>
  );
}
