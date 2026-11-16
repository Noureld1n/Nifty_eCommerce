import { useCallback, useState } from 'react'
import { userApi } from '../../api/authApi'
import { Alert, Button, Field, Pager } from '../../components/ui'
import { useFetch } from '../../hooks/useFetch'
import { useTitle } from '../../hooks/useTitle'
import { formatDate, normalizePage } from '../../lib/format'

const MOODS = [
  { value: 'yes', label: 'Satisfied', send: true },
  { value: 'no', label: 'Not satisfied', send: false },
  { value: 'skip', label: 'Prefer not to say', send: null },
]

export default function FeedbackPage() {
  useTitle('Feedback')
  const [page, setPage] = useState(0)
  const fetcher = useCallback(() => userApi.myFeedback(page), [page])
  const { data, loading, error: loadError, reload } = useFetch(fetcher)
  const list = normalizePage(data)

  const [text, setText] = useState('')
  const [mood, setMood] = useState('skip')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSent(false)
    if (!text.trim()) { setError('Write a few words before sending.'); return }
    setBusy(true)
    try {
      await userApi.sendFeedback({ text: text.trim(), satisfied: MOODS.find((m) => m.value === mood).send })
      setText('')
      setSent(true)
      if (page === 0) reload(); else setPage(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="page-head"><div className="page-head__text"><h1>Feedback</h1><p>Tell us what's working and what isn't.</p></div></div>

      <section className="section" aria-labelledby="fb-h">
        <div className="section__intro">
          <h2 id="fb-h">Send feedback</h2>
          <p>Our team reads every message. You can send up to 5 a day.</p>
        </div>
        <form className="section__body" onSubmit={onSubmit} noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          {sent && <Alert tone="success">Thanks, we got your feedback.</Alert>}
          <fieldset className="seg">
            <legend>How was your experience?</legend>
            <div className="seg__opts">
              {MOODS.map((m) => (
                <label key={m.value}>
                  <input type="radio" name="mood" value={m.value} checked={mood === m.value} onChange={() => setMood(m.value)} />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Your message" as="textarea" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} hint={`${text.length} / 2000`} />
          <div><Button type="submit" loading={busy}>Send feedback</Button></div>
        </form>
      </section>

      <section className="section" aria-labelledby="past-h">
        <div className="section__intro"><h2 id="past-h">Your previous messages</h2></div>
        <div>
          {loadError && <Alert tone="error">{loadError}</Alert>}
          {!loadError && !loading && list.items.length === 0 && (
            <div className="empty"><strong>Nothing sent yet</strong>Your messages will show up here.</div>
          )}
          {list.items.map((f) => (
            <article className="entry" key={f.id}>
              <header>
                <span>{formatDate(f.createdAt)}</span>
                {f.satisfied === true && <span className="badge badge--ok">Satisfied</span>}
                {f.satisfied === false && <span className="badge badge--off">Not satisfied</span>}
              </header>
              <p>{f.text}</p>
            </article>
          ))}
          <Pager page={list.page} totalPages={list.totalPages} onPage={setPage} />
        </div>
      </section>
    </>
  )
}
