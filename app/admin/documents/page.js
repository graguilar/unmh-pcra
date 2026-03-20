 'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(null)
  const [newDoc, setNewDoc] = useState({ name: '', type: 'Permit', description: '' })

  useEffect(() => { fetchDocs() }, [])
useEffect(() => {
    const session = sessionStorage.getItem('director_session')
    if (!session) router.push('/director/login')
  }, [])
  async function fetchDocs() {
    const { data } = await supabase.from('policy_documents').select('*').order('type').order('name')
    setDocs(data || [])
    setLoading(false)
  }

  async function handleApprove(doc) {
    const name = prompt(`Enter approver name for "${doc.name}":`)
    if (!name) return
    const reviewDate = prompt('Next review date (YYYY-MM-DD):',
      new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0])
    if (!reviewDate) return
    setSaving(doc.id)
    await supabase.from('policy_documents').update({
      approved_by: name,
      approved_date: new Date().toISOString().split('T')[0],
      next_review_date: reviewDate,
      updated_at: new Date().toISOString()
    }).eq('id', doc.id)
    await fetchDocs()
    setSaving(null)
  }

  async function handleRemove(doc) {
    if (!confirm(`Remove "${doc.name}"? This cannot be undone.`)) return
    await supabase.from('policy_documents').delete().eq('id', doc.id)
    await fetchDocs()
  }

  async function handleAdd() {
    if (!newDoc.name.trim()) { alert('Name is required'); return }
    setSaving('new')
    await supabase.from('policy_documents').insert({
      name: newDoc.name.trim(),
      type: newDoc.type,
      description: newDoc.description.trim()
    })
    setNewDoc({ name: '', type: 'Permit', description: '' })
    setShowAdd(false)
    await fetchDocs()
    setSaving(null)
  }

  async function exportLog() {
    const rows = [['Name', 'Type', 'Description', 'Approved By', 'Approved Date', 'Next Review']]
    docs.forEach(d => rows.push([d.name, d.type, d.description || '', d.approved_by || 'Pending', d.approved_date || '—', d.next_review_date || '—']))
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'PCRA_Document_Approvals.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const typeColor = { Permit: '#2563eb', Policy: '#059669', Procedure: '#7c3aed', Standard: '#d97706' }
  const typeBg = { Permit: '#eff6ff', Policy: '#f0fdf4', Procedure: '#faf5ff', Standard: '#fffbeb' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '16px' }}>UNMH PCRA — Admin</div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>Document & Policy Approval</div>
        </div>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
          ← Dashboard
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 16px' }}>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a2332' }}>Permits & Policies</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Manage document approvals and annual review schedules</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportLog}
              style={{ background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
              Export Log
            </button>
            <button onClick={() => setShowAdd(true)}
              style={{ background: '#007a86', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
              + Add Document
            </button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: '#fff', border: '1.5px solid #007a86', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a2332', marginBottom: '14px' }}>Add New Document</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Name *</label>
                <input value={newDoc.name} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  placeholder='Document name' />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Type</label>
                <select value={newDoc.type} onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option>Permit</option>
                  <option>Policy</option>
                  <option>Procedure</option>
                  <option>Standard</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Description</label>
                <input value={newDoc.description} onChange={e => setNewDoc({ ...newDoc, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  placeholder='Brief description' />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleAdd} disabled={saving === 'new'}
                style={{ background: '#007a86', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                {saving === 'new' ? 'Saving...' : 'Save Document'}
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ background: '#f3f4f6', border: 'none', color: '#374151', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 2.5fr 1.4fr 1.1fr 1.1fr 1.2fr', background: '#1a2332', padding: '10px 16px', gap: '8px' }}>
            {['Document / Policy', 'Type', 'Description', 'Approved By', 'Approved Date', 'Next Review', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
          ) : docs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No documents yet. Click "+ Add Document" to get started.</div>
          ) : docs.map((doc, i) => {
            const isOverdue = doc.next_review_date && new Date(doc.next_review_date) < new Date()
            const isDueSoon = doc.next_review_date && !isOverdue &&
              new Date(doc.next_review_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            return (
              <div key={doc.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 0.8fr 2.5fr 1.4fr 1.1fr 1.1fr 1.2fr',
                padding: '12px 16px', gap: '8px', alignItems: 'center',
                background: i % 2 === 0 ? '#fff' : '#f9fafb',
                borderBottom: '1px solid #f3f4f6',
                borderLeft: `4px solid ${doc.approved_by ? '#059669' : '#d97706'}`
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a2332' }}>{doc.name}</div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: typeColor[doc.type] || '#374151',
                    background: typeBg[doc.type] || '#f3f4f6', padding: '2px 8px', borderRadius: '4px',
                    border: `1px solid ${typeColor[doc.type] || '#e2e8f0'}` }}>
                    {doc.type}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{doc.description || '—'}</div>
                <div style={{ fontSize: '12px', color: doc.approved_by ? '#1a2332' : '#d97706', fontWeight: doc.approved_by ? 400 : 700 }}>
                  {doc.approved_by || 'Pending'}
                </div>
                <div style={{ fontSize: '12px', color: '#1a2332' }}>{doc.approved_date || '—'}</div>
                <div>
                  {doc.next_review_date ? (
                    <span style={{ fontSize: '11px', fontWeight: 700,
                      color: isOverdue ? '#ba0c2f' : isDueSoon ? '#d97706' : '#059669',
                      background: isOverdue ? '#fef2f2' : isDueSoon ? '#fffbeb' : '#f0fdf4',
                      padding: '2px 8px', borderRadius: '4px',
                      border: `1px solid ${isOverdue ? '#ba0c2f' : isDueSoon ? '#d97706' : '#059669'}` }}>
                      {isOverdue ? '⚠️ ' : ''}{doc.next_review_date}
                    </span>
                  ) : <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleApprove(doc)} disabled={saving === doc.id}
                    style={{ background: '#007a86', border: 'none', color: '#fff', padding: '5px 10px',
                      borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                    {saving === doc.id ? '...' : 'Approve'}
                  </button>
                  <button onClick={() => handleRemove(doc)}
                    style={{ background: '#fee2e2', border: '1px solid #ba0c2f', color: '#ba0c2f', padding: '5px 8px',
                      borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary row */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
          <span>Total: <strong>{docs.length}</strong></span>
          <span>Approved: <strong style={{ color: '#059669' }}>{docs.filter(d => d.approved_by).length}</strong></span>
          <span>Pending: <strong style={{ color: '#d97706' }}>{docs.filter(d => !d.approved_by).length}</strong></span>
          <span>Overdue: <strong style={{ color: '#ba0c2f' }}>{docs.filter(d => d.next_review_date && new Date(d.next_review_date) < new Date()).length}</strong></span>
        </div>
      </div>
    </div>
  )
}