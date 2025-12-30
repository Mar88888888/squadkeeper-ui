import { useState, useEffect } from 'react';
import type {
  CoachInfo,
  PlayerInfo,
  ParentFullInfo,
  UpdateCoachRequest,
  UpdatePlayerRequest,
  UpdateParentRequest,
} from '../api/users';

type UserType = 'coach' | 'player' | 'parent';

interface EditUserModalProps {
  isOpen: boolean;
  userType: UserType;
  user: CoachInfo | PlayerInfo | ParentFullInfo | null;
  onSave: (data: UpdateCoachRequest | UpdatePlayerRequest | UpdateParentRequest) => Promise<void>;
  onClose: () => void;
}

export function EditUserModal({ isOpen, userType, user, onSave, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    // Coach specific
    licenseLevel: '',
    experienceYears: 0,
    // Player specific
    position: '',
    height: 0,
    weight: 0,
    strongFoot: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      const baseData = {
        email: user.user?.email || '',
        password: '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: (user as any).phoneNumber || '',
        dateOfBirth: '',
        licenseLevel: '',
        experienceYears: 0,
        position: '',
        height: 0,
        weight: 0,
        strongFoot: '',
      };

      if (userType === 'coach') {
        const coach = user as CoachInfo;
        baseData.dateOfBirth = coach.dateOfBirth ? coach.dateOfBirth.split('T')[0] : '';
        baseData.licenseLevel = coach.licenseLevel || '';
        baseData.experienceYears = coach.experienceYears || 0;
      } else if (userType === 'player') {
        const player = user as PlayerInfo;
        baseData.dateOfBirth = player.dateOfBirth ? player.dateOfBirth.split('T')[0] : '';
        baseData.position = player.position || '';
        baseData.height = (player as any).height || 0;
        baseData.weight = (player as any).weight || 0;
        baseData.strongFoot = (player as any).strongFoot || '';
      }

      setFormData(baseData);
      setError(null);
    }
  }, [user, userType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let data: UpdateCoachRequest | UpdatePlayerRequest | UpdateParentRequest;

      const baseData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
      };

      // Only include password if it was changed
      if (formData.password) {
        baseData.password = formData.password;
      }

      if (userType === 'coach') {
        data = {
          ...baseData,
          dateOfBirth: formData.dateOfBirth || undefined,
          licenseLevel: formData.licenseLevel,
          experienceYears: formData.experienceYears,
        } as UpdateCoachRequest;
      } else if (userType === 'player') {
        data = {
          ...baseData,
          dateOfBirth: formData.dateOfBirth || undefined,
          position: formData.position,
          height: formData.height,
          weight: formData.weight,
          strongFoot: formData.strongFoot,
        } as UpdatePlayerRequest;
      } else {
        data = baseData as UpdateParentRequest;
      }

      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const title = userType === 'coach' ? 'Edit Coach' : userType === 'player' ? 'Edit Player' : 'Edit Parent';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Update {user.firstName} {user.lastName}'s information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
                <span className="text-gray-400 font-normal ml-1">(leave empty to keep current)</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                minLength={6}
                placeholder="Enter new password..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="+380..."
              />
            </div>

            {/* Coach/Player specific: Date of Birth */}
            {(userType === 'coach' || userType === 'player') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}

            {/* Coach specific fields */}
            {userType === 'coach' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Level
                    </label>
                    <select
                      value={formData.licenseLevel}
                      onChange={(e) => setFormData({ ...formData, licenseLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select level</option>
                      <option value="D">D</option>
                      <option value="C">C</option>
                      <option value="B">B</option>
                      <option value="A">A</option>
                      <option value="PRO">PRO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Player specific fields */}
            {userType === 'player' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select position</option>
                      <option value="GK">Goalkeeper (GK)</option>
                      <option value="CB">Center Back (CB)</option>
                      <option value="LB">Left Back (LB)</option>
                      <option value="RB">Right Back (RB)</option>
                      <option value="CDM">Defensive Mid (CDM)</option>
                      <option value="CM">Central Mid (CM)</option>
                      <option value="CAM">Attacking Mid (CAM)</option>
                      <option value="LW">Left Wing (LW)</option>
                      <option value="RW">Right Wing (RW)</option>
                      <option value="ST">Striker (ST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strong Foot
                    </label>
                    <select
                      value={formData.strongFoot}
                      onChange={(e) => setFormData({ ...formData, strongFoot: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select foot</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="100"
                      max="220"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="30"
                      max="150"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
