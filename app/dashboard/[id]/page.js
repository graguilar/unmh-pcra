'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SubmissionDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [auditLog, setAuditLog] = useState([])
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const statusColors = {
    submitted: '#f59e0b',
    in_review: '#3b82f6',
    approved: '#10b981',
    closed: '#6b7280',
    cancelled: '#ef4444',
  }

  useEffect(() => {
    async function load() {
      const { data: sub } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single()
      if (sub) {
        setSubmission(sub)
        setStatus(sub.status || 'submitted')
      }

      const { data: logs } = await supabase
        .from('audit_log')
        .select('*')
        .eq('submission_id', id)
        .order('created_at', { ascending: false })
      if (logs) setAuditLog(logs)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('submission_id', id)
        .order('created_at', { ascending: true })
      if (msgs) setMessages(msgs)

      setLoading(false)
    }
    load()
  }, [id])

  async function handleStatusSave() {
    setSavingStatus(true)
    await supabase.from('submissions').update({ status }).eq('id', id)
    await supabase.from('audit_log').insert({
      submission_id: id,
      action: 'Status changed to ' + status,
      performed_by: 'Coordinator',
    })
    if (submission?.requester_email) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_change',
          docId: submission.doc_id,
          projectName: submission.project_name,
          requesterEmail: submission.requester_email,
          newStatus: status,
        })
      })
    }
    setSavedMsg('Status saved!')
    setTimeout(() => setSavedMsg(''), 3000)
    setSavingStatus(false)
  }

  async function handleNoteSave() {
    if (!note.trim()) return
    setSavingNote(true)
    await supabase.from('audit_log').insert({
      submission_id: id,
      action: 'Note: ' + note.trim(),
      performed_by: 'Coordinator',
    })
    const { data: logs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: false })
    if (logs) setAuditLog(logs)
    setNote('')
    setSavedMsg('Note saved!')
    setTimeout(() => setSavedMsg(''), 3000)
    setSavingNote(false)
  }

  async function handleReply(msgId, senderEmail) {
    if (!reply.trim()) return
    setSendingReply(true)
    await supabase.from('messages').update({
      coordinator_reply: reply.trim(),
      replied_at: new Date().toISOString(),
    }).eq('id', msgId)

    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'coordinator_reply',
        docId: submission.doc_id,
        projectName: submission.project_name,
        reply: reply.trim(),
        requesterEmail: senderEmail,
      }),
    })

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: true })
    if (msgs) setMessages(msgs)
    setReply('')
    setSendingReply(false)
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading...</div>
  if (!submission) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui', color: '#dc2626' }}>Submission not found.</div>

  const s = submission
  const card = { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }
  const val = { fontSize: '14px', fontWeight: '600', color: '#111' }
  const secTitle = { fontSize: '15px', fontWeight: '800', color: '#111', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '2px solid #f3f4f6' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '0.05em' }}>UNMH PCRA — Submission Detail</div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>{s.doc_id} · {s.project_name}</div>
        </div>
        <span style={{ background: (statusColors[s.status] || '#6b7280') + '33', color: statusColors[s.status] || '#6b7280', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {s.status?.replace('_', ' ') || 'Submitted'}
        </span>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Project Info */}
        <div style={card}>
          <div style={secTitle}>Project Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <div><span style={lbl}>Document ID</span><span style={{ ...val, color: '#ba0c2f', fontSize: '16px' }}>{s.doc_id}</span></div>
            <div><span style={lbl}>Project Name</span><span style={val}>{s.project_name || '—'}</span></div>
            <div><span style={lbl}>Project Manager</span><span style={val}>{s.project_manager || '—'}</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '16px' }}>
            <div><span style={lbl}>Building</span><span style={val}>{s.building || '—'}</span></div>
            <div><span style={lbl}>Floor</span><span style={val}>{s.floor || '—'}</span></div>
            <div><span style={lbl}>Meeting Date</span><span style={val}>{s.meeting_date || '—'}</span></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div><span style={lbl}>Requestor</span><span style={val}>{s.requester_name || '—'}</span></div>
            <div><span style={lbl}>Requestor Email</span><span style={val}>{s.requester_email || '—'}</span></div>
            <div><span style={lbl}>Submitted</span><span style={val}>{new Date(s.created_at).toLocaleDateString()}</span></div>
          </div>
        </div>

        {/* Permits */}
        <div style={card}>
          <div style={secTitle}>Permits Required</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            {[['🔥 Hot Work', s.has_hot_work], ['⚡ Energized Elec.', s.has_energized], ['⚠️ Confined Space', s.has_confined], ['🏗️ Above Ceiling', s.has_above_ceiling]].map(([label, val]) => (
              <div key={label} style={{ background: val ? '#fef3c7' : '#f9fafb', border: `1px solid ${val ? '#fcd34d' : '#e5e7eb'}`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{label.split(' ')[0]}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>{label.substring(2)}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: val ? '#d97706' : '#9ca3af', marginTop: '4px' }}>{val ? 'REQUIRED' : 'Not Required'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div style={card}>
          <div style={secTitle}>Update Status</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', flex: 1, maxWidth: '280px' }}>
              <option value='submitted'>Submitted</option>
              <option value='in_review'>In Review</option>
              <option value='approved'>Approved</option>
              <option value='closed'>Closed</option>
              <option value='cancelled'>Cancelled</option>
            </select>
            <button onClick={handleStatusSave} disabled={savingStatus} style={{ background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
              {savingStatus ? 'Saving...' : 'Save Status'}
            </button>
            {savedMsg && <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>✓ {savedMsg}</span>}
          </div>
        </div>

        {/* Messages */}
        <div style={card}>
          <div style={secTitle}>Messages from Requestor {messages.length > 0 && <span style={{ background: '#ba0c2f', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '12px', marginLeft: '8px' }}>{messages.length}</span>}</div>
          {messages.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>No messages yet.</div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#f9fafb', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '13px' }}>{msg.sender_name}</span>
                    <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>{msg.sender_email}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div style={{ padding: '12px 14px', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{msg.message}</div>
                {msg.coordinator_reply ? (
                  <div style={{ background: '#f0fdf4', borderTop: '1px solid #86efac', padding: '10px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>YOUR REPLY · {new Date(msg.replied_at).toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>{msg.coordinator_reply}</div>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '12px 14px' }}>
                    <textarea
                      placeholder='Type your reply...'
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', height: '72px', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                    <button onClick={() => handleReply(msg.id, msg.sender_email)} disabled={sendingReply} style={{ marginTop: '8px', background: '#007a86', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                      {sendingReply ? 'Sending...' : '✉️ Send Reply'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Notes / Audit */}
        <div style={card}>
          <div style={secTitle}>Add Coordinator Note</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='Add a note about this submission...'
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', height: '90px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <button onClick={handleNoteSave} disabled={savingNote} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            {savingNote ? 'Saving...' : 'Save Note'}
          </button>
        </div>

        {/* Audit Trail */}
        <div style={card}>
          <div style={secTitle}>Audit Trail</div>
          {auditLog.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>No activity yet.</div>
          ) : (
            auditLog.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#007a86', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#374151' }}>{log.action}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{log.performed_by} · {new Date(log.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <a href='/dashboard' style={{ background: '#6b7280', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>← Back to Dashboard</a>
          <a href={`/assess/${s.doc_id}`} style={{ background: '#007a86', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>📋 Open Assessment</a>
<a href={`/poster/${s.doc_id}`} style={{ background: '#1f2937', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>📱 Print Poster</a>
          <button onClick={() => window.print()} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>🖨️ Print</button>
        </div>
      </div>
    </div>
  )
}
