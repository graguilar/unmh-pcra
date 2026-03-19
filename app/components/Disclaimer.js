'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Disclaimer({ docId, projectName, onAccept }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Check if already acknowledged this session
  useEffect(() => {
    const key = `disclaimer_${docId}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) {
      onAccept()
    }
  }, [docId])

  async function handleAccept() {
    if (!name.trim()) { setError('Please type your full legal name to acknowledge.'); return }
    setSaving(true)
    await supabase.from('disclaimer_acknowledgements').insert({
      doc_id: docId,
      acknowledged_by: name.trim(),
    })
    sessionStorage.setItem(`disclaimer_${docId}`, '1')
    onAccept()
    setSaving(false)
  }

  function handleDecline() {
    window.history.back()
  }

  const sections = [
    ['Hospital Policies & Procedures', 'All work must comply with current UNMH policies, procedures, and the approved Pre-Construction Risk Assessment at all times for the duration of the project.'],
    ['Patient & Visitor Standards', 'Respectful conduct toward patients, visitors, and all hospital staff is required at all times. Patient privacy and dignity must be maintained in all circumstances.'],
    ['Language & Conduct — On/Near Site', 'Professional language and conduct is required on, in, and near all project sites and hospital premises throughout the duration of the project and any related projects discussed in this PCRA.'],
    ['Infection Control Compliance', 'Infection control measures per the assigned ICRA Class must be strictly observed. Containment barriers must be maintained and dust migration outside the work area is not permitted.'],
    ['Safety & Permit Requirements', 'All required safety permits must be posted at the job site. Appropriate PPE must be worn at all times. Any safety violation may result in immediate work stoppage.'],
    ['Access, Badging & Authorization', 'Valid UNMH badge with EC designation is required at all times. Flu shot sticker required during flu season. Unauthorized access to patient care areas is strictly prohibited.'],
    ['Reporting Requirements', 'Any safety incidents, near-misses, or PCRA violations must be reported immediately to the UNMH Project Manager and Environmental Safety Department.'],
    ['Consequences of Non-Compliance', 'Failure to comply with PCRA requirements, hospital policies, or conduct standards may result in removal from the facility, contract termination, and/or legal action.'],
  ]

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '8px', maxWidth: '860px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div style={{ background: '#ba0c2f', color: '#fff', padding: '18px 24px', flexShrink: 0 }}>
          <div style={{ fontWeight: '900', fontSize: '16px', marginBottom: '4px' }}>⚠️ UNMH Pre-Construction Risk Assessment</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>Facility Entry, Conduct & Compliance Acknowledgement — Signature Required</div>
          {projectName && <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '4px' }}>Project: {projectName} · Doc ID: {docId}</div>}
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>

          {/* Main acknowledgement text */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px 18px', marginBottom: '18px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Acknowledgement of Expected Behaviors & Compliance</div>
            <p style={{ fontSize: '14px', color: '#1f2937', lineHeight: '1.7', margin: 0 }}>
              I (we) have been instructed on the expected behaviors of non-hospital staff, contractors, sub-contractors and any other individuals associated with this project and any other projects discussed in this PCRA up to and including hospital policies, procedures and patient/visitor standards, to include language on, in and near sites while on premises.
            </p>
          </div>

          {/* 8 compliance sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
            {sections.map(([title, body]) => (
              <div key={title} style={{ borderLeft: '3px solid #ba0c2f', paddingLeft: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#ba0c2f', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.55' }}>{body}</div>
              </div>
            ))}
          </div>

          {/* Signature area */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              ✍️ Typed Legal Name = Electronic Signature
            </div>
            <div style={{ fontSize: '12px', color: '#374151', marginBottom: '10px' }}>
              By typing your full legal name below and clicking "I Acknowledge", you confirm that you have read, understood, and agree to comply with all requirements stated above.
            </div>
            <input
              type='text'
              placeholder='Type your full legal name here...'
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAccept()}
              style={{ width: '100%', padding: '10px 14px', border: error ? '1.5px solid #dc2626' : '1.5px solid #86efac', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
            />
            {error && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>{error}</div>}
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>
              * This acknowledgement is logged with your name and timestamp and stored in the project file.
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#f9fafb' }}>
          <button onClick={handleDecline} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 22px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
            ✗ Decline — Go Back
          </button>
          <button onClick={handleAccept} disabled={saving} style={{ background: saving ? '#9ca3af' : '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 28px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
            {saving ? 'Saving...' : '✓ I Acknowledge & Agree — Enter Project'}
          </button>
        </div>

      </div>
    </div>
  )
}