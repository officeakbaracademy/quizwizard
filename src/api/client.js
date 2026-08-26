/**
 * Thin HTTP client.
 *
 * Every request goes through here so that switching from the bundled static
 * JSON to a live backend is a one-line environment change:
 *
 *   .env.local
 *   VITE_API_BASE_URL=https://api.akbaracademy.co.uk
 *
 * With no VITE_API_BASE_URL set, `request()` reads the static snapshots under
 * public/data instead, and the rest of the app cannot tell the difference.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const isLiveApi = Boolean(API_BASE_URL);

export class ApiError extends Error {
  constructor(message, { status, url } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

function buildUrl(pathOrUrl, params) {
  const base = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const url = `${API_BASE_URL}${base}`;
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

/**
 * @param {string} path         API path, e.g. "/questions"
 * @param {object} [options]
 * @param {object} [options.params]        query string values
 * @param {string} [options.staticPath]    file under public/ used when no API base is configured
 * @param {AbortSignal} [options.signal]
 */
export async function request(path, { params, staticPath, signal, ...init } = {}) {
  const url = isLiveApi || !staticPath ? buildUrl(path, params) : staticPath;

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', ...(init.headers || {}) },
      signal,
      ...init,
    });
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause;
    throw new ApiError(`Network request to ${url} failed`, { url });
  }

  if (!response.ok) {
    throw new ApiError(`Request to ${url} failed with status ${response.status}`, {
      status: response.status,
      url,
    });
  }

  return response.json();
}
