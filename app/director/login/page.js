 'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function DirectorLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')

    // Check director exists and is active
    const { data: director, error: dbError } = await supabase
      .from('directors')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'active')
      .single()

    if (dbError || !director) {
      setError('No active director account found for that email.')
      setLoading(false)
      return
    }

    // Use Supabase Auth for password check
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    sessionStorage.setItem('director_session', JSON.stringify({
      id: director.id,
      name: director.full_name,
      email: director.email,
      role: director.role
    }))

    router.push('/admin/documents')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px' }}>
        <div style={{ fontWeight: 900, fontSize: '16px' }}>UNMH PCRA</div>
        <div style={{ fontSize: '12px', opacity: 0.85 }}>Director / Manager Portal</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', padding: '36px', width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#1a2332' }}>Director Sign In</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Document & Policy Approval Portal</div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #ba0c2f', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#ba0c2f' }}>
              {error}
            </div>
          )}

          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Email Address</label>
          <input
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder='your@salud.unm.edu'
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />

          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Password</label>
          <input
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder='••••••••'
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
            Access restricted to authorized directors and managers only.<br />
            Contact your PCRA administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}