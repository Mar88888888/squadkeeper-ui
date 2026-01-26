import { useState, useCallback } from 'react';
import { Position, StrongFoot } from '../constants/player.constants';

type UserType = 'coach' | 'player' | 'parent';

interface CommonFields {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
}

interface CoachFields {
  licenseLevel: string;
  experienceYears: number;
}

interface PlayerFields {
  position: Position;
  height: number;
  weight: number;
  strongFoot: StrongFoot;
}

interface FormState extends CommonFields, CoachFields, PlayerFields {
  userType: UserType;
}

interface UIState {
  isLoading: boolean;
  error: string;
  success: string;
}

const initialFormState: FormState = {
  userType: 'coach',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  dateOfBirth: '',
  licenseLevel: '',
  experienceYears: 0,
  position: Position.CM,
  height: 170,
  weight: 70,
  strongFoot: StrongFoot.RIGHT,
};

const initialUIState: UIState = {
  isLoading: false,
  error: '',
  success: '',
};

export function useUserForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [ui, setUI] = useState<UIState>(initialUIState);

  const updateField = useCallback(<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setUserType = useCallback((userType: UserType) => {
    setForm((prev) => ({ ...prev, userType }));
    setUI((prev) => ({ ...prev, error: '', success: '' }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setUI((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string) => {
    setUI((prev) => ({ ...prev, error, success: '' }));
  }, []);

  const setSuccess = useCallback((success: string) => {
    setUI((prev) => ({ ...prev, success, error: '' }));
  }, []);

  const clearMessages = useCallback(() => {
    setUI((prev) => ({ ...prev, error: '', success: '' }));
  }, []);

  const resetForm = useCallback(() => {
    setForm((prev) => ({
      ...initialFormState,
      userType: prev.userType,
    }));
    setUI((prev) => ({ ...prev, isLoading: false, error: '' }));
  }, []);

  const getCoachData = useCallback(() => ({
    email: form.email,
    password: form.password,
    firstName: form.firstName,
    lastName: form.lastName,
    phoneNumber: form.phoneNumber || undefined,
    dateOfBirth: form.dateOfBirth,
    licenseLevel: form.licenseLevel,
    experienceYears: form.experienceYears,
  }), [form]);

  const getPlayerData = useCallback(() => ({
    email: form.email,
    password: form.password,
    firstName: form.firstName,
    lastName: form.lastName,
    phoneNumber: form.phoneNumber || undefined,
    dateOfBirth: form.dateOfBirth,
    position: form.position,
    height: form.height,
    weight: form.weight,
    strongFoot: form.strongFoot,
  }), [form]);

  const getParentData = useCallback((childrenIds: string[]) => ({
    email: form.email,
    password: form.password,
    firstName: form.firstName,
    lastName: form.lastName,
    phoneNumber: form.phoneNumber || undefined,
    childrenIds: childrenIds.length > 0 ? childrenIds : undefined,
  }), [form]);

  return {
    form,
    ui,
    updateField,
    setUserType,
    setLoading,
    setError,
    setSuccess,
    clearMessages,
    resetForm,
    getCoachData,
    getPlayerData,
    getParentData,
  };
}

export type { UserType, FormState, UIState };
