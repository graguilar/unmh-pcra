'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function SuggestionsPage() {
  const [form, setForm] = useState({ name: '', email: '', category: '', suggestion: '' })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit() {
    if (!form.suggestion.trim()) { alert('Please enter your suggestion'); return }
    setSaving(true)
    await supabase.from('suggestions').insert({
      name: form.name,
      email: form.email,
      category: form.category,
      suggestion: form.suggestion,
    })
    setSubmitted(true)
    setSaving(false)
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '16px' }}>UNMH PCRA</div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>Suggest Enhancements</div>
        </div>
        <a href='/portal' style={{ color: '#fff', fontSize: '13px', fontWeight: '700', textDecoration: 'none', opacity: 0.85 }}>← Back to Portal</a>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        {submitted ? (
          <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>💡</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '900', color: '#111' }}>Thank You!</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Your suggestion has been submitted. The PCRA team reviews all feedback regularly.</p>
            <a href='/portal' style={{ background: '#ba0c2f', color: '#fff', padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>← Back to Portal</a>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '28px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '900', color: '#111' }}>💡 Suggest an Enhancement</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Help us improve the PCRA process. All suggestions are reviewed by the coordinator team.</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Your Name (optional)</label>
              <input style={inp} type='text' placeholder='Full name' value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Your Email (optional)</label>
              <input style={inp} type='email' placeholder='email@example.com' value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value=''>-- Select a category --</option>
                <option>Form / Process improvement</option>
                <option>Website / Technology</option>
                <option>Building / Location additions</option>
                <option>Policy / Regulatory</option>
                <option>General feedback</option>
              </select>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={lbl}>Your Suggestion *</label>
              <textarea style={{ ...inp, height: '120px', resize: 'vertical' }} placeholder='Describe your suggestion...' value={form.suggestion} onChange={e => set('suggestion', e.target.value)} />
            </div>
            <button onClick={handleSubmit} disabled={saving} style={{ width: '100%', background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              {saving ? 'Submitting...' : '💡 Submit Suggestion'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}