// The same rules the server enforces (Server/utils/security.js validatePasswordStrength), so the
// form can show what is still missing while the person types. The server stays the judge.
export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 && p.length <= 128 },
  { id: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "A number", test: (p) => /\d/.test(p) },
  { id: "special", label: "A special character (@$!%*?&)", test: (p) => /[@$!%*?&]/.test(p) },
];

export const checkPassword = (password = "") =>
  PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, ok: rule.test(password) }));

export const isStrongPassword = (password = "") => checkPassword(password).every((r) => r.ok);

// What is wrong with the change-password form (null when it can be sent).
export function passwordFormError({ current, next, confirm }) {
  if (!current) return "Please enter your current password";
  if (!isStrongPassword(next)) return "Your new password does not meet all the rules yet";
  if (next === current) return "Your new password must be different from the current one";
  if (next !== confirm) return "The new passwords do not match";
  return null;
}
