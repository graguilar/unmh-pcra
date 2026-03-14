'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#ba0c2f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:'12px',padding:'40px',width:'380px',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{background:'#ba0c2f',color:'#fff',borderRadius:'8px',padding:'12px 20px',marginBottom:'16px',display:'inline-block'}}>
            <div style={{fontWeight:'900',fontSize:'18px',letterSpacing:'0.05em'}}>UNMH</div>
            <div style={{fontSize:'11px',opacity:'0.85'}}>Environmental Safety</div>
          </div>
          <h1 style={{fontSize:'20px',fontWeight:'700',color:'#111',margin:'0'}}>
            Pre-Construction Risk Assessment
          </h1>
          <p style={{color:'#666',fontSize:'13px',marginTop:'6px'}}>Coordinator Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'12px',fontWeight:'700',color:'#555',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',boxSizing:'border-box',outline:'none'}}
              placeholder="your@email.com"
            />
          </div>

          <div style={{marginBottom:'24px'}}>
            <label style={{display:'block',fontSize:'12px',fontWeight:'700',color:'#555',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',boxSizing:'border-box',outline:'none'}}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{background:'#fef2f2',border:'1px solid #fca5a5',color:'#dc2626',padding:'10px 12px',borderRadius:'6px',fontSize:'13px',marginBottom:'16px'}}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{width:'100%',background:loading?'#999':'#ba0c2f',color:'#fff',border:'none',borderRadius:'6px',padding:'12px',fontSize:'15px',fontWeight:'700',cursor:loading?'not-allowed':'pointer'}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
