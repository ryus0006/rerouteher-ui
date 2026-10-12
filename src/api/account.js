import { deleteJson, postJson, putJson } from './client.js';

export const MIN_PASSWORD_LENGTH = 8;

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;

/**
 * Client-side format checks only. Uniqueness is enforced by the server and is
 * reported through the request error.
 *
 * @returns {string | null} the message to show, or null when the value is fine
 */
export function validateUsername(username) {
  const value = username.trim();

  if (!value) return 'Choose a username.';
  if (value.length < 3) return 'Use at least 3 characters.';
  if (value.length > 30) return 'Use 30 characters or fewer.';
  if (!USERNAME_PATTERN.test(value.toLowerCase())) {
    return 'Use letters, numbers and underscores, starting and ending with a letter or number.';
  }

  return null;
}

export function validatePassword(password) {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

export const MAX_DISPLAY_NAME_LENGTH = 40;

/**
 * The name shown in the UI, distinct from the login username. Free-form and
 * non-unique, so only the length is validated to protect the layout.
 */
export function validateDisplayName(displayName) {
  if (displayName.trim().length > MAX_DISPLAY_NAME_LENGTH)
    return `Use ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`;
  return null;
}

/** Returns the display name, falling back to the username when it is unset. */
export function resolveDisplayName({ displayName, username }) {
  return displayName?.trim() || username.trim();
}

/**
 * @param {{ username: string, password: string, displayName?: string, plan: object }} payload
 * @returns {Promise<{ username: string, displayName: string }>}
 */
export function createAccount({ username, password, displayName, plan }) {
  return postJson('/api/account/create', {
    username: username.trim(),
    password,
    display_name: resolveDisplayName({ displayName, username }),
    plan,
  });
}

/**
 * @param {{ username: string, password: string }} credentials
 * @returns {Promise<{ username: string, displayName: string, plan: object | null }>}
 */
export function signIn({ username, password }) {
  return postJson('/api/account/sign-in', { username: username.trim(), password });
}

/**
 * Persists the current journey to the signed-in account so later changes are
 * available on other devices.
 *
 * The account is identified by the session cookie; the body carries only the
 * plan.
 *
 * @param {{ plan: object }} payload
 */
export function savePlan({ plan }) {
  return postJson('/api/account/plan', { plan });
}

export function addProfessionalSkill(skillId) {
  return putJson(`/api/account/professional-skills/${encodeURIComponent(skillId)}`, {});
}

export function removeProfessionalSkill(skillId) {
  return deleteJson(`/api/account/professional-skills/${encodeURIComponent(skillId)}`);
}

/** Clears the server session cookie. */
export function signOut() {
  return postJson('/api/account/sign-out', {});
}
