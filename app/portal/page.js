'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PortalPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [user, setUser] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)

    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('requester_email', email)
      .order('created_at', { ascending: false })

    setSubmissions(data || [])
    setUser(email)
    setSubmitted(true)
    setLoading(false)
  }

  const menuItems = [
    {
      icon: '📋',
      title: 'Schedule New PCRA',
      desc: 'Start a new pre-construction risk assessment request',
      color: '#ba0c2f',
      href: '/submit',
    },
    {
      icon: '📁',
      title: 'My PCRAs',
      desc: submissions.length > 0 ? `You have ${submissions.length} submission${submissions.length !== 1 ? 's' : ''}` : 'View and manage your submitted assessments',
      color: '#007a86',
      href: '#my-pcras',
    },
    {
      icon: '✏️',
      title: 'Update PCRA / Addendum',
      desc: 'Add updates or amendments to an existing assessment',
      color: '#007a86',
      href: '#my-pcras',
    },
    {
      icon: '🔧',
      title: 'Update Permit / Addendum',
      desc: 'Amend an existing permit',
      color: '#007a86',
      href: '#my-pcras',
    },
    {
      icon: '🖨️',
      title: 'Print PCRA',
      desc: 'Print or save your assessment as PDF',
      color: '#007a86',
      href: '#my-pcras',
    },
    {
      icon: '📚',
      title: 'Review Documents',
      desc: 'SOPs, Policies & Procedures, Regulatory Documents',
      color: '#1d4ed8',
      href: '/portal/documents',
    },
    {
      icon: '💬',
      title: 'Contact PCRA Team',
      desc: 'Send a message to the coordinator',
      color: '#065f46',
      href: '/contact',
    },
    {
      icon: '💡',
      title: 'Suggest Enhancements',
      desc: 'Help us improve the PCRA process',
      color: '#92400e',
      href: '/portal/suggestions',
    },
    {
      icon: '📅',
      title: 'My Meeting History',
      desc: 'View past and upcoming PCRA meetings',
      color: '#5b21b6',
      href: '#my-pcras',
    },
    {
      icon: '❓',
      title: 'Help / FAQ',
      desc: 'Common questions about the PCRA process',
      color: '#374151',
      href: '/portal/help',
    },
  ]

  const statusColor = {
    submitted: '#f59e0b',
    in_review: '#3b82f6',
    approved: '#10b981',
    closed: '#6b7280',
    draft: '#9ca3af'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Segoe UI,sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '14px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '0.05em' }}>UNMH — Environmental Safety</div>
            <div style={{ fontSize: '11px', opacity: '0.85' }}>Pre-Construction Risk Assessment — Requestor Portal</div>
          </div>
          {submitted && (
            <button onClick={() => { setSubmitted(false); setUser(null); setEmail('') }}
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Sign Out
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Email login */}
        {!submitted && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏥</div>
                <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#111', margin: '0 0 8px' }}>PCRA Requestor Portal</h1>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Enter your work email to access your portal</p>
              </div>
              <form onSubmit={handleEmailSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@salud.unm.edu"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: loading ? '#9ca3af' : '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Loading...' : 'Access My Portal →'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Portal dashboard */}
        {submitted && (
          <div>
            {/* Welcome */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111', margin: '0 0 4px' }}>
                Welcome back! 👋
              </h2>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{user}</p>
            </div>

            {/* Menu grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '24px' }}>
              {menuItems.map((item, i) => (
                <a key={i} href={item.href}
                  style={{ background: '#fff', borderRadius: '8px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `4px solid ${item.color}`, transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}>
                  <span style={{ fontSize: '28px', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#111', marginBottom: '2px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>{item.desc}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '18px', flexShrink: 0 }}>›</span>
                </a>
              ))}
            </div>

            {/* My PCRAs section */}
            <div id="my-pcras" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ background: '#007a86', color: '#fff', padding: '12px 20px', fontWeight: '700', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                My PCRA Submissions
              </div>
              {submissions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>No submissions yet</div>
                  <div style={{ fontSize: '13px', marginBottom: '16px' }}>Schedule your first PCRA to get started</div>
                  <a href="/submit" style={{ background: '#ba0c2f', color: '#fff', padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                    Schedule New PCRA →
                  </a>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Doc ID', 'Project', 'Building', 'PM', 'Status', 'Date'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', color: '#555', borderBottom: '1px solid #e5e7eb', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s, i) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#ba0c2f' }}>{s.doc_id}</td>
                          <td style={{ padding: '12px 16px' }}>{s.project_name || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>{s.building || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>{s.project_manager || '—'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: statusColor[s.status] + '20', color: statusColor[s.status], padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                              {s.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#666' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
