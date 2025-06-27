// Sensitive fields that should never be exposed in API responses
export const SENSITIVE_USER_FIELDS = [
  'password',
  'temp_p',
  'emailVToken',
  'passwordReset',
] as const;

// MongoDB projection object to exclude sensitive fields
// Usage: userModel.find({}, USER_SAFE_PROJECTION)
// Resolves to: { password: 0, temp_p: 0 and so on... }
export const USER_SAFE_PROJECTION = SENSITIVE_USER_FIELDS.reduce(
  (acc, field) => {
    acc[field] = 0;
    return acc;
  },
  {} as Record<string, 0>,
);

// MongoDB select string to exclude sensitive fields
// Usage: userModel.findByIdAndUpdate(id, {data}, { select: USER_SAFE_SELECT })
// Resolves to: "-password -temp_p and so on..."
export const USER_SAFE_SELECT = SENSITIVE_USER_FIELDS.map(
  (field) => `-${field}`,
).join(' ');
