'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [coordinators, setCoordinators] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('coordinator')
  const [adding, setAdding] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session) { router.push('/login'); return }
      const { data } = await supabase.from('coordinators').select('*').order('created_at', { ascending: true })
      setCoordinators(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAdd() {
    if (!newEmail.trim()) { alert('Please enter an email address'); return }
    setAdding(true)
    const { error } = await supabase.from('coordinators').insert({
      email: newEmail.trim().toLowerCase(),
      name: newName.trim(),
      role: newRole,
    })
    if (error) {
      alert(error.message.includes('unique') ? 'This email is already a coordinator.' : 'Error: ' + error.message)
      setAdding(false)
      return
    }
    const { data } = await supabase.from('coordinators').select('*').order('created_at', { ascending: true })
    setCoordinators(data || [])
    setNewEmail('')
    setNewName('')
    setNewRole('coordinator')
    setSavedMsg('Coordinator added!')
    setTimeout(() => setSavedMsg(''), 3000)

    // Also create Supabase auth account
    await fetch('/api/create-coordinator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim().toLowerCase(), name: newName.trim() })
    })
    setAdding(false)
  }

  async function handleToggle(id, active) {
    await supabase.from('coordinators').update({ active: !active }).eq('id', id)
    setCoordinators(coords => coords.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  async function handleDelete(id, email) {
    if (!confirm(`Remove ${email} as coordinator?`)) return
    await supabase.from('coordinators').delete().eq('id', id)
    setCoordinators(coords => coords.filter(c => c.id !== id))
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui' }}>Loading...</div>

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#ba0c2f', color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '0.05em' }}>UNMH PCRA — Admin</div>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>Coordinator User Management</div>
        </div>
        <a href='/dashboard' style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '7px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: '700', fontSize: '12px', border: '1px solid rgba(255,255,255,0.4)' }}>← Dashboard</a>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Add Coordinator */}
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#111', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '2px solid #f3f4f6' }}>
            Add New Coordinator
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={lbl}>Full Name</label>
              <input style={inp} type='text' placeholder='Full name' value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Email Address *</label>
              <input style={inp} type='email' placeholder='email@salud.unm.edu' value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </div>
            <div>
              <label style={lbl}>Role</label>
              <select style={inp} value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value='coordinator'>Coordinator</option>
                <option value='admin'>Admin</option>
                <option value='viewer'>Viewer (read-only)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleAdd} disabled={adding} style={{ background: '#ba0c2f', color: '#fff', border: 'none', borderRadius: '6px', padding: '9px 20px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', opacity: adding ? 0.7 : 1 }}>
              {adding ? 'Adding...' : '+ Add Coordinator'}
            </button>
            {savedMsg && <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>✓ {savedMsg}</span>}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#9ca3af' }}>
            Adding a coordinator will send them a password setup email so they can log in to the dashboard.
          </div>
        </div>

        {/* Coordinator List */}
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#111', margin: '0 0 16px', paddingBottom: '8px', borderBottom: '2px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Coordinators ({coordinators.length})</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Name', 'Email', 'Role', 'Status', 'Added', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#555', borderBottom: '1px solid #e5e7eb', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coordinators.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 12px', fontWeight: '700' }}>{c.name || '—'}</td>
                  <td style={{ padding: '12px 12px', color: '#374151' }}>{c.email}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ background: c.role === 'admin' ? '#fef2f2' : '#f0f9ff', color: c.role === 'admin' ? '#dc2626' : '#007a86', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                      {c.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ background: c.active ? '#f0fdf4' : '#fef2f2', color: c.active ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', color: '#9ca3af', fontSize: '11px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleToggle(c.id, c.active)} style={{ background: c.active ? '#fef2f2' : '#f0fdf4', color: c.active ? '#dc2626' : '#16a34a', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(c.id, c.email)} style={{ background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
