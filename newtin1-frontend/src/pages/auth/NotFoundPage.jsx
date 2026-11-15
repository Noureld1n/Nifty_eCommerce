import { Link } from 'react-router-dom'
import AuthCard from '../../components/AuthCard'

export default function NotFoundPage() {
  return (
    <AuthCard title="Page not found" subtitle="The address may be mistyped, or the page has moved.">
      <Link className="btn btn--primary btn--full" to="/">Back to Nifty</Link>
    </AuthCard>
  )
}
