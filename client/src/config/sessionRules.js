// Pure rule (no imports, so it can be unit-tested with plain Node): when should a failed
// request be treated as "your login has expired"?

// Login, sign-up and password calls legitimately answer 401/400 for a wrong password etc.
// (`/+` because baseURL ".../auth/" + url "/login" joins with a double slash.)
export const AUTH_CALL = /\/api\/v1\/auth\/+(login|register|forgot-password|reset-password)/;

export function shouldExpireSession(error, { isAuthenticated } = {}) {
  const status = error?.response?.status;
  const config = error?.config;
  if (status !== 401 || !isAuthenticated || !config) return false;

  // Only our own requests that actually carried the token count
  // (third-party calls such as a weather API must never log the user out).
  const carriedToken = Boolean(config.headers?.Authorization);
  const url = `${config.baseURL || ""}${config.url || ""}`;
  return carriedToken && !AUTH_CALL.test(url);
}
