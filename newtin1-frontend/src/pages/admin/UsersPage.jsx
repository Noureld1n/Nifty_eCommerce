import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api/authApi'
import { useAuth } from '../../auth/useAuth'
import { Alert, Avatar, Button, Field, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage, roleLabel } from '../../lib/format'

export default function UsersPage() {
  useTitle('Users')
  const { user: me } = useAuth()
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState('')
  const fetcher = useCallback(() => adminApi.listUsers(page), [page])
  const { data, loading, error: loadError, reload } = useFetch(fetcher)
  const list = normalizePage(data)

  const [confirmId, setConfirmId] = useState(null) // first click arms, second click confirms a deactivation
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (confirmId == null) return undefined
    const t = setTimeout(() => setConfirmId(null), 4000)
    return () => clearTimeout(t)
  }, [confirmId])

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return list.items
    return list.items.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
  }, [list.items, filter])

  async function toggle(u) {
    setActionError('')
    if (u.active && confirmId !== u.id) { setConfirmId(u.id); return }
    setConfirmId(null)
    setBusyId(u.id)
    try {
      await adminApi.setUserActive(u.id, !u.active)
      reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1>Users</h1>
          <p>{list.total} {list.total === 1 ? 'account' : 'accounts'} in total. Every change is written to the audit log.</p>
        </div>
      </div>

      <div className="toolbar">
        <Field label="Filter this page" type="search" placeholder="Name or email" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {loadError && <Alert tone="error" action={<Button variant="ghost" small onClick={reload}>Try again</Button>}>{loadError}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}

      <div className="table-wrap" aria-busy={loading}>
        <table className="table">
          <thead>
            <tr><th>User</th><th className="hide-sm">Role</th><th>Status</th><th className="hide-sm">Joined</th><th className="num">Action</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const self = u.id === me.id
              return (
                <tr key={u.id}>
                  <td>
                    <div className="cell-user">
                      <Avatar user={u} size="2.4rem" />
                      <span><strong>{u.firstName} {u.lastName}</strong>{self && ' (you)'}<small>{u.email}</small></span>
                    </div>
                  </td>
                  <td className="hide-sm"><span className={`badge ${u.role === 'ROLE_ADMIN' ? 'badge--admin' : ''}`}>{roleLabel(u.role)}</span></td>
                  <td><span className={`badge ${u.active ? 'badge--ok' : 'badge--off'}`}>{u.active ? 'Active' : 'Deactivated'}</span></td>
                  <td className="hide-sm">{formatDate(u.registerDate)}</td>
                  <td className="num">
                    {self ? <span className="hint">—</span> : (
                      <Button
                        small
                        variant={u.active ? (confirmId === u.id ? 'danger' : 'ghost') : 'primary'}
                        loading={busyId === u.id}
                        onClick={() => toggle(u)}
                      >
                        {u.active ? (confirmId === u.id ? 'Confirm' : 'Deactivate') : 'Activate'}
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && !loadError && (
          <div className="empty"><strong>No matching users</strong>{filter ? 'Clear the filter to see everyone on this page.' : 'Accounts appear here once people register.'}</div>
        )}
      </div>
      <Pager page={list.page} totalPages={list.totalPages} onPage={setPage} />
    </>
  )
}
