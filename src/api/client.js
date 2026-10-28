/**
 * Thin HTTP client. Every request to the backend goes through here.
 *
 *   .env.local
 *   VITE_API_BASE_URL=/api/v1   (through the dev proxy, see vite.config.js)
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

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
 * @param {AbortSignal} [options.signal]
 */
export async function request(path, { params, signal, ...init } = {}) {
  const url = buildUrl(path, params);

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
