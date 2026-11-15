import type { PageResponse } from '../api/commerceTypes';

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return 'Price unavailable';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

export function prettyStatus(value: string | null | undefined): string {
  return value
    ? value
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : '—';
}

export function normalizePage<T>(
  response: PageResponse<T> | T[] | null | undefined,
) {
  if (Array.isArray(response)) {
    return {
      items: response,
      page: 0,
      totalPages: 1,
      total: response.length,
    };
  }

  const data = response as PageResponse<T> | null | undefined;
  return {
    items: data?.content ?? [],
    page: data?.page?.number ?? data?.number ?? 0,
    totalPages: data?.page?.totalPages ?? data?.totalPages ?? 1,
    total: data?.page?.totalElements ?? data?.totalElements ?? data?.content?.length ?? 0,
  };
}

export function addressText(address: {
  street: string;
  city: string;
  state: string | null;
  zipcode: string | null;
  countryCode: string;
}): string {
  return [
    address.street,
    address.city,
    address.state,
    address.zipcode,
    address.countryCode,
  ]
    .filter(Boolean)
    .join(', ');
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}
