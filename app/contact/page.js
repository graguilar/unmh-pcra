 'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ContactLandingPage() {
  const [docId, setDocId] = useState('')
  const router = useRouter()

  function handleContinue() {
    if (!docId.trim()) return
    router.push(`/contact/${docId.trim().toUpperCase()}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px' }}>
        <div style={{ fontWeight: '900', fontSize: '16px' }}>UNMH PCRA</div>
        <div style={{ fontSize: '12px', opacity: 0.85 }}>Contact PCRA Team</div>
      </div>
      <div style={{ maxWidth: '480px', margin: '48px auto', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', padding: '32px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '900', color: '#111' }}>Contact PCRA Team</h2>
        <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>Enter your Document ID to send a message about your submission.</p>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Your Document ID</label>
        <input
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box', fontFamily: 'inherit', letterSpacing: '0.05em' }}
          type='text'
          placeholder='RA-2026-XXXXX'
          value={docId}
          onChange={e => setDocId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleContinue()}
        />
        <button
          onClick={handleContinue}
          style={{ marginTop: '16px', width: '100%', background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
          Continue →
        </button>
        <p style={{ marginTop: '16px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          Your Doc ID was emailed to you when you scheduled your PCRA meeting.
        </p>
      </div>
    </div>
  )
}