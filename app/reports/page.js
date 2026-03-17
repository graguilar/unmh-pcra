'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function ReportsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) { router.push('/login'); return }
      const { data } = await supabase.from('submissions').select('*').order('created_at', { ascending: true })
      setSubmissions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading reports...</div>

  // Data calculations
  const total = submissions.length
  const byStatus = submissions.reduce((acc, s) => { acc[s.status || 'submitted'] = (acc[s.status || 'submitted'] || 0) + 1; return acc }, {})
  const byIcra = submissions.reduce((acc, s) => { if (s.icra_class) { acc[s.icra_class] = (acc[s.icra_class] || 0) + 1 } return acc }, {})
  const byMonth = submissions.reduce((acc, s) => {
    const month = new Date(s.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})
  const byBuilding = submissions.reduce((acc, s) => { if (s.building) { acc[s.building] = (acc[s.building] || 0) + 1 } return acc }, {})
  const topBuildings = Object.entries(byBuilding).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const permits = {
    'Hot Work': submissions.filter(s => s.has_hot_work).length,
    'Energized Elec.': submissions.filter(s => s.has_energized).length,
    'Confined Space': submissions.filter(s => s.has_confined).length,
    'Above Ceiling': submissions.filter(s => s.has_above_ceiling).length,
  }

  const statusColors = { submitted: '#f59e0b', in_review: '#3b82f6', approved: '#10b981', closed: '#6b7280', cancelled: '#ef4444' }
  const icraColors = { 'I': '#16a34a', 'II': '#ca8a04', 'III': '#ea580c', 'IV': '#dc2626' }
  const maxMonth = Math.max(...Object.values(byMonth), 1)
  const maxBuilding = Math.max(...topBuildings.map(b => b[1]), 1)

  const card = { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px', marginBottom: '16px' }
  const secTitle = { fontSize: '14px', fontWeight: '800', color: '#374151', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '2px solid #f3f4f6' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '0.05em' }}>UNMH PCRA — Reports</div>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>Submission analytics and statistics</div>
        </div>
        <a href='/dashboard' style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '7px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '12px', border: '1px solid rgba(255,255,255,0.4)' }}>← Dashboard</a>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Total Submissions', value: total, color: '#ba0c2f' },
            { label: 'Submitted / Pending', value: (byStatus['submitted'] || 0), color: '#f59e0b' },
            { label: 'In Review', value: (byStatus['in_review'] || 0), color: '#3b82f6' },
            { label: 'Approved', value: (byStatus['approved'] || 0), color: '#10b981' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '18px', borderTop: `3px solid ${kpi.color}` }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', marginTop: '4px' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Submissions by Month */}
          <div style={card}>
            <div style={secTitle}>Submissions by Month</div>
            {Object.entries(byMonth).length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>No data yet</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', padding: '0 4px' }}>
                {Object.entries(byMonth).map(([month, count]) => (
                  <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#ba0c2f' }}>{count}</div>
                    <div style={{ width: '100%', background: '#ba0c2f', borderRadius: '4px 4px 0 0', height: `${(count / maxMonth) * 120}px`, minHeight: '4px' }} />
                    <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center', whiteSpace: 'nowrap' }}>{month}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div style={card}>
            <div style={secTitle}>Status Breakdown</div>
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: statusColors[status] || '#6b7280' }}>{count} ({Math.round(count/total*100)}%)</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count/total)*100}%`, background: statusColors[status] || '#6b7280', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* ICRA Class Distribution */}
          <div style={card}>
            <div style={secTitle}>ICRA Class Distribution</div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
              {['I', 'II', 'III', 'IV'].map(cls => (
                <div key={cls} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: icraColors[cls] + '22', border: `3px solid ${icraColors[cls]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', flexDirection: 'column' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: icraColors[cls] }}>{byIcra[cls] || 0}</div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: icraColors[cls] }}>Class {cls}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>
              {Object.values(byIcra).reduce((a, b) => a + b, 0)} of {total} submissions have ICRA class assigned
            </div>
          </div>

          {/* Permits Required */}
          <div style={card}>
            <div style={secTitle}>Permits Required</div>
            {Object.entries(permits).map(([permit, count]) => (
              <div key={permit} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>{permit}</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#007a86' }}>{count} ({total > 0 ? Math.round(count/total*100) : 0}%)</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: total > 0 ? `${(count/total)*100}%` : '0%', background: '#007a86', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Top Buildings */}
          <div style={{ ...card, gridColumn: '1 / -1' }}>
            <div style={secTitle}>Top Buildings by Submission Count</div>
            {topBuildings.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>No data yet</div>
            ) : (
              topBuildings.map(([building, count]) => (
                <div key={building} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', width: '220px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{building}</div>
                  <div style={{ flex: 1, height: '20px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count/maxBuilding)*100}%`, background: '#ba0c2f', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff' }}>{count}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Print button */}
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <button onClick={() => window.print()} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>🖨️ Print Report</button>
        </div>

      </div>
    </div>
  )
}
