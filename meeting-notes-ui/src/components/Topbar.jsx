import { Link, useLocation } from 'react-router-dom'
import { Button } from './Field'

export default function Topbar() {
  const loc = useLocation()
  return (
    <div style={{
      padding: '14px 18px', borderBottom: '1px solid #eee',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>AI Meeting Notes Summarizer</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button variant={loc.pathname === '/' ? 'primary' : 'ghost'}>Generate</Button>
        </Link>
        <Link to="/history" style={{ textDecoration: 'none' }}>
          <Button variant={loc.pathname === '/history' ? 'primary' : 'ghost'}>History</Button>
        </Link>
      </div>
    </div>
  )
}
