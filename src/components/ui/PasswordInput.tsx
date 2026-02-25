import { useState } from 'react';
import { validatePassword, type PasswordValidation } from '../../utils/password.util';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  showRequirements?: boolean;
  className?: string;
}

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function PasswordInput({
  value,
  onChange,
  required = false,
  placeholder = 'Enter password...',
  showRequirements = true,
  className = '',
}: PasswordInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validation: PasswordValidation = validatePassword(value);
  const showChecks = showRequirements && (focused || value.length > 0);

  const requirements = [
    { key: 'minLength', label: 'At least 8 characters', passed: validation.checks.minLength },
    { key: 'hasUppercase', label: 'One uppercase letter', passed: validation.checks.hasUppercase },
    { key: 'hasLowercase', label: 'One lowercase letter', passed: validation.checks.hasLowercase },
    { key: 'hasNumber', label: 'One number', passed: validation.checks.hasNumber },
  ];

  return (
    <div className={className}>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showPassword ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {showChecks && (
        <div className="mt-2 space-y-1">
          {requirements.map((req) => (
            <div
              key={req.key}
              className={`flex items-center gap-2 text-xs ${
                req.passed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {req.passed ? <CheckIcon /> : <XIcon />}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}
