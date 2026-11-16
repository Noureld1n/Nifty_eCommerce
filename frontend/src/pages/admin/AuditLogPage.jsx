import { useCallback, useState } from 'react'
import { adminApi } from '../../api/authApi'
import { Alert, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage } from '../../lib/format'

const ACTION_LABELS = { USER_ACTIVATED: 'User activated', USER_DEACTIVATED: 'User deactivated' }

/** "active: true → false" for every key the action touched. */
function describeChange(oldValues, newValues) {
  const keys = Object.keys({ ...oldValues, ...newValues })
  return keys.map((k) => `${k}: ${String(oldValues?.[k] ?? '—')} → ${String(newValues?.[k] ?? '—')}`).join(', ')
}

export default function AuditLogPage() {
  useTitle('Audit log')
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ action: '', entityId: '', adminId: '' })
  const setFilter = (k) => (e) => { setPage(0); setFilters((f) => ({ ...f, [k]: e.target.value.replace(k === 'action' ? /$^/ : /\D/g, '') })) }
  const fetcher = useCallback(() => adminApi.listAuditLogs(page, 20, { ...filters, entityType: filters.entityId ? 'USER' : '' }), [page, filters])
  const { data, loading, error } = useFetch(fetcher)
  const list = normalizePage(data)

  return (
    <>
      <div className="page-head">
        <div className="page-head__text"><h1>Audit log</h1><p>A permanent record of admin actions. Entries can't be edited or deleted.</p></div>
      </div>

      <div className="filters">
        <label>Action
          <select value={filters.action} onChange={setFilter('action')}>
            <option value="">All actions</option>
            <option value="USER_ACTIVATED">User activated</option>
            <option value="USER_DEACTIVATED">User deactivated</option>
          </select>
        </label>
        <label>User ID
          <input inputMode="numeric" placeholder="e.g. 12" value={filters.entityId} onChange={setFilter('entityId')} />
        </label>
        <label>Admin ID
          <input inputMode="numeric" placeholder="e.g. 1" value={filters.adminId} onChange={setFilter('adminId')} />
        </label>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      <div className="table-wrap" aria-busy={loading}>
        <table className="table">
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Change</th><th>IP</th></tr></thead>
          <tbody>
            {list.items.map((l) => (
              <tr key={l.id}>
                <td>{formatDate(l.createdAt)}</td>
                <td>{l.adminName ? <><strong>{l.adminName}</strong><div className="hint">{l.adminEmail}</div></> : 'System'}</td>
                <td>{ACTION_LABELS[l.action] ?? l.action}<div className="hint">{l.entityType} #{l.entityId}</div></td>
                <td className="mono">{describeChange(l.oldValues, l.newValues)}</td>
                <td className="mono">{l.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !error && list.items.length === 0 && (
          <div className="empty"><strong>No actions recorded</strong>Activating or deactivating a user will add an entry.</div>
        )}
      </div>
      <Pager page={list.page} totalPages={list.totalPages} onPage={setPage} />
    </>
  )
}
