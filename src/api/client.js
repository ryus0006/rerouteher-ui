const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Error carrying the server-supplied reason so callers can surface it inline. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body?.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function postJson(path, payload) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new ApiError(await parseError(response), response.status);
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

  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return response.json();
}
