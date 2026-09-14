import { postJson } from './client.js';

export const MIN_PASSWORD_LENGTH = 8;

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;

/**
 * Client-side checks only. The server owns uniqueness, so "that username is
 * taken" can only ever come back from a request.
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
 * What she is called on screen, as opposed to what signs her in. Free-form on
 * purpose: it carries no uniqueness and no login meaning, so the only thing
 * worth rejecting is a length that would break the layout.
 */
export function validateDisplayName(displayName) {
  if (displayName.trim().length > MAX_DISPLAY_NAME_LENGTH)
    return `Use ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`;
  return null;
}

/** Falls back to the username, so the header always has something to show. */
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
 * Keeps the account's copy of the journey level with this device's.
 *
 * Without it the plan reaches the account once, on the day it is created, and
 * every later change lives only on the device that made it — so signing in
 * anywhere hands back the original and silently discards the rest.
 *
 * The server reads the session cookie to know whose plan this is, so no
 * username travels in the body.
 *
 * @param {{ plan: object }} payload
 */
export function savePlan({ plan }) {
  return postJson('/api/account/plan', { plan });
}

/** Clears the server session cookie. */
export function signOut() {
  return postJson('/api/account/sign-out', {});
}
