 'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AddendumPage() {
  const { docId } = useParams()
  const router = useRouter()
  const [submission, setSubmission] = useState(null)
  const [addendums, setAddendums] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newAddendum, setNewAddendum] = useState({
    amended_by: '',
    amended_by_email: '',
    reason: '',
    changes: [{ section: '', description: '' }]
  })

  useEffect(() => { fetchData() }, [docId])

  async function fetchData() {
    const { data: sub } = await supabase.from('submissions').select('*').eq('doc_id', docId).single()
    const { data: adds } = await supabase.from('addendums').select('*').eq('parent_doc_id', docId).order('addendum_number')
    setSubmission(sub)
    setAddendums(adds || [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!newAddendum.amended_by.trim()) { alert('Amended by name is required'); return }
    if (!newAddendum.reason.trim()) { alert('Reason is required'); return }
    setSaving(true)

    const nextNum = (addendums.length + 1)
    const newDocId = `${docId}-A${nextNum}`

    await supabase.from('addendums').insert({
      parent_doc_id: docId,
      parent_id: submission?.id,
      addendum_number: nextNum,
      doc_id: newDocId,
      amended_by: newAddendum.amended_by.trim(),
      amended_by_email: newAddendum.amended_by_email.trim(),
      reason: newAddendum.reason.trim(),
      changes: newAddendum.changes.filter(c => c.section.trim()),
      status: 'active'
    })

    setNewAddendum({ amended_by: '', amended_by_email: '', reason: '', changes: [{ section: '', description: '' }] })
    setCreating(false)
    await fetchData()
    setSaving(false)
  }

  function addChange() {
    setNewAddendum({ ...newAddendum, changes: [...newAddendum.changes, { section: '', description: '' }] })
  }

  function updateChange(i, field, val) {
    const updated = [...newAddendum.changes]
    updated[i][field] = val
    setNewAddendum({ ...newAddendum, changes: updated })
  }

  function removeChange(i) {
    setNewAddendum({ ...newAddendum, changes: newAddendum.changes.filter((_, idx) => idx !== i) })
  }

  function handlePrint(add) {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>${add.doc_id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a2332; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg);
          font-size: 96px; font-weight: 900; color: rgba(186,12,47,0.12); pointer-events: none; z-index: 0; white-space: nowrap; }
        .content { position: relative; z-index: 1; }
        .header { background: #ba0c2f; color: white; padding: 16px 24px; margin: -40px -40px 24px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }
        .doc-id { float: right; font-size: 16px; font-weight: 900; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        td:first-child { font-weight: 700; color: #6b7280; width: 160px; }
        .changes-header { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 8px; }
        .change-item { background: #fffbeb; border: 1px solid #d97706; border-left: 4px solid #d97706; padding: 10px 14px; margin-bottom: 8px; border-radius: 4px; }
        .change-section { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
        .change-desc { font-size: 12px; color: #6b7280; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #9ca3af; }
        @media print { .watermark { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head>
      <body>
        <div class="watermark">ADDENDUM</div>
        <div class="content">
          <div class="header">
            <span class="doc-id">${add.doc_id}</span>
            <h1>UNMH Pre-Construction Risk Assessment</h1>
            <p>Amendment / Addendum Document</p>
          </div>
          <table>
            <tr><td>Parent Document:</td><td>${add.parent_doc_id}</td></tr>
            <tr><td>Addendum #:</td><td>A${add.addendum_number} — ${add.addendum_number === 1 ? 'First' : add.addendum_number === 2 ? 'Second' : add.addendum_number === 3 ? 'Third' : add.addendum_number + 'th'} Amendment</td></tr>
            <tr><td>Amended By:</td><td>${add.amended_by}</td></tr>
            <tr><td>Amendment Date:</td><td>${new Date(add.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            <tr><td>Reason:</td><td>${add.reason}</td></tr>
            <tr><td>Status:</td><td>${add.status?.toUpperCase()}</td></tr>
          </table>
          <div class="changes-header">Changed Sections</div>
          ${(add.changes || []).map(c => `
            <div class="change-item">
              <div class="change-section">${c.section}</div>
              <div class="change-desc">${c.description}</div>
            </div>
          `).join('')}
          <div class="footer">
            UNMH PCRA System · University of New Mexico Hospital · Generated ${new Date().toLocaleDateString()}
          </div>
        </div>
        <script>window.onload = () => window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  if (loading) return <div style={{ padding: '40px', fontFamily: 'system-ui', color: '#6b7280' }}>Loading...</div>
  if (!submission) return <div style={{ padding: '40px', fontFamily: 'system-ui', color: '#ba0c2f' }}>Submission not found.</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '16px' }}>UNMH PCRA — Addendum</div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>{docId} · {submission.project_name || 'Project'}</div>
        </div>
        <button onClick={() => router.push(`/dashboard/${submission.id}`)}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
          ← Back to Submission
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 16px' }}>

        {/* Parent info card */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid #ba0c2f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Parent Document</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a2332' }}>{docId}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{submission.project_name} · {submission.building_name} · {submission.requester_name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Addendums</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: addendums.length > 0 ? '#ba0c2f' : '#9ca3af' }}>{addendums.length}</div>
            </div>
          </div>
        </div>

        {/* Existing addendums */}
        {addendums.map(add => (
          <div key={add.id} style={{ background: '#fff', borderRadius: '8px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid #d97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#1a2332' }}>{add.doc_id}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: '#fffbeb', color: '#d97706', border: '1px solid #d97706', padding: '2px 8px', borderRadius: '4px' }}>
                    ADDENDUM A{add.addendum_number}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Amended by <strong>{add.amended_by}</strong> · {new Date(add.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '13px', color: '#374151', marginTop: '6px' }}><strong>Reason:</strong> {add.reason}</div>
              </div>
              <button onClick={() => handlePrint(add)}
                style={{ background: '#1a2332', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                🖨 Print / PDF
              </button>
            </div>

            {/* Changed sections */}
            {(add.changes || []).length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Changed Sections</div>
                {add.changes.map((c, i) => (
                  <div key={i} style={{ background: '#fffbeb', border: '1px solid #d97706', borderLeft: '4px solid #d97706', padding: '10px 14px', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a2332', marginBottom: '2px' }}>{c.section}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Create new addendum */}
        {creating ? (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1.5px solid #007a86' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#1a2332', marginBottom: '20px' }}>
              New Addendum — {docId}-A{addendums.length + 1}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Amended By *</label>
                <input value={newAddendum.amended_by} onChange={e => setNewAddendum({ ...newAddendum, amended_by: e.target.value })}
                  placeholder='Full name'
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Email</label>
                <input value={newAddendum.amended_by_email} onChange={e => setNewAddendum({ ...newAddendum, amended_by_email: e.target.value })}
                  placeholder='email@salud.unm.edu'
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Reason for Amendment *</label>
              <textarea value={newAddendum.reason} onChange={e => setNewAddendum({ ...newAddendum, reason: e.target.value })}
                placeholder='Describe why this addendum is being created...'
                rows={2}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>

            {/* Changed sections */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Changed Sections</div>
              {newAddendum.changes.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input value={c.section} onChange={e => updateChange(i, 'section', e.target.value)}
                    placeholder='§ Section name'
                    style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }} />
                  <input value={c.description} onChange={e => updateChange(i, 'description', e.target.value)}
                    placeholder='What changed...'
                    style={{ padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '12px' }} />
                  <button onClick={() => removeChange(i)}
                    style={{ background: '#fee2e2', border: 'none', color: '#ba0c2f', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>✕</button>
                </div>
              ))}
              <button onClick={addChange}
                style={{ background: '#f3f4f6', border: '1.5px dashed #d1d5db', color: '#6b7280', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                + Add Section
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCreate} disabled={saving}
                style={{ background: '#ba0c2f', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                {saving ? 'Creating...' : 'Create Addendum'}
              </button>
              <button onClick={() => setCreating(false)}
                style={{ background: '#f3f4f6', border: 'none', color: '#374151', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)}
            style={{ width: '100%', background: '#fff', border: '2px dashed #007a86', color: '#007a86', padding: '16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
            + Create New Addendum
          </button>
        )}
      </div>
    </div>
  )
}
