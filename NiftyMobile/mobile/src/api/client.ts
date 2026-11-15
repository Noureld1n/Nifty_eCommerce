import { isAuthResponse, type AuthResponse } from './types';

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

type SessionHandlers = {
  expired?: () => void;
  refreshed?: (data: AuthResponse) => void;
};

type ErrorBody = {
  message?: unknown;
  fieldErrors?: unknown;
  retryAfterSeconds?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string> | null;
  readonly retryAfter: number;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> | null = null,
    retryAfter = 0,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.retryAfter = retryAfter;
  }
}

let accessToken: string | null = null;
let sessionHandlers: SessionHandlers = {};
let refreshing: Promise<AuthResponse> | null = null;

function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configuredUrl) {
    throw new ApiError(
      0,
      'API origin is not configured. Set EXPO_PUBLIC_API_URL in the mobile app environment.',
    );
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL must be an absolute HTTP or HTTPS URL.');
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.search.length > 0 ||
    url.hash.length > 0 ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    throw new ApiError(
      0,
      'EXPO_PUBLIC_API_URL must contain only the API server origin, without a path.',
    );
  }

  return url.origin;
}

function getFieldErrors(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const errors = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return errors.length > 0 ? Object.fromEntries(errors) : null;
}

function getErrorBody(value: unknown): ErrorBody | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as ErrorBody)
    : null;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function rawRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!path.startsWith('/api/')) {
    throw new ApiError(0, 'API paths must start with /api/.');
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const requestUrl = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'include',
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      'Cannot reach the server. Check your API origin and network connection.',
    );
  }

  const data = await parseResponse(response);
  if (!response.ok) {
    const body = getErrorBody(data);
    const retryAfter =
      response.status === 429
        ? Math.max(
            1,
            Number(response.headers.get('Retry-After')) ||
              Number(body?.retryAfterSeconds) ||
              60,
          )
        : 0;
    const message =
      response.status === 429
        ? `Too many attempts. Try again in ${
            retryAfter >= 90
              ? `${Math.ceil(retryAfter / 60)} minutes`
              : `${retryAfter} seconds`
          }.`
        : typeof body?.message === 'string'
          ? body.message
          : 'Something went wrong. Please try again.';

    throw new ApiError(
      response.status,
      message,
      getFieldErrors(body?.fieldErrors),
      retryAfter,
    );
  }

  return data as T;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionHandlers(handlers: SessionHandlers): void {
  sessionHandlers = { ...sessionHandlers, ...handlers };
}

export function refreshSession(): Promise<AuthResponse> {
  if (!refreshing) {
    refreshing = rawRequest<unknown>('/api/public/auth/refresh', {
      method: 'POST',
      auth: false,
    })
      .then((data) => {
        if (!isAuthResponse(data)) {
          throw new ApiError(502, 'The server returned an invalid session response.');
        }
        accessToken = data.token;
        sessionHandlers.refreshed?.(data);
        return data;
      })
      .catch((error: unknown) => {
        accessToken = null;
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      options.auth === false
    ) {
      throw error;
    }

    try {
      await refreshSession();
    } catch {
      sessionHandlers.expired?.();
      throw error;
    }

    return rawRequest<T>(path, options);
  }
}

export async function publicPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, { method: 'POST', body, auth: false });
}
