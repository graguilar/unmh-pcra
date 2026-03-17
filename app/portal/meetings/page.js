 'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function MeetingsPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('portal_email')
    if (saved) {
      setEmail(saved)
      supabase.from('submissions').select('*')
        .eq('requester_email', saved)
        .order('meeting_date', { ascending: false })
        .then(({ data }) => { setSubmissions(data || []); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [])

  const statusColors = {
    submitted: '#f59e0b', in_review: '#3b82f6',
    approved: '#10b981', closed: '#6b7280', cancelled: '#ef4444',
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '16px' }}>UNMH PCRA</div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>My Meeting History</div>
        </div>
        <a href='/portal' style={{ color: '#fff', fontSize: '13px', fontWeight: '700', textDecoration: 'none', opacity: 0.85 }}>← Back to Portal</a>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '900', color: '#111' }}>📅 My Meeting History</h2>

          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
              <div style={{ fontWeight: '700', marginBottom: '8px' }}>No meetings yet</div>
              <a href='/submit' style={{ background: '#ba0c2f', color: '#fff', padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>Schedule New PCRA →</a>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Doc ID', 'Project', 'Building', 'Meeting Date', 'PM', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#555', borderBottom: '1px solid #e5e7eb', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#ba0c2f' }}>{s.doc_id}</td>
                    <td style={{ padding: '12px 14px' }}>{s.project_name || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>{s.building || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>{s.meeting_date || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>{s.project_manager || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: (statusColors[s.status] || '#6b7280') + '22', color: statusColors[s.status] || '#6b7280', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                        {s.status?.replace('_', ' ') || 'Submitted'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <a href={`/assess/${s.doc_id}`} style={{ color: '#007a86', fontWeight: '700', fontSize: '12px', textDecoration: 'none', marginRight: '12px' }}>View Assessment</a>
                      <a href={`/contact/${s.doc_id}`} style={{ color: '#6b7280', fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>Contact</a>
                    </td>
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