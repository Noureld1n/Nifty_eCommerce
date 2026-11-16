export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export const roleLabel = (role) => (role === 'ROLE_ADMIN' ? 'Admin' : 'Customer')

/** Accepts Spring's PagedModel ({ content, page: {...} }) or a classic Page. */
export function normalizePage(data) {
  const meta = data?.page ?? data ?? {}
  return {
    items: data?.content ?? [],
    page: meta.number ?? 0,
    totalPages: meta.totalPages ?? 1,
    total: meta.totalElements ?? (data?.content?.length ?? 0),
  }
}
