import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  analyticsApi,
  type PerformanceSettings,
  type PositionExpectation,
} from '../../api/analytics';
import { POSITIONS, type Position } from '../../constants/player.constants';

const POSITION_LABELS: Record<Position, string> = {
  GK: 'Goalkeeper',
  CB: 'Center Back',
  LB: 'Left Back',
  RB: 'Right Back',
  CDM: 'Defensive Mid',
  CM: 'Central Mid',
  CAM: 'Attacking Mid',
  LW: 'Left Wing',
  RW: 'Right Wing',
  ST: 'Striker',
};

function WeightSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}%</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${color}`}></div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

function PositionExpectationRow({
  position,
  expectation,
  onChange,
}: {
  position: Position;
  expectation: PositionExpectation;
  onChange: (expectation: PositionExpectation) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="font-medium text-gray-900 dark:text-gray-100">{POSITION_LABELS[position]}</div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Goals/Match</label>
        <input
          type="number"
          step="0.05"
          min="0"
          max="2"
          value={expectation.expectedGoalsPerMatch}
          onChange={(e) =>
            onChange({
              ...expectation,
              expectedGoalsPerMatch: parseFloat(e.target.value) || 0,
            })
          }
          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Assists/Match</label>
        <input
          type="number"
          step="0.05"
          min="0"
          max="2"
          value={expectation.expectedAssistsPerMatch}
          onChange={(e) =>
            onChange({
              ...expectation,
              expectedAssistsPerMatch: parseFloat(e.target.value) || 0,
            })
          }
          className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
    </div>
  );
}

export function PerformanceSettingsPage() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [settings, setSettings] = useState<PerformanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [skillWeight, setSkillWeight] = useState(35);
  const [offenseWeight, setOffenseWeight] = useState(35);
  const [defenseWeight, setDefenseWeight] = useState(15);
  const [teamWeight, setTeamWeight] = useState(15);
  const [positionExpectations, setPositionExpectations] = useState<
    Record<Position, PositionExpectation>
  >({} as Record<Position, PositionExpectation>);

  const [otherGroups, setOtherGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedSourceGroup, setSelectedSourceGroup] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!groupId) return;
      setIsLoading(true);
      setError('');
      try {
        const [settingsData, groupsData] = await Promise.all([
          analyticsApi.getSettings(groupId),
          analyticsApi.getMyGroups(),
        ]);
        setSettings(settingsData);
        setSkillWeight(settingsData.skillWeight);
        setOffenseWeight(settingsData.offenseWeight);
        setDefenseWeight(settingsData.defenseWeight);
        setTeamWeight(settingsData.teamWeight);
        setPositionExpectations(settingsData.positionExpectations);
        setOtherGroups(groupsData.filter((g) => g.id !== groupId));
      } catch {
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [groupId]);

  const totalWeight = skillWeight + offenseWeight + defenseWeight + teamWeight;
  const isValid = totalWeight === 100;

  const handleSave = async () => {
    if (!groupId || !isValid) return;
    setIsSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const updated = await analyticsApi.updateSettings(groupId, {
        skillWeight,
        offenseWeight,
        defenseWeight,
        teamWeight,
        positionExpectations,
      });
      setSettings(updated);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!groupId) return;
    if (!confirm('Are you sure you want to reset to default settings?')) return;
    setIsSaving(true);
    setError('');
    try {
      const data = await analyticsApi.resetSettings(groupId);
      setSettings(data);
      setSkillWeight(data.skillWeight);
      setOffenseWeight(data.offenseWeight);
      setDefenseWeight(data.defenseWeight);
      setTeamWeight(data.teamWeight);
      setPositionExpectations(data.positionExpectations);
      setSuccessMessage('Settings reset to defaults!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Failed to reset settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyFromGroup = async () => {
    if (!groupId || !selectedSourceGroup) return;
    const sourceGroup = otherGroups.find((g) => g.id === selectedSourceGroup);
    if (!confirm(`Copy settings from ${sourceGroup?.name}? This will overwrite current settings.`)) {
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const data = await analyticsApi.copySettings(groupId, selectedSourceGroup);
      setSettings(data);
      setSkillWeight(data.skillWeight);
      setOffenseWeight(data.offenseWeight);
      setDefenseWeight(data.defenseWeight);
      setTeamWeight(data.teamWeight);
      setPositionExpectations(data.positionExpectations);
      setSuccessMessage(`Settings copied from ${sourceGroup?.name}!`);
      setSelectedSourceGroup('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Failed to copy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePositionExpectation = (
    position: Position,
    expectation: PositionExpectation
  ) => {
    setPositionExpectations((prev) => ({
      ...prev,
      [position]: expectation,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Performance Settings</h1>
            {settings && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{settings.groupName}</p>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {otherGroups.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
              Copy from Another Group
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Copy settings from one of your other groups to use as a starting point.
            </p>
            <div className="flex gap-3">
              <select
                value={selectedSourceGroup}
                onChange={(e) => setSelectedSourceGroup(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Select a group...</option>
                {otherGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCopyFromGroup}
                disabled={!selectedSourceGroup || isSaving}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  selectedSourceGroup && !isSaving
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
            Component Weights
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Adjust how much each component contributes to the overall performance
            score. Weights must sum to 100%.
          </p>

          <div className="space-y-6">
            <WeightSlider
              label="Skill (Coach Evaluations)"
              value={skillWeight}
              onChange={setSkillWeight}
              color="bg-yellow-500"
            />
            <WeightSlider
              label="Offense (Goals + Assists)"
              value={offenseWeight}
              onChange={setOffenseWeight}
              color="bg-green-500"
            />
            <WeightSlider
              label="Defense (Clean Sheets)"
              value={defenseWeight}
              onChange={setDefenseWeight}
              color="bg-cyan-500"
            />
            <WeightSlider
              label="Team (Win Rate + Participation)"
              value={teamWeight}
              onChange={setTeamWeight}
              color="bg-blue-500"
            />
          </div>

          <div
            className={`mt-6 p-4 rounded-lg ${
              isValid ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Weight</span>
              <span
                className={`text-xl font-bold ${
                  isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalWeight}%
              </span>
            </div>
            {!isValid && (
              <p className="text-sm text-red-600 mt-1">
                Weights must sum to exactly 100%
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
            Position Expectations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Set expected goals and assists per match for each position. Players
            are scored based on how well they meet these expectations.
          </p>

          <div className="space-y-1">
            {POSITIONS.map((position) => (
              <PositionExpectationRow
                key={position}
                position={position}
                expectation={
                  positionExpectations[position] || {
                    expectedGoalsPerMatch: 0,
                    expectedAssistsPerMatch: 0,
                  }
                }
                onChange={(exp) => updatePositionExpectation(position, exp)}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              isValid && !isSaving
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="py-3 px-6 rounded-lg font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        {settings?.isCustom && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            This group has custom settings.
          </p>
        )}
      </main>
    </div>
  );
}
