import { validatePassword, getPasswordStrength } from './password.util';

describe('validatePassword', () => {
  it('should pass for valid password with all requirements', () => {
    const result = validatePassword('Password123');

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.checks).toEqual({
      minLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
    });
  });

  it('should fail for password shorter than 8 characters', () => {
    const result = validatePassword('Pass1');

    expect(result.isValid).toBe(false);
    expect(result.checks.minLength).toBe(false);
    expect(result.errors).toContain('At least 8 characters');
  });

  it('should fail for password without uppercase', () => {
    const result = validatePassword('password123');

    expect(result.isValid).toBe(false);
    expect(result.checks.hasUppercase).toBe(false);
    expect(result.errors).toContain('One uppercase letter');
  });

  it('should fail for password without lowercase', () => {
    const result = validatePassword('PASSWORD123');

    expect(result.isValid).toBe(false);
    expect(result.checks.hasLowercase).toBe(false);
    expect(result.errors).toContain('One lowercase letter');
  });

  it('should fail for password without number', () => {
    const result = validatePassword('PasswordABC');

    expect(result.isValid).toBe(false);
    expect(result.checks.hasNumber).toBe(false);
    expect(result.errors).toContain('One number');
  });

  it('should return multiple errors for multiple failures', () => {
    const result = validatePassword('abc');

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);
    expect(result.checks.minLength).toBe(false);
    expect(result.checks.hasUppercase).toBe(false);
    expect(result.checks.hasNumber).toBe(false);
  });

  it('should handle empty password', () => {
    const result = validatePassword('');

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });
});

describe('getPasswordStrength', () => {
  it('should return "strong" when all checks pass', () => {
    expect(getPasswordStrength('Password123')).toBe('strong');
  });

  it('should return "medium" when 3 checks pass', () => {
    expect(getPasswordStrength('password123')).toBe('medium'); // missing uppercase
    expect(getPasswordStrength('PASSWORD123')).toBe('medium'); // missing lowercase
  });

  it('should return "weak" when 2 or fewer checks pass', () => {
    expect(getPasswordStrength('password')).toBe('weak'); // only lowercase + length
    expect(getPasswordStrength('abc')).toBe('weak'); // only lowercase
    expect(getPasswordStrength('')).toBe('weak');
  });
});
