'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)
    loadSubmissions()
  }

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setSubmissions(data || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statusColor = {
    submitted: '#f59e0b',
    in_review: '#3b82f6',
    approved: '#10b981',
    closed: '#6b7280',
    draft: '#9ca3af'
  }

  return (
    <div style={{minHeight:'100vh',background:'#f3f4f6',fontFamily:'Segoe UI,sans-serif'}}>
      
      {/* Header */}
      <div style={{background:'#ba0c2f',color:'#fff',padding:'14px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div>
            <div style={{fontWeight:'900',fontSize:'18px',letterSpacing:'0.05em'}}>UNMH — Environmental Safety</div>
            <div style={{fontSize:'11px',opacity:'0.85'}}>Pre-Construction Risk Assessment — Coordinator Dashboard</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{fontSize:'13px',opacity:'0.85'}}>{user?.email}</span>
          <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'6px',padding:'6px 14px',cursor:'pointer',fontSize:'13px',fontWeight:'600'}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px 16px'}}>
        
        {/* Stats row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'24px'}}>
          {[
            { label: 'Total Submissions', value: submissions.length, color: '#ba0c2f' },
            { label: 'Submitted', value: submissions.filter(s=>s.status==='submitted').length, color: '#f59e0b' },
            { label: 'In Review', value: submissions.filter(s=>s.status==='in_review').length, color: '#3b82f6' },
            { label: 'Approved', value: submissions.filter(s=>s.status==='approved').length, color: '#10b981' },
          ].map(stat => (
            <div key={stat.label} style={{background:'#fff',borderRadius:'8px',padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',borderTop:`4px solid ${stat.color}`}}>
              <div style={{fontSize:'32px',fontWeight:'900',color:stat.color}}>{stat.value}</div>
              <div style={{fontSize:'13px',color:'#666',marginTop:'4px'}}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Submissions table */}
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h2 style={{margin:0,fontSize:'16px',fontWeight:'700',color:'#111'}}>All Submissions</h2>
            <span style={{fontSize:'13px',color:'#666'}}>{submissions.length} records</span>
          </div>
          
          {loading ? (
            <div style={{padding:'40px',textAlign:'center',color:'#666'}}>Loading...</div>
          ) : submissions.length === 0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'#666'}}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>📋</div>
              <div style={{fontWeight:'700',marginBottom:'4px'}}>No submissions yet</div>
              <div style={{fontSize:'13px'}}>Submissions will appear here once the form goes live</div>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
              <thead>
                <tr style={{background:'#f9fafb'}}>
                  {['Doc ID','Project Name','Building','PM','ICRA Class','Permits','Status','Date'].map(h => (
                    <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:'700',color:'#555',borderBottom:'1px solid #e5e7eb',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={s.id} style={{borderBottom:'1px solid #f3f4f6',background:i%2===0?'#fff':'#fafafa'}}>
                    <td style={{padding:'10px 16px',fontWeight:'700',color:'#ba0c2f'}}>{s.doc_id}</td>
                    <td style={{padding:'10px 16px'}}>{s.project_name || '—'}</td>
                    <td style={{padding:'10px 16px'}}>{s.building || '—'}</td>
                    <td style={{padding:'10px 16px'}}>{s.project_manager || '—'}</td>
                    <td style={{padding:'10px 16px'}}>{s.icra_class || '—'}</td>
                    <td style={{padding:'10px 16px'}}>
                      {[s.has_hot_work&&'🔥',s.has_energized&&'⚡',s.has_confined&&'⚠️',s.has_above_ceiling&&'🏗️'].filter(Boolean).join(' ')||'—'}
                    </td>
                    <td style={{padding:'10px 16px'}}>
                      <span style={{background:statusColor[s.status]+'20',color:statusColor[s.status],padding:'3px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',textTransform:'uppercase'}}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{padding:'10px 16px',color:'#666'}}>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}