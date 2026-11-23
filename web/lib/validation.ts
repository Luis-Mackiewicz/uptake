const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const calculateDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(9) === Number(digits[9]) && calculateDigit(10) === Number(digits[10]);
}

export function isValidPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

export function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidPositiveId(value: number) {
  return Number.isInteger(value) && value > 0;
}

export function validateLength(value: string, max: number) {
  return value.trim().length <= max;
}
