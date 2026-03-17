'use client'
import { useState } from 'react'

const FAQS = [
  {
    category: 'Getting Started',
    items: [
      { q: 'What is a Pre-Construction Risk Assessment (PCRA)?', a: 'A PCRA is a required assessment conducted prior to any construction, renovation, or maintenance activity at UNMH. It evaluates potential risks to patients, staff, and visitors and determines infection control and life safety measures needed during the project.' },
      { q: 'When is a PCRA required?', a: 'A PCRA is required before any demolition, renovation, modification, construction, maintenance or repair activities at UNMH facilities. This includes minor repairs, ceiling tile removal, and any work that may generate dust or affect building systems.' },
      { q: 'How do I schedule a PCRA?', a: 'Click "Schedule New PCRA" from your portal dashboard or visit unmh-pcra.vercel.app/submit. Fill out the project details and select a meeting time. A confirmation email with your Document ID will be sent automatically.' },
    ]
  },
  {
    category: 'Your Document ID',
    items: [
      { q: 'What is my Document ID?', a: 'Your Document ID (e.g. RA-2026-12345) is a unique identifier assigned to your PCRA submission. You will need it to access your assessment, send messages to the coordinator, and track your submission status.' },
      { q: 'Where do I find my Document ID?', a: 'Your Document ID was emailed to you when you scheduled your PCRA meeting. It also appears at the top of your portal dashboard under "My PCRA Submissions".' },
      { q: 'I lost my Document ID — what do I do?', a: 'Check your email inbox for the confirmation email sent when you scheduled your meeting. If you cannot find it, contact the PCRA team using the Contact PCRA Team option in your portal.' },
    ]
  },
  {
    category: 'ICRA Classes',
    items: [
      { q: 'What is an ICRA Class?', a: 'ICRA (Infection Control Risk Assessment) Class is a rating from I to IV that determines the level of infection control measures required during construction. Class I is lowest risk, Class IV is highest risk.' },
      { q: 'What determines my ICRA Class?', a: 'Your ICRA Class is determined by two factors: the type of construction activity (Type A–D, based on how much dust is generated) and the patient risk group of the area where work will be performed.' },
      { q: 'What does Class IV mean for my project?', a: 'Class IV requires the highest level of infection control: full containment barriers, negative air pressure, HEPA filtration, anteroom construction, and Infection Control Department approval before work begins.' },
    ]
  },
  {
    category: 'Permits',
    items: [
      { q: 'What permits might be required for my project?', a: 'Depending on your project scope, you may need: Hot Work Permit (welding, cutting), Energized Electrical Work Permit (work above 50V), Confined Space Entry Permit, Above Ceiling Work Permit, Crane Permit, or Lockout/Tagout Permit.' },
      { q: 'When are permits completed?', a: 'Permits are completed during your PCRA meeting with the coordinator. Each permit is filled out as part of the Pre-Construction Risk Assessment form.' },
      { q: 'Can I start work before permits are approved?', a: 'No. All required permits must be completed and signed before any work begins. The completed PCRA document must be maintained at the job site for the duration of the project.' },
    ]
  },
  {
    category: 'Contact & Support',
    items: [
      { q: 'How do I contact the PCRA coordinator?', a: 'Use the "Contact PCRA Team" option in your portal. Enter your Document ID and email to verify your identity, then send a message. The coordinator will respond within 1–2 business days.' },
      { q: 'What are the PCRA office hours?', a: 'The UNMH Environmental Safety department is available Monday–Friday during normal business hours. For emergencies, contact UNMH Facilities directly.' },
      { q: 'How long does a PCRA take to complete?', a: 'The initial scheduling and meeting typically takes 30–60 minutes. Complex projects with multiple permits may require additional time. The completed PCRA must be on file before work begins.' },
    ]
  },
]

export default function HelpPage() {
  const [openItem, setOpenItem] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '16px' }}>UNMH PCRA</div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>Help / FAQ</div>
        </div>
        <a href='/portal' style={{ color: '#fff', fontSize: '13px', fontWeight: '700', textDecoration: 'none', opacity: 0.85 }}>← Back to Portal</a>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '900', color: '#111' }}>❓ Help / FAQ</h2>
          <input
            type='text'
            placeholder='Search questions...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '20px' }}
          />

          {filtered.map(cat => (
            <div key={cat.category} style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{cat.category}</div>
              {cat.items.map((item, i) => {
                const key = cat.category + i
                const isOpen = openItem === key
                return (
                  <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
                    <button onClick={() => setOpenItem(isOpen ? null : key)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: isOpen ? '#f0f9ff' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{item.q}</span>
                      <span style={{ fontSize: '18px', color: '#007a86', flexShrink: 0 }}>{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#374151', lineHeight: '1.7', background: '#f9fafb' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No results found for "{search}"</div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#111', marginBottom: '6px' }}>Still have questions?</div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px' }}>Contact the PCRA team directly and we'll get back to you within 1–2 business days.</p>
          <a href='/contact' style={{ background: '#ba0c2f', color: '#fff', padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>Contact PCRA Team →</a>
        </div>
      </div>
    </div>
  )
}