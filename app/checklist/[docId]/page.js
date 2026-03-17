'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const CHECKLISTS = {
  infection_control: {
    title: 'Infection Control Checklist',
    icon: '🦠',
    color: '#007a86',
    items: [
      'Containment barriers are intact and dust-tight',
      'Negative air pressure verified (value < 0)',
      'HEPA filtration unit is operating',
      'Sticky mats in place at all exits from work area',
      'Workers entering/exiting using proper PPE',
      'No visible dust migration outside barrier',
      'All ceiling penetrations sealed',
      'HVAC isolated/removed as required by ICRA class',
      'Waste contained in covered containers',
      'Work area maintained clean and orderly',
    ]
  },
  environmental_safety: {
    title: 'Environmental Safety Check',
    icon: '🏗️',
    color: '#f59e0b',
    items: [
      'All egress pathways and exit doors free and clear',
      'Exit signs and lights functional and visible',
      'Fire extinguishers present, inspected, and accessible',
      'No wires or cables placed on fire sprinkler piping',
      'All penetrations through fire/smoke barriers sealed',
      'Portable fire extinguishers installed correctly (4" off floor, max 5 ft height)',
      'Construction debris removed by clean covered cart',
      'Hazardous materials properly labeled and stored',
      'Tools and equipment secured and stored safely',
      'No tripping hazards in work area or egress paths',
    ]
  },
  pm_inspection: {
    title: 'PM Site Inspection',
    icon: '📋',
    color: '#3b82f6',
    items: [
      'Pre-Construction Risk Assessment document on site',
      'All permits posted at job site',
      'Contractors displaying valid UNMH badge with EC designation',
      'Flu shot sticker displayed (during flu season)',
      'Work area compliant with PCRA requirements',
      'Infection control measures in place per ICRA class',
      'Life safety measures maintained',
      'No unauthorized personnel in work area',
      'All required signage posted at area entrances',
      'Project progressing per approved scope of work',
    ]
  },
  hot_work: {
    title: 'Hot Work Daily Check',
    icon: '🔥',
    color: '#ef4444',
    items: [
      'Hot Work Permit posted at job site',
      'Fire extinguisher on hand — adequate type and size',
      'All operators trained in fire extinguisher use',
      'Fire suppression system in operation',
      'All combustible/flammable materials cleared 35 ft minimum',
      'Proper ventilation maintained throughout operation',
      'Shielding or welding blankets in place if required',
      'Fire spotter assigned and present',
      'Warning signs posted to prevent unauthorized access',
      'Cutting/welding equipment checked and in working order',
      'Fire watch will continue for 1 hour after completion',
    ]
  }
}

export default function ChecklistPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const docId = params.docId
  const type = searchParams.get('type') || 'infection_control'
  const checklist = CHECKLISTS[type] || CHECKLISTS.infection_control

  const [submission, setSubmission] = useState(null)
  const [checks, setChecks] = useState({})
  const [completedBy, setCompletedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('submissions').select('*').eq('doc_id', docId).single()
      if (data) setSubmission(data)
      setLoading(false)
    }
    load()
  }, [docId])

  function toggleCheck(i) {
    setChecks(c => ({ ...c, [i]: !c[i] }))
  }

  const checkedCount = Object.values(checks).filter(Boolean).length
  const allChecked = checkedCount === checklist.items.length

  async function handleSubmit() {
    if (!completedBy.trim()) { alert('Please enter your name'); return }
    if (checkedCount === 0) { alert('Please complete at least one check item'); return }
    setSubmitting(true)

    const { error } = await supabase.from('daily_checklists').insert({
      doc_id: docId,
      submission_id: submission?.id,
      checklist_type: type,
      completed_by: completedBy.trim(),
      items: checks,
      notes: notes.trim(),
    })

    if (error) { alert('Error submitting: ' + error.message); setSubmitting(false); return }

    // Email project manager
    if (submission?.project_manager) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily_checklist',
          docId,
          projectName: submission.project_name,
          building: submission.building,
          checklistType: checklist.title,
          completedBy: completedBy.trim(),
          checkedCount,
          totalItems: checklist.items.length,
          notes: notes.trim(),
          projectManager: submission.project_manager,
          requesterEmail: submission.requester_email,
        })
      })
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: checklist.color, color: '#fff', padding: '16px 20px' }}>
        <div style={{ fontSize: '24px', marginBottom: '4px' }}>{checklist.icon}</div>
        <div style={{ fontWeight: '900', fontSize: '16px' }}>{checklist.title}</div>
        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
          {docId} {submission ? `· ${submission.project_name}` : ''} {submission ? `· ${submission.building}` : ''}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
        {submitted ? (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '900', color: '#111' }}>Checklist Submitted!</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
              {checkedCount} of {checklist.items.length} items verified by <strong>{completedBy}</strong>
            </p>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px' }}>
              {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}
            </p>
            <button onClick={() => { setSubmitted(false); setChecks({}); setCompletedBy(''); setNotes('') }} style={{ background: checklist.color, color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
              Submit Another
            </button>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Progress</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: checklist.color }}>{checkedCount} / {checklist.items.length}</span>
              </div>
              <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(checkedCount / checklist.items.length) * 100}%`, background: checklist.color, borderRadius: '4px', transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Checklist items */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tap to check each item</div>
              {checklist.items.map((item, i) => (
                <div key={i} onClick={() => toggleCheck(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer', background: checks[i] ? checklist.color + '15' : '#f9fafb', border: `1.5px solid ${checks[i] ? checklist.color : '#e5e7eb'}`, transition: 'all 0.15s' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${checks[i] ? checklist.color : '#d1d5db'}`, background: checks[i] ? checklist.color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    {checks[i] && <span style={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '14px', lineHeight: '1.5', color: checks[i] ? '#111' : '#374151', fontWeight: checks[i] ? '700' : '400' }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Notes / Issues Found (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder='Describe any issues, deficiencies, or corrective actions taken...' style={{ width: '100%', padding: '10px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', height: '80px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            {/* Name + Submit */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Your Name *</label>
              <input type='text' placeholder='Full name and title' value={completedBy} onChange={e => setCompletedBy(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '12px' }} />
              <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', background: checklist.color, color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : `✅ Submit ${checklist.title}`}
              </button>
              <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
                {new Date().toLocaleDateString()} · {docId}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
