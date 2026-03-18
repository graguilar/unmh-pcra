'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const BASE_URL = 'https://unmh-pcra.vercel.app'

export default function PosterPage() {
  const params = useParams()
  const docId = params.docId
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('submissions').select('*').eq('doc_id', docId).single()
      if (data) setSubmission(data)
      setLoading(false)
    }
    load()
  }, [docId])

  useEffect(() => {
    // Load QR code library
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => generateQRCodes()
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [submission])

  function generateQRCodes() {
    if (!window.QRCode || !submission) return
    const configs = [
      { id: 'qr-main', url: `${BASE_URL}/assess/${docId}`, size: 140 },
      { id: 'qr-infection', url: `${BASE_URL}/checklist/${docId}?type=infection_control`, size: 100 },
      { id: 'qr-safety', url: `${BASE_URL}/checklist/${docId}?type=environmental_safety`, size: 100 },
      { id: 'qr-pm', url: `${BASE_URL}/checklist/${docId}?type=pm_inspection`, size: 100 },
      { id: 'qr-hotwork', url: `${BASE_URL}/checklist/${docId}?type=hot_work`, size: 100 },
    ]
    configs.forEach(({ id, url, size }) => {
      const el = document.getElementById(id)
      if (el && !el.hasChildNodes()) {
        new window.QRCode(el, { text: url, width: size, height: size, colorDark: '#000', colorLight: '#fff', correctLevel: window.QRCode.CorrectLevel.M })
      }
    })
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading poster...</div>
  if (!submission) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui', color: '#dc2626' }}>Submission not found: {docId}</div>

  const icraColors = { 'I': '#16a34a', 'II': '#ca8a04', 'III': '#ea580c', 'IV': '#dc2626' }
  const s = submission

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', maxWidth: '850px', margin: '0 auto', padding: '20px' }}>

      {/* Print button - hidden on print */}
      <div className='no-print' style={{ textAlign: 'right', marginBottom: '16px' }}>
        <button onClick={() => window.print()} style={{ background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}>🖨️ Print Poster</button>
        <a href={`/dashboard`} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: '700', textDecoration: 'none', fontSize: '14px' }}>← Dashboard</a>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1cm; size: 11in 17in; }
          body { margin: 0; }
        }
      `}</style>

      {/* POSTER */}
      <div style={{ border: '4px solid #ba0c2f', borderRadius: '8px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#ba0c2f', color: '#fff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '0.05em' }}>UNMH — Environmental Safety</div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '2px' }}>Pre-Construction Risk Assessment — Active Project</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>Document ID</div>
            <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.1em' }}>{docId}</div>
          </div>
        </div>

        {/* Project Info */}
        <div style={{ background: '#f9fafb', padding: '16px 24px', borderBottom: '2px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
          {[
            ['Project', s.project_name],
            ['Building', s.building],
            ['Floor', s.floor || '—'],
            ['Project Manager', s.project_manager],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{value || '—'}</div>
            </div>
          ))}
        </div>

        {/* ICRA + Main QR */}
        <div style={{ padding: '20px 24px', borderBottom: '2px solid #e5e7eb', display: 'flex', gap: '24px', alignItems: 'center' }}>
          {s.icra_class && (
            <div style={{ textAlign: 'center', background: icraColors[s.icra_class] + '15', border: `2px solid ${icraColors[s.icra_class]}`, borderRadius: '8px', padding: '12px 20px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>ICRA Class</div>
              <div style={{ fontSize: '48px', fontWeight: '900', color: icraColors[s.icra_class], lineHeight: 1 }}>{s.icra_class}</div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>📋 Full Assessment</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>Scan to view the complete Pre-Construction Risk Assessment document</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div id='qr-main' style={{ background: '#fff', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}></div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Or visit:</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#ba0c2f' }}>{BASE_URL}/assess/{docId}</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#6b7280' }}>
            <div style={{ fontWeight: '700', marginBottom: '4px' }}>Meeting Date</div>
            <div>{s.meeting_date || '—'}</div>
            <div style={{ fontWeight: '700', marginBottom: '4px', marginTop: '8px' }}>Duration</div>
            <div>{s.duration_weeks ? s.duration_weeks + ' wks' : '—'}</div>
          </div>
        </div>

        {/* Daily Checklist QR Codes */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', color: '#111', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📱 Daily Site Checks — Scan Each Morning</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '16px' }}>Each QR code opens a mobile-friendly checklist. Submissions are logged and reported to the Project Manager.</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            {[
              { id: 'qr-infection', type: 'infection_control', title: 'Infection Control', icon: '🦠', color: '#007a86' },
              { id: 'qr-safety', type: 'environmental_safety', title: 'Environmental Safety', icon: '🏗️', color: '#f59e0b' },
              { id: 'qr-pm', type: 'pm_inspection', title: 'PM Site Inspection', icon: '📋', color: '#3b82f6' },
              { id: 'qr-hotwork', type: 'hot_work', title: 'Hot Work Check', icon: '🔥', color: '#ef4444' },
            ].map(item => (
              <div key={item.id} style={{ border: `2px solid ${item.color}`, borderRadius: '8px', padding: '12px', textAlign: 'center', background: item.color + '08' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: item.color, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.title}</div>
                <div id={item.id} style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}></div>
                <div style={{ fontSize: '9px', color: '#9ca3af', wordBreak: 'break-all' }}>{BASE_URL}/checklist/{docId}?type={item.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#1f2937', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>
            UNMH Environmental Safety Department · Pre-Construction Risk Assessment Program
          </div>
          <div style={{ fontSize: '11px', opacity: 0.6 }}>
            Posted: {new Date().toLocaleDateString()} · {docId}
          </div>
        </div>

      </div>
    </div>
  )
}
