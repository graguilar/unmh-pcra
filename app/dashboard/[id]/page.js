'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function SubmissionDetail() {
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [auditLog, setAuditLog] = useState([])
  const [saving, setSaving] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setUser(session.user)
    loadSubmission()
    loadAuditLog()
  }

  async function loadSubmission() {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', params.id)
      .single()
    if (!error && data) {
      setSubmission(data)
      setStatus(data.status)
    }
    setLoading(false)
  }

  async function loadAuditLog() {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .eq('submission_id', params.id)
      .order('created_at', { ascending: false })
    if (data) setAuditLog(data)
  }

  async function saveStatus() {
    if (!submission || status === submission.status) return
    setSaving(true)
    const oldStatus = submission.status

    const { error } = await supabase
      .from('submissions')
      .update({ status })
      .eq('id', params.id)

    if (!error) {
      await supabase.from('audit_log').insert([{
        submission_id: params.id,
        changed_by: user?.email,
        old_status: oldStatus,
        new_status: status,
        note: 'Status updated'
      }])
      setSubmission({ ...submission, status })
      loadAuditLog()
    }
    setSaving(false)
  }

  async function saveNote() {
    if (!note.trim()) return
    setSavingNote(true)
    await supabase.from('audit_log').insert([{
      submission_id: params.id,
      changed_by: user?.email,
      old_status: submission.status,
      new_status: submission.status,
      note: note.trim()
    }])
    setNote('')
    loadAuditLog()
    setSavingNote(false)
  }

  const statusColor = {
    submitted: '#f59e0b',
    in_review: '#3b82f6',
    approved: '#10b981',
    closed: '#6b7280',
    draft: '#9ca3af'
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Segoe UI,sans-serif'}}>
      <div style={{color:'#666'}}>Loading submission...</div>
    </div>
  )

  if (!submission) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Segoe UI,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px',marginBottom:'12px'}}>❌</div>
        <div style={{fontWeight:'700'}}>Submission not found</div>
        <button onClick={() => router.push('/dashboard')} style={{marginTop:'16px',background:'#ba0c2f',color:'#fff',border:'none',borderRadius:'6px',padding:'10px 20px',cursor:'pointer'}}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f3f4f6',fontFamily:'Segoe UI,sans-serif'}}>

      {/* Header */}
      <div style={{background:'#ba0c2f',color:'#fff',padding:'14px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <button onClick={() => router.push('/dashboard')} style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'6px',padding:'6px 14px',cursor:'pointer',fontSize:'13px',fontWeight:'600'}}>
            ← Back
          </button>
          <div>
            <div style={{fontWeight:'900',fontSize:'18px'}}>UNMH — Environmental Safety</div>
            <div style={{fontSize:'11px',opacity:'0.85'}}>Submission Detail — {submission.doc_id}</div>
          </div>
        </div>
        <span style={{background:statusColor[submission.status]+'40',color:'#fff',padding:'4px 12px',borderRadius:'12px',fontSize:'12px',fontWeight:'700',textTransform:'uppercase',border:'1px solid rgba(255,255,255,0.4)'}}>
          {submission.status?.replace('_',' ')}
        </span>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'24px 16px'}}>

        {/* Project Info */}
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',marginBottom:'16px',overflow:'hidden'}}>
          <div style={{background:'#007a86',color:'#fff',padding:'12px 20px',fontWeight:'700',fontSize:'13px',letterSpacing:'0.05em',textTransform:'uppercase'}}>
            Project Information
          </div>
          <div style={{padding:'20px',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px'}}>
            {[
              ['Document ID', submission.doc_id],
              ['Project Name', submission.project_name],
              ['Building / Location', submission.building],
              ['Project Manager', submission.project_manager],
              ['Start Date', submission.start_date ? new Date(submission.start_date).toLocaleDateString() : '—'],
              ['Duration', submission.duration],
              ['Contractors', submission.contractors],
              ['GC Contact', submission.gc_contact],
              ['Requester Name', submission.requester_name],
              ['Requester Email', submission.requester_email],
              ['ICRA Class', submission.icra_class ? 'Class ' + submission.icra_class : '—'],
              ['Submitted', new Date(submission.created_at).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{fontSize:'10px',fontWeight:'700',color:'#888',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'3px'}}>{label}</div>
                <div style={{fontSize:'14px',color:'#111',fontWeight: label==='Document ID'?'700':'400',color: label==='Document ID'?'#ba0c2f':'#111'}}>{value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Permits */}
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',marginBottom:'16px',overflow:'hidden'}}>
          <div style={{background:'#007a86',color:'#fff',padding:'12px 20px',fontWeight:'700',fontSize:'13px',letterSpacing:'0.05em',textTransform:'uppercase'}}>
            Permits Required
          </div>
          <div style={{padding:'20px',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px'}}>
            {[
              ['🔥', 'Hot Work Permit', submission.has_hot_work],
              ['⚡', 'Energized Electrical Work Permit', submission.has_energized],
              ['⚠️', 'Confined Space Entry Permit', submission.has_confined],
              ['🏗️', 'Above Ceiling Work Inspection', submission.has_above_ceiling],
            ].map(([icon, label, active]) => (
              <div key={label} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px',borderRadius:'6px',background:active?'#f0fdf4':'#f9fafb',border:`1px solid ${active?'#86efac':'#e5e7eb'}`}}>
                <span style={{fontSize:'20px'}}>{icon}</span>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'600',color:active?'#166534':'#6b7280'}}>{label}</div>
                  <div style={{fontSize:'11px',color:active?'#16a34a':'#9ca3af',fontWeight:'700'}}>{active ? '✓ REQUIRED' : 'Not Required'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Update */}
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',marginBottom:'16px',overflow:'hidden'}}>
          <div style={{background:'#007a86',color:'#fff',padding:'12px 20px',fontWeight:'700',fontSize:'13px',letterSpacing:'0.05em',textTransform:'uppercase'}}>
            Update Status
          </div>
          <div style={{padding:'20px',display:'flex',alignItems:'center',gap:'12px'}}>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{padding:'10px 14px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',flex:1,cursor:'pointer'}}>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={saveStatus} disabled={saving || status===submission.status} style={{background:saving||status===submission.status?'#9ca3af':'#007a86',color:'#fff',border:'none',borderRadius:'6px',padding:'10px 24px',fontSize:'14px',fontWeight:'700',cursor:saving||status===submission.status?'not-allowed':'pointer',whiteSpace:'nowrap'}}>
              {saving ? 'Saving...' : 'Save Status'}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',marginBottom:'16px',overflow:'hidden'}}>
          <div style={{background:'#007a86',color:'#fff',padding:'12px 20px',fontWeight:'700',fontSize:'13px',letterSpacing:'0.05em',textTransform:'uppercase'}}>
            Add Coordinator Note
          </div>
          <div style={{padding:'20px'}}>
            <textarea
              value={note}
              onChange={e=>setNote(e.target.value)}
              placeholder="Add a note about this submission..."
              rows={3}
              style={{width:'100%',padding:'10px 12px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',resize:'vertical',boxSizing:'border-box',fontFamily:'Segoe UI,sans-serif'}}
            />
            <button onClick={saveNote} disabled={savingNote||!note.trim()} style={{marginTop:'10px',background:savingNote||!note.trim()?'#9ca3af':'#ba0c2f',color:'#fff',border:'none',borderRadius:'6px',padding:'10px 24px',fontSize:'14px',fontWeight:'700',cursor:savingNote||!note.trim()?'not-allowed':'pointer'}}>
              {savingNote ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>

        {/* Audit Trail */}
        <div style={{background:'#fff',borderRadius:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',overflow:'hidden'}}>
          <div style={{background:'#007a86',color:'#fff',padding:'12px 20px',fontWeight:'700',fontSize:'13px',letterSpacing:'0.05em',textTransform:'uppercase'}}>
            Audit Trail
          </div>
          <div style={{padding:'20px'}}>
            {auditLog.length === 0 ? (
              <div style={{color:'#9ca3af',fontSize:'13px',textAlign:'center',padding:'20px'}}>No activity yet</div>
            ) : (
              auditLog.map((log, i) => (
                <div key={log.id} style={{display:'flex',gap:'12px',paddingBottom:'12px',marginBottom:'12px',borderBottom:i<auditLog.length-1?'1px solid #f3f4f6':'none'}}>
                  <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#007a86',marginTop:'5px',flexShrink:0}}></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',color:'#111'}}>
                      {log.old_status !== log.new_status ? (
                        <span>Status changed from <strong>{log.old_status?.replace('_',' ')}</strong> to <strong>{log.new_status?.replace('_',' ')}</strong></span>
                      ) : (
                        <span>Note added</span>
                      )}
                    </div>
                    {log.note && log.note !== 'Status updated' && (
                      <div style={{fontSize:'13px',color:'#555',marginTop:'4px',fontStyle:'italic'}}>"{log.note}"</div>
                    )}
                    <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'4px'}}>
                      {log.changed_by} · {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}