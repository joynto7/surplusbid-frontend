export type PasswordStrengthLevel = 'weak' | 'fair' | 'strong';

export interface PasswordStrength {
  percent: number;
  label: string;
  level: PasswordStrengthLevel;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { percent: 0, label: '', level: 'weak' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { percent: 35, label: 'Weak', level: 'weak' };
  if (score <= 3) return { percent: 52, label: 'Fair', level: 'fair' };
  if (score === 4) return { percent: 72, label: 'Good', level: 'fair' };
  return { percent: 100, label: 'Strong', level: 'strong' };
}

export const STRENGTH_COLOR: Record<PasswordStrengthLevel, { bar: string; text: string }> = {
  weak: { bar: 'var(--bad)', text: 'var(--bad-deep)' },
  fair: { bar: 'var(--warn)', text: 'var(--warn-deep)' },
  strong: { bar: 'var(--ok)', text: 'var(--ok-deep)' },
};
