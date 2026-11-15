// Mirrors the backend rules so users get instant feedback. The server stays the source of truth.
export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/
export const PHONE_RE = /^\+?[0-9]{7,20}$/

export const validators = {
  required: (label) => (v) => (v?.trim() ? '' : `${label} is required`),
  email: (v) => (!v?.trim() ? 'Email is required' : EMAIL_RE.test(v.trim()) ? '' : 'Enter a valid email address'),
  password: (v) =>
    !v ? 'Password is required' : PASSWORD_RE.test(v) ? '' : 'Use 8-72 characters with at least one letter and one digit',
  phone: (v) => (!v?.trim() || PHONE_RE.test(v.trim()) ? '' : 'Use 7-20 digits, optionally starting with +'),
  match: (other, message = 'Passwords do not match') => (v) => (v === other ? '' : message),
}

/** Runs { field: validatorFn } against values; returns { field: message } with only failing fields. */
export function validate(values, rules) {
  const errors = {}
  for (const [field, fn] of Object.entries(rules)) {
    const msg = fn(values[field])
    if (msg) errors[field] = msg
  }
  return errors
}
