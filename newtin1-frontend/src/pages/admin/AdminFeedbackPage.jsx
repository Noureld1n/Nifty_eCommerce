import { useCallback, useState } from 'react'
import { adminApi } from '../../api/authApi'
import { Alert, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage } from '../../lib/format'

export default function AdminFeedbackPage() {
  useTitle('Customer feedback')
  const [page, setPage] = useState(0)
  const [satisfied, setSatisfied] = useState('')
  const fetcher = useCallback(() => adminApi.listFeedback(satisfied, page), [satisfied, page])
  const { data, loading, error } = useFetch(fetcher)
  const list = normalizePage(data)

  return (
    <>
      <div className="page-head">
        <div className="page-head__text"><h1>Customer feedback</h1><p>{list.total} {list.total === 1 ? 'message' : 'messages'}, newest first.</p></div>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="sat">Show</label>
          <select id="sat" value={satisfied} onChange={(e) => { setSatisfied(e.target.value); setPage(0) }}>
            <option value="">All feedback</option>
            <option value="true">Satisfied</option>
            <option value="false">Not satisfied</option>
          </select>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      <div aria-busy={loading}>
        {!loading && !error && list.items.length === 0 && (
          <div className="empty"><strong>No feedback yet</strong>Messages from customers will appear here.</div>
        )}
        {list.items.map((f) => (
          <article className="entry" key={f.id}>
            <header>
              <strong>{f.customerName}</strong>
              <span>{f.customerEmail}</span>
              <span>{formatDate(f.createdAt)}</span>
              {f.satisfied === true && <span className="badge badge--ok">Satisfied</span>}
              {f.satisfied === false && <span className="badge badge--off">Not satisfied</span>}
            </header>
            <p>{f.text}</p>
          </article>
        ))}
      </div>
      <Pager page={list.page} totalPages={list.totalPages} onPage={setPage} />
    </>
  )
}
