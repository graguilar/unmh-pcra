'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Disclaimer from '../../components/Disclaimer'

const SECTION_TAGS = [
  'General', 'ICRA', 'Hot Work', 'Confined Space', 'Energized Electrical',
  'Above Ceiling', 'Life Safety', 'Asbestos Assessment', 'Barrier Documentation',
  'Crane Permit', 'Site Photo', 'Other'
]

function AttachmentsSection({ docId }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [tag, setTag] = useState('General')

  useEffect(() => { loadFiles() }, [docId])

  async function loadFiles() {
    const { data } = await supabase.storage.from('pcra-attachments').list(docId + '/')
    if (data) {
      const withUrls = await Promise.all(data.map(async f => {
        const { data: urlData } = supabase.storage.from('pcra-attachments').getPublicUrl(docId + '/' + f.name)
        return { ...f, url: urlData.publicUrl, tag: f.name.split('__')[0] || 'General' }
      }))
      setFiles(withUrls)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `${tag}__${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('pcra-attachments').upload(`${docId}/${fileName}`, file)
    if (!error) await loadFiles()
    setUploading(false)
  }

  async function handleDelete(fileName) {
    await supabase.storage.from('pcra-attachments').remove([`${docId}/${fileName}`])
    await loadFiles()
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Tag attachment to section</label>
        <select value={tag} onChange={e => setTag(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
          {SECTION_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <label style={{ display: 'block', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>{uploading ? 'Uploading...' : '📎 Click to browse or drag & drop'}</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>PDF, DOC, JPG, PNG — Max 25MB</div>
        <input type='file' style={{ display: 'none' }} onChange={handleUpload} accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.heic' />
      </label>
      {files.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Attached Files ({files.length})</div>
          {files.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{f.name.split('__').slice(1).join('__')}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{f.tag} · {new Date(f.created_at).toLocaleDateString()}</div>
              </div>
              <a href={f.url} target='_blank' rel='noreferrer' style={{ fontSize: '12px', color: '#007a86', fontWeight: '700', textDecoration: 'none' }}>View</a>
              <button onClick={() => handleDelete(f.name)} style={{ fontSize: '12px', color: '#ba0c2f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {files.length === 0 && <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '16px' }}>No attachments yet</div>}
      <div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>
        📎 All attachments are automatically included as an addendum when printing the PCRA
      </div>
    </div>
  )
}
const ICRA_MATRIX = {
  'A': { 'Low': 'I', 'Medium': 'I', 'High': 'II', 'Highest': 'II' },
  'B': { 'Low': 'I', 'Medium': 'II', 'High': 'III', 'Highest': 'III' },
  'C': { 'Low': 'II', 'Medium': 'III', 'High': 'III', 'Highest': 'IV' },
  'D': { 'Low': 'III', 'Medium': 'III', 'High': 'IV', 'Highest': 'IV' },
}
const icraColors = { 'I': '#16a34a', 'II': '#ca8a04', 'III': '#ea580c', 'IV': '#dc2626' }

export default function AssessPage() {
  const params = useParams()
  const docId = params.docId
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [assessmentId, setAssessmentId] = useState(null)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [form, setForm] = useState({
    contractors: '', gc_contact: '', project_description: '',
    project_type_repair: false, project_type_renovation: false, project_type_modification: false,
    project_type_reconstruction: false, project_type_addition: false,
    scope_of_work: '', pcra_expiration_date: '', pcra_renewal_required: '',
    barrier_duration: '', barrier_comments: '',
    barrier_type_plastic: false, barrier_type_gypsum_single: false, barrier_type_gypsum_double: false,
    barrier_type_comments: '',
    bh_required: false, bh_notes: '',
    crane_required: false, crane_notes: '',
    crane_permit_project_name: '', crane_permit_location: '', crane_permit_start_date: '',
    crane_permit_manager: '', crane_permit_duration: '', crane_permit_contractors: '',
    crane_permit_description: '', crane_permit_notes: '',
    asbestos_required: false, asbestos_notes: '',
    noise_required: false, noise_departments: '', noise_reduction: '',
    vibration_required: false, vibration_departments: '', vibration_reduction: '',
    odors_required: false, odors_departments: '', odors_reduction: '',
    air_quality_plan: '',
    util_fire_alarm: false, util_fire_suppression: false, util_electrical: false,
    util_water: false, util_medical_gas: false, util_sewage: false, util_hvac: false,
    util_comments: '', pm_inspection_frequency: '',
    hazmat_required: false, hazmat_notes: '',
    scaffold_required: false, scaffold_notes: '',
    fall_required: false, fall_notes: '',
    lift_required: false, lift_notes: '',
    loto_required: false, loto_notes: '',
    loto_permit_project_name: '', loto_permit_location: '', loto_permit_start_date: '',
    loto_permit_manager: '', loto_permit_contractors: '', loto_permit_description: '',
    loto_permit_energy_sources: '', loto_permit_procedures: '', loto_permit_notes: '',
    energized_required: false,
    energized_project_name: '', energized_location_project: '', energized_start_date: '',
    energized_manager: '', energized_room: '', energized_duration: '',
    energized_panel_description: '', energized_equipment: '', energized_other_equipment: '',
    energized_foreign_voltage: '', energized_contractors: '', energized_gc_contact: '',
    energized_work_description: '',
    energized_j1_power_off: '', energized_j1_power_off_notes: '',
    energized_j2_life_support: '', energized_j2_notes: '',
    energized_j3_infeasible: '', energized_j3_notes: '',
    energized_justification: '', energized_special_considerations: '',
    energized_loto_50_600: '', energized_loto_601_15k: '',
    energized_doc_circuits: false, energized_doc_schematic: false,
    energized_doc_flash_hazard: false, energized_doc_restriction: false,
    energized_doc_location_map: false, energized_doc_step_by_step: false,
    energized_doc_licenses: false, energized_doc_cpr: false,
    energized_req_job_procedures: false, energized_req_safe_work: false,
    energized_req_restriction: false, energized_req_briefing: false, energized_req_backup: false,
    energized_shock_voltage: '', energized_shock_limited: '', energized_shock_restricted: '',
    energized_shock_ppe: '', energized_arc_label: '', energized_arc_distance: '',
    energized_arc_energy: '', energized_arc_ppe: '', energized_arc_boundary: '',
    energized_safety_lighting: false, energized_safety_barricades: false, energized_safety_insulated: false,
    energized_pm_name: '', energized_engineer_name: '', energized_safety_officer_name: '',
    energized_facility_manager_name: '', energized_agree: '', energized_gc_agree: '', energized_elec_agree: '',
    hot_required: false,
    hot_project_name: '', hot_location_project: '', hot_start_date: '',
    hot_manager: '', hot_duration: '', hot_contractors: '', hot_gc_contact: '', hot_description: '',
    hot_permit_duration_daily: false, hot_permit_duration_project: false,
    hot_permit_duration_weekly: false, hot_permit_duration_annual: false,
    hot_type_welding: false, hot_type_tack: false, hot_type_cutting: false,
    hot_type_sweating: false, hot_type_brazing: false, hot_type_hottap: false,
    hot_type_soldering: false, hot_type_other: '',
    hot_unit_acetylene: false, hot_unit_butane: false, hot_unit_electric: false, hot_unit_other: '',
    hot_check_extinguisher: '', hot_check_suppression: '', hot_check_combustibles: '',
    hot_check_ventilation: '', hot_check_protection: '', hot_check_spotter: '',
    hot_check_notifications: '', hot_check_equipment: '',
    hot_special_precautions: '',
    hot_pm_name: '', hot_safety_name: '', hot_lifesafety_name: '',
    hot_gc_name: '', hot_operator_name: '', hot_spotter_name: '',
    confined_required: false,
    confined_project_name: '', confined_location_project: '', confined_start_date: '',
    confined_manager: '', confined_duration: '', confined_contractors: '',
    confined_gc_contact: '', confined_description: '',
    confined_duration_daily: false, confined_duration_project: false,
    confined_duration_weekly: false, confined_duration_annual: false,
    confined_hazard_injury: false, confined_hazard_residue: false, confined_hazard_dust: false,
    confined_hazard_flash: false, confined_hazard_engulfment: false,
    confined_hazard_inflow_solid: false, confined_hazard_outflow: false,
    confined_hazard_lighting: false, confined_hazard_steam: false, confined_hazard_footing: false,
    confined_hazard_atmosphere: false, confined_hazard_fall: false,
    confined_hazard_electrocution: false, confined_hazard_machinery: false, confined_hazard_other: '',
    confined_test_o2: '', confined_test_lel: '', confined_test_h2s: '', confined_test_co: '',
    confined_precaution_barricade: false, confined_precaution_ventilation: false, confined_precaution_other: '',
    confined_during_surveillance: '', confined_during_ventilation: '', confined_during_monitor: '',
    confined_during_respirator: '', confined_during_ppe: '', confined_during_harness: '',
    confined_during_hoist: '', confined_during_gfi: '', confined_during_other: '',
    confined_special_precautions: '',
    confined_emergency_agency: '', confined_emergency_access: '',
    confined_emergency_small_opening: '', confined_emergency_foreseeable: '', confined_emergency_worst_case: '',
    confined_pm_name: '', confined_safety_name: '', confined_gc_name: '', confined_personnel_name: '',
    form1_pm_name: '',
    construction_type: '', patient_risk_group: '', icra_class: '', icra_notes: '',
    icra_q1: '', icra_q2: '', icra_q3: '', icra_q4: '', icra_comments: '',
    icra_ipc_name: '',
    above_ceiling_required: false,
    ac_project_number: '', ac_manager: '', ac_inspection_type: '',
    ac_permit_start: '', ac_permit_end: '', ac_authorized_workers: '', ac_work_type: '',
    ac_check1: '', ac_check2: '', ac_check3: '', ac_check4: '', ac_check5: '', ac_check6: '',
    ac_special_conditions: '', ac_pm_name: '', ac_lifesafety_name: '', ac_facilities_name: '', ac_gc_name: '',
    access_doors_required: false, access_doors_comments: '',
    fire_system_required: false, fire_system_comments: '',
    barriers_required: false, barriers_comments: '',
    ilsm_location: '', ilsm_description: '',
    ilsm_q1: '', ilsm_q2: '', ilsm_q3: '', ilsm_q4: '', ilsm_q5: '', ilsm_q6: '', ilsm_q7: '',
    ilsm_special_conditions: '',
    ilsm_determination: '', ilsm_fire_watch: '',
    ls_pm_name: '', ls_lifesafety_name: '',
    ack_q1: '', ack_q2: '', ack_q3: '', ack_q4: '',
    sig_pm: '', sig_safety: '', sig_lifesafety: '', sig_ipc: '', sig_enduser: '',
    sig_staff1: '', sig_staff2: '', sig_staff3: '', sig_staff4: '', sig_staff5: '', sig_staff6: '',
    sig_sub1: '', sig_sub2: '', sig_sub3: '', sig_sub4: '', sig_sub5: '',
    status: 'draft',
  })

  useEffect(() => {
    async function load() {
      const { data: sub } = await supabase.from('submissions').select('*').eq('doc_id', docId).single()
      if (sub) setSubmission(sub)
      const { data: existing } = await supabase.from('assessments').select('*').eq('doc_id', docId).single()
      if (existing) { setAssessmentId(existing.id); setForm(f => ({ ...f, ...existing })) }
      setLoading(false)
    }
    load()
  }, [docId])

  useEffect(() => {
    if (form.construction_type && form.patient_risk_group) {
      const cls = ICRA_MATRIX[form.construction_type]?.[form.patient_risk_group] || ''
      setForm(f => ({ ...f, icra_class: cls }))
    }
  }, [form.construction_type, form.patient_risk_group])

  const isLocked = form.status === 'complete'
  function set(key, val) { if (isLocked) return; setForm(f => ({ ...f, [key]: val })) }

  async function handleSave(status = 'draft') {
    setSaving(true)
    const payload = { ...form, doc_id: docId, submission_id: submission?.id, status, updated_at: new Date().toISOString() }
    if (status === 'complete') payload.completed_at = new Date().toISOString()
    let error
    if (assessmentId) {
      const res = await supabase.from('assessments').update(payload).eq('id', assessmentId)
      error = res.error
    } else {
      const res = await supabase.from('assessments').insert(payload).select().single()
      error = res.error
      if (res.data) setAssessmentId(res.data.id)
    }
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else alert('Error saving: ' + error.message)
  }

  const lbl = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }
  const inp = { width: '100%', padding: '8px 11px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit' }
  const sel = { ...inp }
  const ta = { ...inp, height: '72px', resize: 'vertical' }
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }
  const row3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }
  const card = { background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '14px' }
  const secTitle = { fontSize: '15px', fontWeight: '800', color: '#111', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '2px solid #f3f4f6' }
  const subTitle = { fontSize: '13px', fontWeight: '700', color: '#374151', margin: '16px 0 10px' }
  const permitBox = { background: '#fefce8', border: '1.5px solid #fbbf24', borderRadius: '8px', padding: '20px', marginTop: '16px' }
  const permitTitle = { fontSize: '14px', fontWeight: '800', color: '#92400e', margin: '0 0 14px', paddingBottom: '8px', borderBottom: '1px solid #fcd34d' }
  const infoBox = { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '12px 14px', fontSize: '12px', color: '#0c4a6e', marginBottom: '14px', lineHeight: '1.6' }

  const steps = [
    { n: 1, label: 'Project Info' }, { n: 2, label: 'Barriers' }, { n: 3, label: 'Risk Items' },
    { n: 4, label: 'Air Quality' }, { n: 5, label: 'Utilities' }, { n: 6, label: 'Safety' },
    { n: 7, label: 'ICRA' }, { n: 8, label: 'Life Safety' }, { n: 9, label: 'Acknowledgement' }, { n: 10, label: 'Attachments' },

  function YNField({ label, fieldKey, notesKey, notesLabel, children }) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 14px', background: '#f9fafb' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', flex: 1 }}>{label}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer', fontWeight: '700', color: form[fieldKey] ? '#16a34a' : '#6b7280' }}>
            <input type='radio' name={fieldKey} checked={form[fieldKey] === true} onChange={() => set(fieldKey, true)} /> YES
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer', fontWeight: '700', color: form[fieldKey] === false ? '#dc2626' : '#6b7280' }}>
            <input type='radio' name={fieldKey} checked={form[fieldKey] === false} onChange={() => set(fieldKey, false)} /> NO
          </label>
        </div>
        {form[fieldKey] === true && (
          <div style={{ padding: '14px', borderTop: '1px solid #e5e7eb' }}>
            {notesKey && <div style={{ marginBottom: children ? '12px' : '0' }}><label style={lbl}>{notesLabel || 'Notes'}</label><textarea style={ta} value={form[notesKey] || ''} onChange={e => set(notesKey, e.target.value)} /></div>}
            {children}
          </div>
        )}
      </div>
    )
  }
}
const SECTION_TAGS = [
  'General', 'ICRA', 'Hot Work', 'Confined Space', 'Energized Electrical',
  'Above Ceiling', 'Life Safety', 'Asbestos Assessment', 'Barrier Documentation',
  'Crane Permit', 'Site Photo', 'Other'
]

function AttachmentsSection({ docId }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [tag, setTag] = useState('General')

  useEffect(() => { loadFiles() }, [docId])

  async function loadFiles() {
    const { data } = await supabase.storage.from('pcra-attachments').list(docId + '/')
    if (data) {
      const withUrls = await Promise.all(data.map(async f => {
        const { data: urlData } = supabase.storage.from('pcra-attachments').getPublicUrl(docId + '/' + f.name)
        return { ...f, url: urlData.publicUrl, tag: f.name.split('__')[0] || 'General' }
      }))
      setFiles(withUrls)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `${tag}__${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('pcra-attachments').upload(`${docId}/${fileName}`, file)
    if (!error) await loadFiles()
    setUploading(false)
  }

  async function handleDelete(fileName) {
    await supabase.storage.from('pcra-attachments').remove([`${docId}/${fileName}`])
    await loadFiles()
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Tag attachment to section</label>
        <select value={tag} onChange={e => setTag(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
          {SECTION_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <label style={{ display: 'block', border: '2px dashed #d1d5db', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>{uploading ? 'Uploading...' : '📎 Click to browse or drag & drop'}</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>PDF, DOC, JPG, PNG — Max 25MB</div>
        <input type='file' style={{ display: 'none' }} onChange={handleUpload} accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.heic' />
      </label>
      {files.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Attached Files ({files.length})</div>
          {files.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{f.name.split('__').slice(1).join('__')}</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{f.tag} · {new Date(f.created_at).toLocaleDateString()}</div>
              </div>
              <a hre

  function CheckRow({ label, fieldKey }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
        <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '13px', cursor: 'pointer', fontWeight: '600', color: form[fieldKey] ? '#16a34a' : '#374151' }}>
          <input type='checkbox' checked={!!form[fieldKey]} onChange={e => set(fieldKey, e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#16a34a' }} />
          {label}
        </label>
      </div>
    )
  }

  function SigTable({ rows }) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '12px' }}>
        <thead>
          <tr style={{ background: '#007a86' }}>
            <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'left', width: '30%' }}>Entity</th>
            <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'left' }}>Name (Typed = Signature)</th>
            <th style={{ padding: '8px 10px', color: '#fff', textAlign: 'left', width: '20%' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb', fontWeight: '700', fontSize: '12px' }}>{r.label}</td>
              <td style={{ padding: '4px 6px', border: '1px solid #e5e7eb' }}><input style={{ ...inp, border: 'none', borderBottom: '1px solid #d1d5db', borderRadius: '0', background: 'transparent' }} type='text' value={form[r.nameKey] || ''} onChange={e => set(r.nameKey, e.target.value)} /></td>
              <td style={{ padding: '6px 10px', border: '1px solid #e5e7eb', fontSize: '11px', color: '#6b7280' }}>{new Date().toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  function NavButtons({ prevStep, prevLabel, nextStep, nextLabel, isLast }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '32px' }}>
        {prevStep ? (
          <button onClick={() => setStep(prevStep)} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>← {prevLabel || 'Back'}</button>
        ) : <div />}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleSave('draft')} disabled={saving} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>💾 Save Draft</button>
          {isLast ? (
            <button onClick={() => { if (!form.icra_class) { alert('Please complete ICRA (Step 7) first.'); setStep(7); return; } handleSave('complete') }} disabled={saving} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 28px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>✅ Submit Assessment</button>
          ) : (
            <button onClick={() => setStep(nextStep)} style={{ background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>{nextLabel || 'Next'} →</button>
          )}
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading assessment...</div>
  if (!disclaimerAccepted) return <Disclaimer docId={docId} projectName={submission?.project_name} onAccept={() => setDisclaimerAccepted(true)} />
  if (!submission) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui', color: '#dc2626' }}>Submission not found: {docId}</div>

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f3f4f6' }}>

      {isLocked && (
        <div style={{ background: '#1f2937', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '3px solid #ba0c2f' }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '900', fontSize: '13px' }}>DOCUMENT LOCKED — Submitted {form.completed_at ? new Date(form.completed_at).toLocaleDateString() : ''}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>This assessment is locked. To make changes, create an Addendum.</div>
          </div>
        </div>
      )}

      <div style={{ background: '#ba0c2f', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '14px' }}>UNMH — Environmental Safety · Pre-Construction Risk Assessment</div>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>{submission.project_name} · {docId}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && <span style={{ background: '#16a34a', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>✓ Saved</span>}
          {!isLocked && <button onClick={() => handleSave('draft')} disabled={saving} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>}
        </div>
      </div>

      {/* Step progress bar */}
      <div style={{ background: '#1a2332', padding: '12px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '700px' }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div onClick={() => setStep(s.n)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '70px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', background: step === s.n ? '#ba0c2f' : step > s.n ? '#007a86' : 'rgba(255,255,255,0.15)', color: '#fff', marginBottom: '4px' }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <div style={{ fontSize: '9px', color: step === s.n ? '#fff' : step > s.n ? '#007a86' : 'rgba(255,255,255,0.5)', fontWeight: step === s.n ? '700' : '400', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {s.label}
                </div>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: '2px', background: step > s.n ? '#007a86' : 'rgba(255,255,255,0.15)', margin: '0 4px', marginBottom: '16px' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '12px' }}>
        <span><strong>Doc ID:</strong> <span style={{ color: '#ba0c2f', fontWeight: '800' }}>{docId}</span></span>
        <span><strong>Project:</strong> {submission.project_name}</span>
        <span><strong>PM:</strong> {submission.project_manager}</span>
        {form.icra_class && <span><strong>ICRA:</strong> <span style={{ background: icraColors[form.icra_class], color: '#fff', padding: '1px 8px', borderRadius: '10px', fontWeight: '800' }}>{form.icra_class}</span></span>}
      </div>

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '20px 16px 60px' }}>

        {/* STEP 1 - Project Info */}
        {step === 1 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Project Information</div>
              <div style={infoBox}>When demolition, renovation, modification, construction, maintenance or repair activities are planned, the impact of the work on UNM Hospital operations will be assessed.</div>
              <div style={row2}>
                <div><label style={lbl}>Booking ID</label><input style={{...inp, background:'#f9fafb'}} type='text' value={submission.doc_id} readOnly /></div>
                <div><label style={lbl}>Project Name</label><input style={{...inp, background:'#f9fafb'}} type='text' value={submission.project_name} readOnly /></div>
              </div>
              <div style={row3}>
                <div><label style={lbl}>Start Date</label><input style={{...inp, background:'#f9fafb'}} type='text' value={submission.meeting_date || ''} readOnly /></div>
                <div><label style={lbl}>Project Manager</label><input style={{...inp, background:'#f9fafb'}} type='text' value={submission.project_manager || ''} readOnly /></div>
                <div><label style={lbl}>Requestor</label><input style={{...inp, background:'#f9fafb'}} type='text' value={submission.requester_name || ''} readOnly /></div>
              </div>
              <div style={{ marginBottom: '14px' }}><label style={lbl}>Contractor(s) / Staff Performing Work</label><input style={inp} type='text' value={form.contractors} onChange={e => set('contractors', e.target.value)} /></div>
              <div style={{ marginBottom: '14px' }}><label style={lbl}>General Contractor Point of Contact</label><input style={inp} type='text' value={form.gc_contact} onChange={e => set('gc_contact', e.target.value)} /></div>
              <div style={{ marginBottom: '14px' }}>
                <label style={lbl}>Project Type</label>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[['project_type_repair','Repair'],['project_type_renovation','Renovation'],['project_type_modification','Modification'],['project_type_reconstruction','Reconstruction'],['project_type_addition','Addition']].map(([k,l]) => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type='checkbox' checked={!!form[k]} onChange={e => set(k, e.target.checked)} /> {l}
                    </label>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Scope of Work</label><textarea style={ta} value={form.scope_of_work} onChange={e => set('scope_of_work', e.target.value)} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>PCRA Expiration Date</label>
                <input style={{ ...inp, borderColor: '#ba0c2f' }} type='date' value={form.pcra_expiration_date} onChange={e => set('pcra_expiration_date', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Renewal Required?</label>
                <select style={sel} value={form.pcra_renewal_required} onChange={e => set('pcra_renewal_required', e.target.value)}>
                  <option value=''>-- Select --</option>
                  <option value='yes'>Yes</option>
                  <option value='no'>No</option>
                  <option value='tbd'>TBD</option>
                </select>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>Expiration Notifications</div>
                <div style={{ fontSize: '10px', color: '#78350f', lineHeight: '1.6' }}>7 days · 24 hrs · Day-of · 24 hrs after</div>
              </div>
            </div>
            <NavButtons nextStep={2} nextLabel='Barriers' />
          </div>
        )}

        {/* STEP 2 - Barriers */}
        {step === 2 && (
          <div>
            <div style={card}>
              <div style={secTitle}>General Containment · Construction Barrier(s)</div>
              <div style={infoBox}>NFPA 241 – Walls shall have at least a 1-hour fire resistance rating.</div>
              <div style={row2}>
                <div><label style={lbl}>Scheduled Duration</label><input style={inp} type='text' placeholder='e.g. 3 weeks' value={form.barrier_duration} onChange={e => set('barrier_duration', e.target.value)} /></div>
                <div><label style={lbl}>Comments</label><input style={inp} type='text' value={form.barrier_comments} onChange={e => set('barrier_comments', e.target.value)} /></div>
              </div>
              <div style={subTitle}>Type of Construction Barrier(s)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {[['barrier_type_plastic','Fire resistant plastic or Edgeguard — Low-Risk, Short duration (30 days or less)'],['barrier_type_gypsum_single','Gypsum board 5/8" single panel — High Risk or Long duration (>30 days, sprinklered)'],['barrier_type_gypsum_double','Gypsum board 5/8" double panel, 1-hour fire rating — High Risk or Long duration (>30 days, non-sprinklered)']].map(([k,l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type='checkbox' checked={!!form[k]} onChange={e => set(k, e.target.checked)} style={{ marginTop: '2px' }} /> {l}
                  </label>
                ))}
              </div>
              <div><label style={lbl}>Barrier Comments</label><textarea style={ta} value={form.barrier_type_comments} onChange={e => set('barrier_type_comments', e.target.value)} /></div>
            </div>
            <NavButtons prevStep={1} prevLabel='Project Info' nextStep={3} nextLabel='Risk Items' />
          </div>
        )}

        {/* STEP 3 - Risk Items */}
        {step === 3 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Risk Identification — YES Answer Indicates a Risk</div>
              <div style={subTitle}>BH — Behavioral Health</div>
              <YNField label='Will the project be performed in a designated Behavioral Health (BH) facility?' fieldKey='bh_required' notesKey='bh_notes' notesLabel='BH Risk Assessment Notes' />
              <div style={subTitle}>CRANE</div>
              <YNField label='Will a crane(s) be used during the project? (OSHA 29 CFR 1926.1400)' fieldKey='crane_required' notesKey='crane_notes' notesLabel='Crane Plan Notes'>
                <div style={permitBox}>
                  <div style={permitTitle}>📋 CRANE PERMIT</div>
                  <div style={row2}>
                    <div><label style={lbl}>Project Name</label><input style={inp} type='text' value={form.crane_permit_project_name} onChange={e => set('crane_permit_project_name', e.target.value)} /></div>
                    <div><label style={lbl}>Location</label><input style={inp} type='text' value={form.crane_permit_location} onChange={e => set('crane_permit_location', e.target.value)} /></div>
                  </div>
                  <div style={row3}>
                    <div><label style={lbl}>Start Date</label><input style={inp} type='date' value={form.crane_permit_start_date} onChange={e => set('crane_permit_start_date', e.target.value)} /></div>
                    <div><label style={lbl}>Project Manager</label><input style={inp} type='text' value={form.crane_permit_manager} onChange={e => set('crane_permit_manager', e.target.value)} /></div>
                    <div><label style={lbl}>Duration</label><input style={inp} type='text' value={form.crane_permit_duration} onChange={e => set('crane_permit_duration', e.target.value)} /></div>
                  </div>
                  <div><label style={lbl}>Description</label><textarea style={ta} value={form.crane_permit_description} onChange={e => set('crane_permit_description', e.target.value)} /></div>
                </div>
              </YNField>
              <div style={subTitle}>ASBESTOS</div>
              <YNField label='Has an asbestos assessment been performed on the area?' fieldKey='asbestos_required' notesKey='asbestos_notes' notesLabel='Assessment Reference' />
              <div style={subTitle}>NOISE</div>
              <YNField label='Will noise be generated affecting adjacent departments?' fieldKey='noise_required'>
                <div style={{ marginBottom: '12px' }}><label style={lbl}>Departments to Notify</label><input style={inp} type='text' value={form.noise_departments} onChange={e => set('noise_departments', e.target.value)} /></div>
                <div><label style={lbl}>How will noise be reduced?</label><textarea style={ta} value={form.noise_reduction} onChange={e => set('noise_reduction', e.target.value)} /></div>
              </YNField>
              <div style={subTitle}>VIBRATION</div>
              <YNField label='Will vibration be generated affecting adjacent departments?' fieldKey='vibration_required'>
                <div style={{ marginBottom: '12px' }}><label style={lbl}>Departments to Notify</label><input style={inp} type='text' value={form.vibration_departments} onChange={e => set('vibration_departments', e.target.value)} /></div>
                <div><label style={lbl}>How will vibration be reduced?</label><textarea style={ta} value={form.vibration_reduction} onChange={e => set('vibration_reduction', e.target.value)} /></div>
              </YNField>
              <div style={subTitle}>ODORS</div>
              <YNField label='Will odors be generated affecting adjacent departments?' fieldKey='odors_required'>
                <div style={{ marginBottom: '12px' }}><label style={lbl}>Departments to Notify</label><input style={inp} type='text' value={form.odors_departments} onChange={e => set('odors_departments', e.target.value)} /></div>
                <div><label style={lbl}>How will odors be minimized?</label><textarea style={ta} value={form.odors_reduction} onChange={e => set('odors_reduction', e.target.value)} /></div>
              </YNField>
            </div>
            <NavButtons prevStep={2} prevLabel='Barriers' nextStep={4} nextLabel='Air Quality' />
          </div>
        )}

        {/* STEP 4 - Air Quality */}
        {step === 4 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Air Quality Monitoring (Required on All Projects)</div>
              <div style={infoBox}>How will air quality and air pressure relationships in the construction/work area be monitored and maintained? A digital monitor shall be utilized on all projects.</div>
              <div><label style={lbl}>Air Quality Monitoring Plan / Comments</label><textarea style={{ ...ta, height: '120px' }} value={form.air_quality_plan} onChange={e => set('air_quality_plan', e.target.value)} /></div>
            </div>
            <NavButtons prevStep={3} prevLabel='Risk Items' nextStep={5} nextLabel='Utilities' />
          </div>
        )}

        {/* STEP 5 - Utilities */}
        {step === 5 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Utility Systems</div>
              <div style={subTitle}>Will any of the following utility systems be out of service during the project?</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
                {[['util_fire_alarm','Fire Alarm','If out >4 hrs in 24-hr period, ILSM required'],['util_fire_suppression','Fire Suppression','If out >10 hrs in 24-hr period, ILSM required'],['util_electrical','Electrical',''],['util_water','Domestic Water',''],['util_medical_gas','Medical Gas',''],['util_sewage','Sewage',''],['util_hvac','HVAC','']].map(([k,l,note], i) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <input type='checkbox' checked={!!form[k]} onChange={e => set(k, e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#ba0c2f' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', flex: 1 }}>{l}</span>
                    {note && <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>{note}</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '14px' }}><label style={lbl}>Comments</label><textarea style={ta} value={form.util_comments} onChange={e => set('util_comments', e.target.value)} /></div>
              <div><label style={lbl}>PM Inspection Frequency</label>
                <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
                  {[['daily','Daily — direct adjacency to patient care'],['weekly','Weekly — low risk area']].map(([v,l]) => (
                    <label key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', cursor: 'pointer', flex: 1 }}>
                      <input type='radio' name='pm_inspection_frequency' checked={form.pm_inspection_frequency === v} onChange={() => set('pm_inspection_frequency', v)} style={{ marginTop: '2px' }} /> {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <NavButtons prevStep={4} prevLabel='Air Quality' nextStep={6} nextLabel='Safety' />
          </div>
        )}

        {/* STEP 6 - Safety */}
        {step === 6 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Safety</div>
              <div style={subTitle}>HAZMAT</div>
              <YNField label='Will hazardous chemicals/materials be brought on site?' fieldKey='hazmat_required' notesKey='hazmat_notes' notesLabel='Hazmat Plan Notes' />
              <div style={subTitle}>SCAFFOLD / LADDERS</div>
              <YNField label='Will scaffolding and/or ladders be used?' fieldKey='scaffold_required' notesKey='scaffold_notes' notesLabel='Comments' />
              <div style={subTitle}>FALL PROTECTION</div>
              <YNField label='Will workers work at elevated level of 6 ft or more?' fieldKey='fall_required' notesKey='fall_notes' notesLabel='Fall Protection Plan Reference' />
              <div style={subTitle}>POWERED PLATFORMS / MAN LIFTS</div>
              <YNField label='Will powered platforms or man lifts be used?' fieldKey='lift_required' notesKey='lift_notes' notesLabel='Comments' />
              <div style={subTitle}>LOTO — Lockout / Tagout</div>
              <YNField label='Will any equipment have stored energy potential requiring LOTO?' fieldKey='loto_required' notesKey='loto_notes' notesLabel='Comments'>
                <div style={permitBox}>
                  <div style={permitTitle}>🔒 LOCKOUT / TAGOUT PERMIT</div>
                  <div style={row2}>
                    <div><label style={lbl}>Project Name</label><input style={inp} type='text' value={form.loto_permit_project_name} onChange={e => set('loto_permit_project_name', e.target.value)} /></div>
                    <div><label style={lbl}>Location</label><input style={inp} type='text' value={form.loto_permit_location} onChange={e => set('loto_permit_location', e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Energy Sources</label><textarea style={ta} value={form.loto_permit_energy_sources} onChange={e => set('loto_permit_energy_sources', e.target.value)} /></div>
                  <div><label style={lbl}>LOTO Procedures</label><textarea style={{ ...ta, height: '90px' }} value={form.loto_permit_procedures} onChange={e => set('loto_permit_procedures', e.target.value)} /></div>
                </div>
              </YNField>
              <div style={subTitle}>ELEC — Energized Electrical Work</div>
              <YNField label='Will energized electrical work be required? (Any work above 50V requires an Energized Electrical Work Permit)' fieldKey='energized_required'>
                <div style={permitBox}>
                  <div style={permitTitle}>⚡ ENERGIZED ELECTRICAL WORK PERMIT — NFPA 70E</div>
                  <div style={row2}>
                    <div><label style={lbl}>Project Name</label><input style={inp} type='text' value={form.energized_project_name} onChange={e => set('energized_project_name', e.target.value)} /></div>
                    <div><label style={lbl}>Location</label><input style={inp} type='text' value={form.energized_location_project} onChange={e => set('energized_location_project', e.target.value)} /></div>
                  </div>
                  <div style={row3}>
                    <div><label style={lbl}>Start Date</label><input style={inp} type='datetime-local' value={form.energized_start_date} onChange={e => set('energized_start_date', e.target.value)} /></div>
                    <div><label style={lbl}>Project Manager</label><input style={inp} type='text' value={form.energized_manager} onChange={e => set('energized_manager', e.target.value)} /></div>
                    <div><label style={lbl}>Room #</label><input style={inp} type='text' value={form.energized_room} onChange={e => set('energized_room', e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Description of Work</label><textarea style={ta} value={form.energized_work_description} onChange={e => set('energized_work_description', e.target.value)} /></div>
                  <div style={subTitle}>Required Documentation</div>
                  {[['energized_doc_circuits','List of all circuits affected'],['energized_doc_schematic','Schematic drawing approved by UNMH'],['energized_doc_flash_hazard','Results of Flash Hazard Analysis'],['energized_doc_step_by_step','Step by step energized work process'],['energized_doc_licenses','Copies of individual licenses'],['energized_doc_cpr','Copies of CPR certification']].map(([k,l]) => <CheckRow key={k} label={l} fieldKey={k} />)}
                  <div style={{ ...subTitle, marginTop: '14px' }}>UNMH Sign-Off</div>
                  <SigTable rows={[{label:'UNMH Project Manager',nameKey:'energized_pm_name'},{label:'UNMH Safety Officer',nameKey:'energized_safety_officer_name'},{label:'UNMH Facility Manager',nameKey:'energized_facility_manager_name'}]} />
                </div>
              </YNField>
              <div style={subTitle}>HOT WORK</div>
              <YNField label='Will hot work be required?' fieldKey='hot_required'>
                <div style={permitBox}>
                  <div style={permitTitle}>🔥 HOT WORK PERMIT</div>
                  <div style={row2}>
                    <div><label style={lbl}>Project Name</label><input style={inp} type='text' value={form.hot_project_name} onChange={e => set('hot_project_name', e.target.value)} /></div>
                    <div><label style={lbl}>Location</label><input style={inp} type='text' value={form.hot_location_project} onChange={e => set('hot_location_project', e.target.value)} /></div>
                  </div>
                  <div style={row3}>
                    <div><label style={lbl}>Start Date</label><input style={inp} type='date' value={form.hot_start_date} onChange={e => set('hot_start_date', e.target.value)} /></div>
                    <div><label style={lbl}>Project Manager</label><input style={inp} type='text' value={form.hot_manager} onChange={e => set('hot_manager', e.target.value)} /></div>
                    <div><label style={lbl}>Duration</label><input style={inp} type='text' value={form.hot_duration} onChange={e => set('hot_duration', e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Description of Work</label><textarea style={ta} value={form.hot_description} onChange={e => set('hot_description', e.target.value)} /></div>
                  <div style={subTitle}>UNMH Sign-Off</div>
                  <SigTable rows={[{label:'UNMH Project Manager',nameKey:'hot_pm_name'},{label:'UNMH Safety',nameKey:'hot_safety_name'},{label:'UNMH Life Safety',nameKey:'hot_lifesafety_name'}]} />
                </div>
              </YNField>
              <div style={subTitle}>CONFINED SPACE</div>
              <YNField label='Will Confined Space Entry be required?' fieldKey='confined_required'>
                <div style={permitBox}>
                  <div style={permitTitle}>⚠️ CONFINED SPACE ENTRY PERMIT</div>
                  <div style={row2}>
                    <div><label style={lbl}>Project Name</label><input style={inp} type='text' value={form.confined_project_name} onChange={e => set('confined_project_name', e.target.value)} /></div>
                    <div><label style={lbl}>Location</label><input style={inp} type='text' value={form.confined_location_project} onChange={e => set('confined_location_project', e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Description</label><textarea style={ta} value={form.confined_description} onChange={e => set('confined_description', e.target.value)} /></div>
                  <div style={subTitle}>UNMH Sign-Off</div>
                  <SigTable rows={[{label:'UNMH Project Manager',nameKey:'confined_pm_name'},{label:'UNMH Safety',nameKey:'confined_safety_name'}]} />
                </div>
              </YNField>
            </div>
            <div style={card}>
              <div style={secTitle}>Sign-Off · UNMH Project Manager</div>
              <SigTable rows={[{label:'UNMH Project Manager',nameKey:'form1_pm_name'}]} />
            </div>
            <NavButtons prevStep={5} prevLabel='Utilities' nextStep={7} nextLabel='ICRA' />
          </div>
        )}

        {/* STEP 7 - ICRA */}
        {step === 7 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Infection Control Risk Assessment (ICRA)</div>
              <div style={infoBox}>The ICRA will be performed and completed prior to the initiation of all projects. The completed ICRA will be maintained in the project file for the duration of the project.</div>
              <div style={subTitle}>Step 1 · Construction Activity Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[['A','TYPE A — Inspection & Non-Invasive','Ceiling tile removal for visual inspection, painting, minor work — no dust'],['B','TYPE B — Small Scale, Short Duration','Cabling, access spaces, cutting walls where dust can be controlled'],['C','TYPE C — Moderate to High Dust','Sanding, floorcovering removal, new wall construction, above ceiling work'],['D','TYPE D — Major Demolition','Consecutive shifts, heavy demolition, new construction']].map(([v,t,d]) => (
                  <label key={v} onClick={() => set('construction_type', v)} style={{ border: `2px solid ${form.construction_type === v ? '#007a86' : '#e5e7eb'}`, borderRadius: '8px', padding: '14px', cursor: 'pointer', background: form.construction_type === v ? '#f0f9ff' : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <input type='radio' name='construction_type' checked={form.construction_type === v} onChange={() => set('construction_type', v)} />
                      <span style={{ fontWeight: '800', fontSize: '13px', color: '#007a86' }}>{t}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{d}</p>
                  </label>
                ))}
              </div>
              <div style={subTitle}>Step 2 · Patient Risk Group</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[['Low','LOW','Office areas'],['Medium','MEDIUM','Cardiology, Radiology, Physical Therapy'],['High','HIGH','CCU, ER, Labor & Delivery, Surgical'],['Highest','HIGHEST','ICU, OR, Oncology, Burn Unit']].map(([v,t,d]) => (
                  <label key={v} onClick={() => set('patient_risk_group', v)} style={{ border: `2px solid ${form.patient_risk_group === v ? icraColors[ICRA_MATRIX['A']?.[v]] || '#007a86' : '#e5e7eb'}`, borderRadius: '8px', padding: '12px', cursor: 'pointer', background: form.patient_risk_group === v ? '#f9fafb' : '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <input type='radio' name='patient_risk_group' checked={form.patient_risk_group === v} onChange={() => set('patient_risk_group', v)} />
                      <span style={{ fontWeight: '800', fontSize: '12px' }}>{t}</span>
                    </div>
                    <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>{d}</p>
                  </label>
                ))}
              </div>
              {form.icra_class && (
                <div style={{ border: `3px solid ${icraColors[form.icra_class]}`, borderRadius: '10px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Determined ICRA Class</div>
                  <div style={{ fontSize: '64px', fontWeight: '900', color: icraColors[form.icra_class], lineHeight: 1 }}>{form.icra_class}</div>
                  {(form.icra_class === 'III' || form.icra_class === 'IV') && (
                    <div style={{ marginTop: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '8px', fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>
                      ⚠️ Infection Control Approval Required before work begins
                    </div>
                  )}
                </div>
              )}
              <div><label style={lbl}>ICRA Notes / Special Conditions</label><textarea style={ta} value={form.icra_notes} onChange={e => set('icra_notes', e.target.value)} /></div>
              <div style={{ marginTop: '14px' }}>
                <div style={subTitle}>Sign-Off · Infection Prevention & Control</div>
                <SigTable rows={[{label:'UNMH Infection Prevention & Control',nameKey:'icra_ipc_name'}]} />
              </div>
            </div>
            <NavButtons prevStep={6} prevLabel='Safety' nextStep={8} nextLabel='Life Safety' />
          </div>
        )}

        {/* STEP 8 - Life Safety */}
        {step === 8 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Life Safety · Required Prior to and During All Construction</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {['Smoke tight construction barrier must be constructed and maintained for the duration','Fire alarm and suppression systems must remain intact','All egress pathways and exit doors must be free and clear','ILSM documentation will be readily accessible for the duration of the project'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '12px', color: '#374151', padding: '6px 10px', background: i % 2 === 0 ? '#f9fafb' : '#fff', borderRadius: '4px' }}>
                    <span style={{ color: '#007a86', fontWeight: '800' }}>✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={secTitle}>Life Safety Risk Items</div>
              <div style={subTitle}>ABOVE CEILING</div>
              <YNField label='Will work be performed above the ceiling or penetrating any fire-rated barrier?' fieldKey='above_ceiling_required'>
                <div style={permitBox}>
                  <div style={permitTitle}>🏗️ ABOVE CEILING WORK PERMIT</div>
                  <div style={row2}>
                    <div><label style={lbl}>Project Number</label><input style={inp} type='text' value={form.ac_project_number} onChange={e => set('ac_project_number', e.target.value)} /></div>
                    <div><label style={lbl}>Project Manager</label><input style={inp} type='text' value={form.ac_manager} onChange={e => set('ac_manager', e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom: '12px' }}><label style={lbl}>Type of Work</label><textarea style={ta} value={form.ac_work_type} onChange={e => set('ac_work_type', e.target.value)} /></div>
                  <div style={subTitle}>UNMH Sign-Off</div>
                  <SigTable rows={[{label:'UNMH Project Manager',nameKey:'ac_pm_name'},{label:'UNMH Life Safety',nameKey:'ac_lifesafety_name'}]} />
                </div>
              </YNField>
              <div style={subTitle}>ACCESS DOORS</div>
              <YNField label='Does the project involve installation of access-controlled doors in egress paths?' fieldKey='access_doors_required' notesKey='access_doors_comments' notesLabel='Comments' />
              <div style={subTitle}>FIRE SYSTEM</div>
              <YNField label='Does the project involve installation or modification of fire alarm or sprinkler systems?' fieldKey='fire_system_required' notesKey='fire_system_comments' notesLabel='Comments' />
              <div style={subTitle}>BARRIERS</div>
              <YNField label='Does the project involve installation of fire/smoke rated barriers or modification of existing components?' fieldKey='barriers_required' notesKey='barriers_comments' notesLabel='Comments' />
            </div>
            <div style={card}>
              <div style={secTitle}>Interim Life Safety Assessment & Measures (ILSM)</div>
              <div style={row2}>
                <div><label style={lbl}>Location of Project</label><input style={inp} type='text' value={form.ilsm_location} onChange={e => set('ilsm_location', e.target.value)} /></div>
                <div><label style={lbl}>Description</label><input style={inp} type='text' value={form.ilsm_description} onChange={e => set('ilsm_description', e.target.value)} /></div>
              </div>
              {[['ilsm_q1','Exit access/discharge features are compromised'],['ilsm_q2','Building compartmental features (fire/smoke barriers) are compromised'],['ilsm_q3','Fire alarm system will be out of service >4 hours in 24-hr period'],['ilsm_q4','Fire suppression system will be out of service >10 hours in 24-hr period'],['ilsm_q5','Involves temporary ignition sources (hot work permit required if yes)'],['ilsm_q6','Large quantities of combustibles/debris left on site'],['ilsm_q7','Other life safety or fire protection deficiencies']].map(([k,l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '12px', flex: 1 }}>{l}</span>
                  {['Yes','No','N/A'].map(v => <label key={v} style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '12px', cursor: 'pointer', fontWeight: form[k] === v ? '700' : '400', color: form[k] === v ? (v === 'Yes' ? '#dc2626' : v === 'No' ? '#16a34a' : '#374151') : '#6b7280' }}><input type='radio' name={k} checked={form[k] === v} onChange={() => set(k, v)} /> {v}</label>)}
                </div>
              ))}
              <div style={{ marginTop: '12px' }}><label style={lbl}>Special Conditions</label><textarea style={ta} value={form.ilsm_special_conditions} onChange={e => set('ilsm_special_conditions', e.target.value)} /></div>
              <div style={{ ...subTitle, marginTop: '16px' }}>Sign-Off</div>
              <SigTable rows={[{label:'UNMH Project Manager',nameKey:'ls_pm_name'},{label:'UNMH Life Safety',nameKey:'ls_lifesafety_name'}]} />
            </div>
            <NavButtons prevStep={7} prevLabel='ICRA' nextStep={9} nextLabel='Acknowledgement' />
          </div>
        )}

        {/* STEP 9 - Acknowledgement */}
        {step === 9 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Acknowledgement</div>
              <div style={infoBox}>The General/Prime Contractor agrees to have all employees and sub-contractors abide by the results of this risk assessment for the duration of all construction operations at UNMH.</div>
              <div style={subTitle}>Contractor Compliance Confirmations</div>
              {[['ack_q1','Have contractors reviewed and confirmed compliance with the Pre-Construction Risk Assessment?'],['ack_q2','Have all contractors confirmed compliance with UNMH Interim Life Safety Measures (ILSM)?'],['ack_q3','Have all contractors confirmed compliance with UNMH Infection Control Measures (ICM)?'],['ack_q4','Have contractors obtained a UNMH Construction Safety Guidelines Poster for each work area?']].map(([k,l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '13px', flex: 1 }}>{l}</span>
                  {['YES','NO'].map(v => <label key={v} style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: form[k] === v ? (v === 'YES' ? '#16a34a' : '#dc2626') : '#6b7280' }}><input type='radio' name={k} checked={form[k] === v} onChange={() => set(k, v)} /> {v}</label>)}
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={secTitle}>UNMH Staff Signatures</div>
              <SigTable rows={[{label:'UNMH Project Manager',nameKey:'sig_pm'},{label:'UNMH Safety',nameKey:'sig_safety'},{label:'UNMH Life Safety',nameKey:'sig_lifesafety'},{label:'UNMH Infection Prevention & Control',nameKey:'sig_ipc'},{label:'UNMH End User',nameKey:'sig_enduser'}]} />
            </div>
            <div style={card}>
              <div style={secTitle}>Contractor / Additional UNMH Staff</div>
              <SigTable rows={[{label:'General Contractor',nameKey:'sig_sub1'},{label:'Sub-Contractor 1',nameKey:'sig_sub2'},{label:'Sub-Contractor 2',nameKey:'sig_sub3'},{label:'Sub-Contractor 3',nameKey:'sig_sub4'},{label:'UNMH Staff',nameKey:'sig_staff1'},{label:'UNMH Staff',nameKey:'sig_staff2'}]} />
            </div>
            <NavButtons prevStep={8} prevLabel='Life Safety' nextStep={10} nextLabel='Attachments' />
            {/* STEP 10 - Attachments */}
        {step === 10 && (
          <div>
            <div style={card}>
              <div style={secTitle}>Attachments & Supporting Documents</div>
              <div style={infoBox}>Attach any supporting documents or photos. All attachments will be included as an addendum to the printed PCRA.</div>
              <AttachmentsSection docId={docId} />
            </div>
            <NavButtons prevStep={9} prevLabel='Acknowledgement' isLast={true} />
          </div>
        )}
          </div>
        )}

      </div>
    </div>
  )
}
