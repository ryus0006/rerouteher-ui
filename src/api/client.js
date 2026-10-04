const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Error carrying the server-supplied reason so callers can surface it inline.
 * `body` holds the parsed error payload (when there is one) so callers can
 * recover data the server returned alongside a failure, such as the saved
 * attempt a 503 feedback response still carries.
 */
export class ApiError extends Error {
  constructor(message, status, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function toError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const message = body?.error ?? `Request failed (${response.status})`;
  return new ApiError(message, response.status, body);
}

export async function getJson(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) throw await toError(response);
  return response.json();
}

export async function postJson(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await toError(response);
  return response.json();
}

export async function postFile(path, file, field = 'file') {
  const body = new FormData();
  body.append(field, file);

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body,
  });

  if (!response.ok) throw await toError(response);
  return response.json();
}

export async function del(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  // 204 No Content: nothing to parse, nothing to return.
  if (!response.ok) throw await toError(response);
}
