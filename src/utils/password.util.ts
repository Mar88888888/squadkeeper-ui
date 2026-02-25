export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
}

const MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    minLength: password.length >= MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const errors: string[] = [];
  if (!checks.minLength) errors.push(`At least ${MIN_LENGTH} characters`);
  if (!checks.hasUppercase) errors.push('One uppercase letter');
  if (!checks.hasLowercase) errors.push('One lowercase letter');
  if (!checks.hasNumber) errors.push('One number');

  return {
    isValid: Object.values(checks).every(Boolean),
    errors,
    checks,
  };
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const { checks } = validatePassword(password);
  const passed = Object.values(checks).filter(Boolean).length;

  if (passed <= 2) return 'weak';
  if (passed === 3) return 'medium';
  return 'strong';
}
