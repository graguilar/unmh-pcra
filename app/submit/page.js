'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ENV_SAFETY_EMAIL = 'evsafety@salud.unm.edu'
const LIFE_SAFETY_EMAIL = 'lfsafety@salud.unm.edu'
const INFECTION_CONTROL_EMAIL = 'ic@salud.unm.edu'

const FLOORS = [
  'Basement', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor',
  '5th Floor', '6th Floor', '7th Floor', '8th Floor', '9th Floor',
  'Helipad', 'Rooftop', 'Other'
]

export default function SubmitPage() {
  const [step, setStep] = useState(1)
  const [buildings, setBuildings] = useState([])
  const [staff, setStaff] = useState([])
  const [additionalAttendees, setAdditionalAttendees] = useState([{ name: '', email: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [docId, setDocId] = useState('')
  const [inviteSent, setInviteSent] = useState(false)

  const [form, setForm] = useState({
    requesterName: '',
    requesterEmail: '',
    projectName: '',
    projectId: '',
    building: '',
    floor: '',
    projectManager: '',
    contractors: '',
    gcContact: '',
    duration: '',
    startDate: '',
    meetingDate: '',
    meetingTime: '',durationNum: '',
    durationUnit: 'weeks',
priority: 'standard',
  })

  useEffect(() => {
    loadBuildings()
    loadStaff()
    const id = 'RA-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000)
    setDocId(id)
  }, [])

  async function loadBuildings() {
    const { data } = await supabase.from('buildings').select('*').eq('active', true).order('name')
    if (data) setBuildings(data)
  }

  async function loadStaff() {
    const { data } = await supabase.from('staff').select('*').eq('active', true).order('name')
    if (data) setStaff(data)
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addAttendee() {
    setAdditionalAttendees(prev => [...prev, { name: '', email: '' }])
  }

  function removeAttendee(index) {
    setAdditionalAttendees(prev => prev.filter((_, i) => i !== index))
  }

  function updateAttendee(index, field, value) {
    setAdditionalAttendees(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  function sendOutlookInvite() {
    const allAttendees = [
      ENV_SAFETY_EMAIL,
      LIFE_SAFETY_EMAIL,
      INFECTION_CONTROL_EMAIL,
      ...additionalAttendees.filter(a => a.email).map(a => a.email)
    ].join(';')

    const subject = encodeURIComponent('PCRA Meeting — ' + form.projectName + ' — ' + docId)
    const body = encodeURIComponent(
      'Pre-Construction Risk Assessment Meeting\n' +
      '========================================\n' +
      'Document ID:      ' + docId + '\n' +
      'Project:          ' + form.projectName + '\n' +
      'Building:         ' + form.building + '\n' +
      'Floor / Location: ' + form.floor + '\n' +
      'Project Manager:  ' + form.projectManager + '\n' +
      'Requested By:     ' + form.requesterName + ' (' + form.requesterEmail + ')\n' +
      '\nPlease join the MS Teams meeting at the scheduled time.\n' +
      '\nThis meeting is required prior to construction commencement.\n' +
      '\nDocument ID ' + docId + ' will be used to track this PCRA assessment.'
    )

    const startDate = form.meetingDate && form.meetingTime
      ? new Date(form.meetingDate + 'T' + form.meetingTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      : ''

    const owaUrl = 'https://outlook.office.com/calendar/action/compose?to=' +
      encodeURIComponent(allAttendees) +
      '&subject=' + subject +
      '&body=' + body +
      (startDate ? '&startdt=' + startDate : '') +
      '&online=true'

    window.open(owaUrl, '_blank')
    setInviteSent(true)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const { error } = await supabase.from('submissions').insert([{
        doc_id: docId,
        requester_name: form.requesterName,
        requester_email: form.requesterEmail,
        project_name: form.projectName,
        start_date: form.startDate || null,
        project_manager: form.projectManager,
        duration: form.durationNum + ' ' + form.durationUnit,
        contractors: form.contractors,
        gc_contact: form.gcContact,
        building: form.building,
        location: form.floor,
        status: 'submitted',
priority: form.priority || 'standard',
      }])

      if (error) throw error

      // Send confirmation email
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.requesterEmail,
          subject: 'PCRA Meeting Scheduled — ' + docId,
          html: `
            <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#ba0c2f;color:#fff;padding:24px;text-align:center;">
                <div style="font-size:22px;font-weight:900;letter-spacing:0.05em;">UNMH Environmental Safety</div>
                <div style="font-size:13px;opacity:0.85;margin-top:4px;">Pre-Construction Risk Assessment</div>
              </div>
              <div style="padding:32px;background:#fff;border:1px solid #e5e7eb;">
                <p style="font-size:16px;color:#111;">Greetings ${form.requesterName},</p>
                <p style="color:#444;line-height:1.6;">Your Pre-Construction Risk Assessment meeting has been successfully scheduled.</p>
                <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #ba0c2f;">
                  <table style="width:100%;font-size:14px;color:#333;">
                    <tr><td style="padding:6px 0;font-weight:700;width:160px;">Document ID:</td><td style="color:#ba0c2f;font-weight:700;">${docId}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:700;">Project:</td><td>${form.projectName}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:700;">Building:</td><td>${form.building}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:700;">Floor / Location:</td><td>${form.floor}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:700;">Project Manager:</td><td>${form.projectManager}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:700;">Date Scheduled:</td><td>${new Date().toLocaleDateString()}</td></tr>
                  </table>
                </div>
                <p style="color:#444;line-height:1.6;">A MS Teams meeting invite has been sent to all required attendees.</p>
                <p style="color:#444;line-height:1.6;"><strong>Please retain your Document ID — you will need it to complete the full PCRA assessment after your meeting.</strong></p>
                <div style="margin:32px 0;text-align:center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://unmh-pcra.vercel.app'}/contact/${docId}"
                     style="background:#007a86;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">
                    Contact PCRA Team →
                  </a>
                </div>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
                <p style="color:#666;font-size:13px;line-height:1.6;">
                  Having issues with scheduling or accessing your PCRA?<br/>
                  Click the button above to send a message to the coordinator.
                </p>
              </div>
              <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#888;">
                Regards, UNMH PCRA Team<br/>University of New Mexico Hospital
              </div>
            </div>
          `
        })
      })

      await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_submission',
        docId,
        projectName: form.projectName,
        building: form.building,
        requesterName: form.requesterName,
        requesterEmail: form.requesterEmail,
        meetingDate: form.meetingDate,
        meetingTime: form.meetingTime,
        projectManager: form.projectManager,
      })
    })

    setStep(3)
    } catch (err) {
      alert('Error submitting: ' + err.message)
    }
    setSubmitting(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box',
    fontFamily: 'Segoe UI,sans-serif'
  }
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '700', color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px'
  }
  const sectionStyle = {
    background: '#fff', borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '16px', overflow: 'hidden'
  }
  const sectionHeaderStyle = {
    background: '#007a86', color: '#fff', padding: '12px 20px',
    fontWeight: '700', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase'
  }
  const gridStyle = {
    display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px', padding: '20px'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Segoe UI,sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '14px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '0.05em' }}>UNMH — Environmental Safety</div>
            <div style={{ fontSize: '11px', opacity: '0.85' }}>Pre-Construction Risk Assessment — Schedule Meeting</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
            {docId}
          </div>
        </div>
      </div>

      {/* Progress */}
      {step < 3 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[{ n: 1, label: 'Project Details' }, { n: 2, label: 'Schedule Meeting' }].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0,
                  background: step > s.n ? '#10b981' : step === s.n ? '#ba0c2f' : '#e5e7eb',
                  color: step >= s.n ? '#fff' : '#999'
                }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontSize: '13px', fontWeight: step === s.n ? '700' : '400', color: step === s.n ? '#ba0c2f' : '#666' }}>
                  {s.label}
                </span>
                {i < 1 && <div style={{ flex: 1, height: '2px', background: step > s.n ? '#10b981' : '#e5e7eb' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>Requestor Information</div>
              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Your Full Name *</label>
                  <input style={inputStyle} value={form.requesterName} onChange={e => update('requesterName', e.target.value)} placeholder="First Last" />
                </div>
                <div>
                  <label style={labelStyle}>Your Work Email *</label>
                  <input style={inputStyle} type="email" value={form.requesterEmail} onChange={e => update('requesterEmail', e.target.value)} placeholder="you@salud.unm.edu" />
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>Project Information</div>
              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Project Name *</label>
                  <input style={inputStyle} value={form.projectName} onChange={e => update('projectName', e.target.value)} placeholder="e.g. ICU Renovation Phase 1" />
                </div>
                <div>
                  <label style={labelStyle}>Project ID / Number</label>
                  <input style={inputStyle} value={form.projectId} onChange={e => update('projectId', e.target.value)} placeholder="e.g. PRJ-2026-047" />
                </div>
                <div>
                  <label style={labelStyle}>Building *</label>
                  <select style={inputStyle} value={form.building} onChange={e => update('building', e.target.value)}>
                    <option value="">— Select Building —</option>
                    {buildings.map(b => <option key={b.id} value={b.name}>{b.code} — {b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Floor / Location *</label>
                  <select style={inputStyle} value={form.floor} onChange={e => update('floor', e.target.value)}>
                    <option value="">— Select Floor —</option>
                    {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Project Manager *</label>
                  <select style={inputStyle} value={form.projectManager} onChange={e => update('projectManager', e.target.value)}>
                    <option value="">— Select PM —</option>
                    {staff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Estimated Start Date</label>
                  <input style={inputStyle} type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                </div><div>
  <label style={labelStyle}>Request Priority *</label>
  <div style={{ display: 'flex', gap: '10px' }}>
    {['standard', 'urgent', 'emergency'].map(p => (
      <button key={p} type="button"
        onClick={() => update('priority', p)}
        style={{
          flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700,
          fontSize: '13px', textTransform: 'capitalize', border: '2px solid',
          borderColor: form.priority === p ? (p === 'standard' ? '#007a86' : p === 'urgent' ? '#d97706' : '#ba0c2f') : '#e2e8f0',
          background: form.priority === p ? (p === 'standard' ? '#f0fdfa' : p === 'urgent' ? '#fffbeb' : '#fef2f2') : '#fff',
          color: form.priority === p ? (p === 'standard' ? '#007a86' : p === 'urgent' ? '#d97706' : '#ba0c2f') : '#6b7280',
        }}>
        {p === 'standard' ? '📋 Standard' : p === 'urgent' ? '⚡ Urgent' : '🚨 Emergency'}
      </button>
    ))}
  </div>
  {form.priority !== 'standard' && (
    <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', fontSize: '12px',
      background: form.priority === 'urgent' ? '#fffbeb' : '#fef2f2',
      color: form.priority === 'urgent' ? '#d97706' : '#ba0c2f',
      border: `1px solid ${form.priority === 'urgent' ? '#d97706' : '#ba0c2f'}` }}>
      {form.priority === 'urgent' ? '⚡ Urgent requests are reviewed within 24–48 hours. A coordinator will contact you immediately.' : '🚨 Emergency requests trigger immediate notification to all coordinators. Use only for critical facility needs.'}
    </div>
  )}
</div>
                <div>
                  <div style={{gridColumn:'span 2'}}>
  <label style={labelStyle}>Project Duration</label>
  <div style={{display:'flex',gap:'10px'}}>
    <input 
      style={{...inputStyle, width:'120px'}} 
      type="number" 
      min="1"
      value={form.durationNum} 
      onChange={e => update('durationNum', e.target.value)} 
      placeholder="e.g. 6" 
    />
    <select 
      style={{...inputStyle, flex:1}} 
      value={form.durationUnit} 
      onChange={e => update('durationUnit', e.target.value)}>
      <option value="days">Day(s)</option>
      <option value="weeks">Week(s)</option>
      <option value="months">Month(s)</option>
      <option value="years">Year(s)</option>
    </select>
  </div>
</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>GC Contact / Phone</label>
                  <input style={inputStyle} value={form.gcContact} onChange={e => update('gcContact', e.target.value)} placeholder="Contact name and phone number" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => {
                if (!form.requesterName || !form.requesterEmail || !form.projectName || !form.building || !form.floor || !form.projectManager) {
                  alert('Please fill in all required fields marked with *')
                  return
                }
                setStep(2)
              }} style={{ background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                Next: Schedule Meeting →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>Meeting Date & Time</div>
              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Preferred Meeting Date *</label>
                  <input style={inputStyle} type="date" value={form.meetingDate} onChange={e => update('meetingDate', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Preferred Meeting Time *</label>
                  <input style={inputStyle} type="time" value={form.meetingTime} onChange={e => update('meetingTime', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>Fixed Attendees — Always Included</div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  The following departments are automatically included in every PCRA meeting:
                </p>
                {[
                  { label: 'Environmental Safety', email: ENV_SAFETY_EMAIL },
                  { label: 'Life Safety', email: LIFE_SAFETY_EMAIL },
                  { label: 'Infection Control', email: INFECTION_CONTROL_EMAIL },
                ].map(a => (
                  <div key={a.email} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '6px', marginBottom: '8px', border: '1px solid #86efac' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>{a.label}</div>
                      <div style={{ fontSize: '12px', color: '#16a34a' }}>{a.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>Additional Attendees</div>
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  Add contractors, vendors, or any other staff who should attend:
                </p>
                {additionalAttendees.map((attendee, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                    <div>
                      {index === 0 && <label style={labelStyle}>Name</label>}
                      <input style={inputStyle} value={attendee.name} onChange={e => updateAttendee(index, 'name', e.target.value)} placeholder="Full name" />
                    </div>
                    <div>
                      {index === 0 && <label style={labelStyle}>Email</label>}
                      <input style={inputStyle} type="email" value={attendee.email} onChange={e => updateAttendee(index, 'email', e.target.value)} placeholder="email@example.com" />
                    </div>
                    <button onClick={() => removeAttendee(index)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer', fontSize: '16px' }}>
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={addAttendee} style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>
                  + Add Another Attendee
                </button>
              </div>
            </div>

            {/* Send invite box */}
            <div style={{ background: inviteSent ? '#f0fdf4' : '#fffbeb', border: `1px solid ${inviteSent ? '#86efac' : '#fcd34d'}`, borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
              {inviteSent ? (
                <div>
                  <div style={{ fontWeight: '700', color: '#166534', marginBottom: '6px', fontSize: '15px' }}>✅ Outlook opened — please review and send the invite</div>
                  <p style={{ fontSize: '13px', color: '#166534', margin: '0' }}>Once you have sent the invite click the button below to complete your submission.</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>📅 Ready to send the Teams invite?</div>
                  <p style={{ fontSize: '13px', color: '#78350f', margin: '0 0 12px' }}>
                    Click below to open Outlook with a pre-filled MS Teams meeting invite. Review and click Send.
                  </p>
                  <button onClick={sendOutlookInvite} style={{ background: '#0078D4', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    📧 Open Outlook & Send Teams Invite
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!form.meetingDate || !form.meetingTime) {
                    alert('Please select a meeting date and time')
                    return
                  }
                  handleSubmit()
                }}
                disabled={submitting}
                style={{ background: submitting ? '#9ca3af' : '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 28px', fontSize: '15px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : '✅ Complete Submission'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirmation */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111', marginBottom: '8px' }}>Meeting Scheduled Successfully!</h1>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
              A confirmation email has been sent to <strong>{form.requesterEmail}</strong>
            </p>

            <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px', minWidth: '320px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>Your Document ID</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#ba0c2f', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '8px' }}>{docId}</div>
              <div style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '16px' }}>Save this — you will need it to complete the PCRA assessment after your meeting</div>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '16px' }} />
              <table style={{ width: '100%', fontSize: '13px' }}>
                <tbody>
                  <tr><td style={{ fontWeight: '700', padding: '4px 0', width: '120px' }}>Project:</td><td>{form.projectName}</td></tr>
                  <tr><td style={{ fontWeight: '700', padding: '4px 0' }}>Building:</td><td>{form.building}</td></tr>
                  <tr><td style={{ fontWeight: '700', padding: '4px 0' }}>Floor:</td><td>{form.floor}</td></tr>
                  <tr><td style={{ fontWeight: '700', padding: '4px 0' }}>PM:</td><td>{form.projectManager}</td></tr>
                  <tr><td style={{ fontWeight: '700', padding: '4px 0' }}>Meeting:</td><td>{form.meetingDate} at {form.meetingTime}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px' }}>
              <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>📋 Next Steps</div>
              <ol style={{ textAlign: 'left', fontSize: '13px', color: '#78350f', margin: '0', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Attend the MS Teams meeting with all parties</li>
                <li>After the meeting, complete the full PCRA assessment</li>
                <li>Use your Document ID <strong>{docId}</strong> to access your assessment</li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
  <a href="/portal" style={{ background: '#007a86', color: '#fff', padding: '12px 32px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '15px' }}>
    Go to My Portal →
  </a>
</div>
          </div>
        )}

      </div>
    </div>
  )
}
