'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)`n  const [missedToday, setMissedToday] = useState(new Set())
  const router = useRouter()

  // Filter state
  const [filterDate, setFilterDate] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [filterIcra, setFilterIcra] = useState('all')
  const [filterPm, setFilterPm] = useState('all')
  const [filterPermit, setFilterPermit] = useState('all')

  useEffect(() => { checkUser() }, [])
  useEffect(() => { applyFilters() }, [submissions, filterDate, filterStatus, filterBuilding, filterIcra, filterPm, filterPermit])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setUser(session.user)
    loadSubmissions()
  }

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) { setSubmissions(data || []); loadMissedChecklists(data || []) }
    setLoading(false)
  }

  async function loadMissedChecklists(subs) {
    const today = new Date().toISOString().split('T')[0]
    const activeSubs = subs.filter(s => ['approved','in_progress','active'].includes(s.status))
    if (!activeSubs.length) return
    const { data: checklists } = await supabase
      .from('daily_checklists')
      .select('doc_id')
      .eq('completed_date', today)
    const submittedDocIds = new Set((checklists || []).map(c => c.doc_id))
    const missed = new Set(activeSubs.filter(s => !submittedDocIds.has(s.doc_id)).map(s => s.doc_id))
    setMissedToday(missed)
  }function exportCSV() {
    const headers = ['Doc ID','Project','Building','Floor','PM','Status','ICRA','Meeting Date','Requestor','Email','Created']
    const rows = filtered.map(s => [
      s.doc_id, s.project_name, s.building, s.floor, s.project_manager,
      s.status, s.icra_class, s.meeting_date, s.requester_name, s.requester_email,
      new Date(s.created_at).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pcra-submissions-' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function applyFilters() {
    let data = [...submissions]

    // Date filter
    if (filterDate !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      if (filterDate === '7days') cutoff.setDate(now.getDate() - 7)
      if (filterDate === '30days') cutoff.setDate(now.getDate() - 30)
      if (filterDate === '90days') cutoff.setDate(now.getDate() - 90)
      if (filterDate === 'thisyear') cutoff.setMonth(0, 1)
      data = data.filter(s => new Date(s.created_at) >= cutoff)
    }

    // Status filter
    if (filterStatus !== 'all') data = data.filter(s => s.status === filterStatus)

    // Building filter
    if (filterBuilding !== 'all') data = data.filter(s => s.building === filterBuilding)

    // ICRA filter
    if (filterIcra !== 'all') data = data.filter(s => s.icra_class === filterIcra)

    // PM filter
    if (filterPm !== 'all') data = data.filter(s => s.project_manager === filterPm)

    // Permit filter
    if (filterPermit === 'hot_work') data = data.filter(s => s.has_hot_work)
    if (filterPermit === 'energized') data = data.filter(s => s.has_energized)
    if (filterPermit === 'confined') data = data.filter(s => s.has_confined)
    if (filterPermit === 'above_ceiling') data = data.filter(s => s.has_above_ceiling)

    setFiltered(data)
  }

  function clearFilters() {
    setFilterDate('all')
    setFilterStatus('all')
    setFilterBuilding('all')
    setFilterIcra('all')
    setFilterPm('all')
    setFilterPermit('all')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Unique values for dropdowns
  const buildings = [...new Set(submissions.map(s => s.building).filter(Boolean))].sort()
  const managers = [...new Set(submissions.map(s => s.project_manager).filter(Boolean))].sort()
  const hasActiveFilters = [filterDate, filterStatus, filterBuilding, filterIcra, filterPm, filterPermit].some(f => f !== 'all')

  const statusColor = {
    submitted: '#f59e0b',
    in_review: '#3b82f6',
    approved: '#10b981',
    closed: '#6b7280',
    draft: '#9ca3af'
  }

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '13px',
    background: '#fff',
    cursor: 'pointer',
    color: '#333',
    minWidth: '140px'
  }

  return (
    <div style={{minHeight:'100vh',background:'#f3f4f6',fontFamily:'Segoe UI,sans-serif'}}>

      {/* Header */}
      <div style={{background:'#ba0c2f',color:'#fff',padding:'14px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
        <div>
          <div style={{fontWeight:'900',fontSize:'18px',letterSpacing:'0.05em'}}>UNMH — Environmental Safety</div>
          <div style={{fontSize:'11px',opacity:'0.85'}}>Pre-Construction Risk Assessment — Coordinator Dashboard</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{fontSize:'13px',opacity:'0.85'}}>{user?.email}</span>
          <button onClick={handleLogout} style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'6px',padding:'6px 14px',cursor:'pointer',fontSize:'13px',fontWeight:'600'}}>
            Sign Out
              </button>
              <button onClick={exportCSV} style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'6px',padding:'7px 14px',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>
                📥 Export CSV
              </button>
              <a href='/reports' style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'6px',padding:'7px 14px',fontSize:'12px',fontWeight:'700',textDecoration:'none'}}>
                📊 Reports
              </a>
              <a href='/admin' style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'6px',padding:'7px 14px',fontSize:'12px',fontWeight:'700',textDecoration:'none'}}>
                ⚙️ Admin
              </a>
  
        </div>
      </div>

      <div style={{maxWidth:'1300px',margin:'0 auto',padding:'24px 16px'}}>

        {/* Stats row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'20px'}}>
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

        {/* Filters */}
        <div style={{background:'#fff',borderRadius:'8px',padding:'16px 20px',marginBottom:'16px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
            <span style={{fontWeight:'700',fontSize:'13px',color:'#333'}}>🔍 Filter Submissions</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{background:'#fef2f2',color:'#ba0c2f',border:'1px solid #fca5a5',borderRadius:'4px',padding:'2px 10px',fontSize:'12px',cursor:'pointer',fontWeight:'600'}}>
                Clear All
              </button>
            )}
            {hasActiveFilters && (
              <span style={{fontSize:'12px',color:'#666'}}>Showing {filtered.length} of {submissions.length} records</span>
            )}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px',alignItems:'center'}}>

            {/* 1. Date Range */}
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#888',textTransform:'uppercase',marginBottom:'3px'}}>Date Range</div>
              <select value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={selectStyle}>
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="thisyear">This Year</option>
              </select>
            </div>

            {/* 2. Status */}
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#888',textTransform:'uppercase',marginBottom:'3px'}}>Status</div>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={selectStyle}>
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* 3. Building */}
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#888',textTransform:'uppercase',marginBottom:'3px'}}>Building</div>
              <select value={filterBuilding} onChange={e=>setFilterBuilding(e.target.value)} style={selectStyle}>
                <option value="all">All Buildings</option>
                {buildings.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* 4. ICRA Class */}
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#888',textTransform:'uppercase',marginBottom:'3px'}}>ICRA Class</div>
              <select value={filterIcra} onChange={e=>setFilterIcra(e.target.value)} style={selectStyle}>
                <option value="all">All Classes</option>
                <option value="I">Class I</option>
                <option value="II">Class II</option>
                <option value="III">Class III</option>
                <option value="IV">Class IV</option>
              </select>
            </div>

            {/* 5. Project Manager */}
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#888',textTransform:'uppercase',marginBottom:'3px'}}>Project Manager</div>
              <select value={filterPm} onChange={e=>setFilterPm(e.target.value)} style={selectStyle}>
                <option value="all">All PMs</option>
                {managers.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* 6. Permit Type */}
            <div>
              <div style={{fontSize:'10px',fontWeight:'700',color:'#888',textTransform:'uppercase',marginBottom:'3px'}}>Permit Type</div>
              <select value={filterPermit} onChange={e=>setFilterPermit(e.target.value)} style={selectStyle}>
                <option value="all">All Permits</option>
                <option value="hot_work">🔥 Hot Work</option>
                <option value="energized">⚡ Energized Electrical</option>
                <option value="confined">⚠️ Confined Space</option>
                <option value="above_ceiling">🏗️ Above Ceiling</option>
              </select>
            </div>

          </div>
        </div>

        {/* Submissions table */}
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h2 style={{margin:0,fontSize:'16px',fontWeight:'700',color:'#111'}}>
              {hasActiveFilters ? 'Filtered Submissions' : 'All Submissions'}
            </h2>
            <span style={{fontSize:'13px',color:'#666'}}>{filtered.length} record{filtered.length!==1?'s':''}</span>
          </div>

          {loading ? (
            <div style={{padding:'40px',textAlign:'center',color:'#666'}}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'#666'}}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>📋</div>
              <div style={{fontWeight:'700',marginBottom:'4px'}}>
                {hasActiveFilters ? 'No records match your filters' : 'No submissions yet'}
              </div>
              <div style={{fontSize:'13px'}}>
                {hasActiveFilters ? 'Try adjusting or clearing the filters above' : 'Submissions will appear here once the form goes live'}
              </div>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                <thead>
                  <tr style={{background:'#f9fafb'}}>
                    {['Doc ID','Project Name','Building','PM','ICRA Class','Permits','Status','Date'].map(h => (
                      <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:'700',color:'#555',borderBottom:'1px solid #e5e7eb',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                   <tr key={s.id} onClick={() => router.push('/dashboard/' + s.id)} style={{borderBottom:'1px solid #f3f4f6',background:i%2===0?'#fff':'#fafafa',cursor:'pointer'}}> 
   <td style={{padding:'12px 16px',fontWeight:'700',color:'#ba0c2f',whiteSpace:'nowrap'}}>
  <span>{s.doc_id}</span>
  {s.priority === 'urgent' && <span style={{marginLeft:'6px',fontSize:'10px',fontWeight:'700',background:'#fffbeb',color:'#d97706',border:'1px solid #d97706',padding:'1px 6px',borderRadius:'4px'}}>⚡ URGENT</span>}
  {s.priority === 'emergency' && <span style={{marginLeft:'6px',fontSize:'10px',fontWeight:'700',background:'#fef2f2',color:'#ba0c2f',border:'1px solid #ba0c2f',padding:'1px 6px',borderRadius:'4px'}}>🚨 EMERGENCY</span>}`n{missedToday.has(s.doc_id) && <span style={{marginLeft:'6px',fontSize:'10px',fontWeight:'700',background:'#fef2f2',color:'#ba0c2f',border:'1px solid #ba0c2f',padding:'1px 6px',borderRadius:'4px'}}>⚠️ MISSED</span>}
```  {missedToday.has(s.doc_id) && <span style={{marginLeft:'6px',fontSize:'10px',fontWeight:'700',background:'#fef2f2',color:'#ba0c2f',border:'1px solid #ba0c2f',padding:'1px 6px',borderRadius:'4px'}}>MISSED CHECKLIST</span>}
</td>
                      <td style={{padding:'12px 16px'}}>{s.project_name || '—'}</td>
                      <td style={{padding:'12px 16px'}}>{s.building || '—'}</td>
                      <td style={{padding:'12px 16px',whiteSpace:'nowrap'}}>{s.project_manager || '—'}</td>
                      <td style={{padding:'12px 16px',textAlign:'center'}}>
                        {s.icra_class ? (
                          <span style={{background:'#007a8620',color:'#007a86',padding:'2px 8px',borderRadius:'12px',fontWeight:'700',fontSize:'12px'}}>
                            Class {s.icra_class}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{padding:'12px 16px',fontSize:'16px',whiteSpace:'nowrap'}}>
                        {[s.has_hot_work&&'🔥',s.has_energized&&'⚡',s.has_confined&&'⚠️',s.has_above_ceiling&&'🏗️'].filter(Boolean).join(' ')||'—'}
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{background:statusColor[s.status]+'20',color:statusColor[s.status],padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',whiteSpace:'nowrap'}}>
                          {s.status?.replace('_',' ')}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px',color:'#666',whiteSpace:'nowrap'}}>{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div style={{display:'flex',gap:'12px',padding:'16px 24px',borderTop:'1px solid #e5e7eb'}}>
        <a href='/dashboard' style={{background:'#6b7280',color:'#fff',padding:'10px 20px',borderRadius:'6px',textDecoration:'none',fontWeight:'700',fontSize:'13px'}}>← Back to Dashboard</a>
        <button onClick={()=>window.print()} style={{background:'#007a86',color:'#fff',border:'none',borderRadius:'6px',padding:'10px 20px',fontWeight:'700',fontSize:'13px',cursor:'pointer'}}>🖨️ Print</button>
      </div>
    </div>
  )
}
