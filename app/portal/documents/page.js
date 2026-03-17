 'use client'
import { useState } from 'react'

const DOCUMENTS = [
  { category: 'Policy & Procedure', title: 'ICRA Policy', desc: 'Infection Control Risk Assessment Policy', icon: '📋' },
  { category: 'Policy & Procedure', title: 'Pre-Construction Risk Assessment SOP', desc: 'Standard Operating Procedure for PCRA', icon: '📋' },
  { category: 'Regulatory', title: 'NFPA 241 — Safeguarding Construction Operations', desc: 'Fire safety during construction', icon: '📄' },
  { category: 'Regulatory', title: 'NFPA 101 — Life Safety Code', desc: 'Life safety requirements Chapter 43', icon: '📄' },
  { category: 'Regulatory', title: 'NFPA 70E — Electrical Safety', desc: 'Electrical safety in the workplace', icon: '📄' },
  { category: 'Regulatory', title: 'OSHA 29 CFR 1926.1400 — Cranes', desc: 'Cranes and Derricks in Construction', icon: '📄' },
  { category: 'Regulatory', title: 'OSHA 1910.1001 — Asbestos', desc: 'Asbestos exposure standards', icon: '📄' },
  { category: 'Regulatory', title: 'OSHA CFR 1910.28 — Fall Protection', desc: 'Fall protection requirements', icon: '📄' },
  { category: 'Guidelines', title: 'UNMH Construction Safety Guidelines', desc: 'Hospital construction safety poster', icon: '🏥' },
  { category: 'Guidelines', title: 'UNMH Lockout/Tagout Procedure', desc: 'LOTO requirements for contractors', icon: '🏥' },
  { category: 'Guidelines', title: 'UNMH Badge & Flu Shot Requirements', desc: 'EC designation and flu shot policy', icon: '🏥' },
  { category: 'Guidelines', title: 'ILSM Guide', desc: 'Interim Life Safety Measures reference', icon: '🏥' },
]

const CATEGORIES = [...new Set(DOCUMENTS.map(d => d.category))]

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = DOCUMENTS.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.desc.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || d.category === activeCategory
    return matchSearch && matchCategory
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '16px' }}>UNMH PCRA</div>
          <div style={{ fontSize: '12px', opacity: 0.85 }}>Review Documents</div>
        </div>
        <a href='/portal' style={{ color: '#fff', fontSize: '13px', fontWeight: '700', textDecoration: 'none', opacity: 0.85 }}>← Back to Portal</a>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '900', color: '#111' }}>📚 Document Library</h2>

          <input
            type='text'
            placeholder='Search documents...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '14px' }}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {['All', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', background: activeCategory === cat ? '#007a86' : '#f3f4f6', color: activeCategory === cat ? '#fff' : '#374151' }}>
                {cat}
              </button>
            ))}
          </div>

          {CATEGORIES.filter(cat => activeCategory === 'All' || cat === activeCategory).map(cat => {
            const docs = filtered.filter(d => d.category === cat)
            if (docs.length === 0) return null
            return (
              <div key={cat} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{cat}</div>
                {docs.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '24px' }}>{doc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111', marginBottom: '2px' }}>{doc.title}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{doc.desc}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Contact coordinator for access</span>
                  </div>
                ))}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No documents found.</div>
          )}
        </div>
      </div>
    </div>
  )
}