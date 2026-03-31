'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function EmployeeLeaves() {
  const [profile, setProfile] = useState<any>(null)
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ leave_type:'annual', start_date:'', end_date:'', reason:'' })

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href='/auth/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    const { data } = await supabase.from('leaves').select('*').eq('employee_id', user.id).order('created_at', { ascending: false })
    setLeaves(data || [])
    setLoading(false)
  }

  const getDaysCount = (start: string, end: string) => {
    if (!start || !end) return 0
    const diff = new Date(end).getTime() - new Date(start).getTime()
    return Math.max(1, Math.floor(diff / 86400000) + 1)
  }

  const handleSubmit = async () => {
    setSaving(true); setMsg('')
    const days = getDaysCount(form.start_date, form.end_date)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('leaves').insert({
      employee_id: user!.id,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days_count: days,
      reason: form.reason,
      status: 'pending'
    })
    if (error) { setMsg('Error: ' + error.message) }
    else { setMsg('Leave request submitted!'); setForm({ leave_type:'annual', start_date:'', end_date:'', reason:'' }); await loadData() }
    setSaving(false)
    setTimeout(() => { if (!error) setShowModal(false); setMsg('') }, 1500)
  }

  const used    = leaves.filter(l=>l.status==='approved').reduce((a:number,l:any)=>a+l.days_count,0)
  const pending = leaves.filter(l=>l.status==='pending').length
  const remaining = Math.max(0, (profile?.total_leaves||20) - used)
  const statusColor: Record<string,string> = { pending:'warn', approved:'success', rejected:'danger' }
  const typeColor:   Record<string,string> = { annual:'brand', sick:'warn', casual:'success', unpaid:'neutral', emergency:'danger' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>My Leaves</h1>
              <p style={{ color:'var(--text-2)', marginTop:4 }}>Manage your leave requests</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setMsg(''); setShowModal(true) }}>+ Request Leave</button>
          </div>

          {/* Leave balance */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {[
              { label:'Total Allowed', value: profile?.total_leaves||20, icon:'📅', color:'var(--brand)',   bg:'var(--brand-dim)' },
              { label:'Days Used',     value: used,                      icon:'✅', color:'var(--success)', bg:'rgba(46,204,113,0.12)' },
              { label:'Remaining',     value: remaining,                 icon:'🌿', color:'var(--accent)',  bg:'var(--accent-dim)' },
              { label:'Pending',       value: pending,                   icon:'⏳', color:'var(--warn)',    bg:'rgba(255,140,66,0.12)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background:s.bg, color:s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:26, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--text-1)', lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Leave history */}
          <div className="card">
            <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, marginBottom:20 }}>Leave History</h2>
            {leaves.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-3)' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🌿</div>
                <p>No leave requests yet. Apply for your first leave!</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Type</th><th>Duration</th><th>Days</th>
                    <th>Reason</th><th>Status</th><th>Admin Note</th>
                  </tr></thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id}>
                        <td><span className={`badge badge-${typeColor[l.leave_type]||'neutral'}`}>{l.leave_type}</span></td>
                        <td style={{ fontSize:13 }}>
                          {new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight:600, color:'var(--brand)' }}>{l.days_count}d</td>
                        <td style={{ maxWidth:180, fontSize:13, color:'var(--text-2)' }}>{l.reason}</td>
                        <td><span className={`badge badge-${statusColor[l.status]}`}>{l.status}</span></td>
                        <td style={{ fontSize:12, color:'var(--text-3)' }}>{l.admin_note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20 }}>Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'var(--text-2)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="label">Leave Type</label>
                <select className="input" value={form.leave_type} onChange={e => setForm(p=>({...p,leave_type:e.target.value}))}>
                  <option value="annual">🌴 Annual Leave</option>
                  <option value="sick">🤒 Sick Leave</option>
                  <option value="casual">😊 Casual Leave</option>
                  <option value="emergency">🚨 Emergency</option>
                  <option value="unpaid">💸 Unpaid Leave</option>
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="label">Start Date</label>
                  <input className="input" type="date" value={form.start_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(p=>({...p,start_date:e.target.value}))} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input className="input" type="date" value={form.end_date}
                    min={form.start_date || new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(p=>({...p,end_date:e.target.value}))} />
                </div>
              </div>
              {form.start_date && form.end_date && (
                <div style={{ background:'var(--brand-dim)', borderRadius:8, padding:'8px 14px', fontSize:13, color:'var(--brand-light)' }}>
                  Total: <b>{getDaysCount(form.start_date, form.end_date)} day{getDaysCount(form.start_date, form.end_date)>1?'s':''}</b>
                  {' '}· You have <b>{remaining} days</b> remaining
                </div>
              )}
              <div>
                <label className="label">Reason</label>
                <textarea className="input" placeholder="Brief reason for leave..."
                  style={{ minHeight:80 }} value={form.reason} onChange={e => setForm(p=>({...p,reason:e.target.value}))} />
              </div>
            </div>
            {msg && (
              <div style={{
                marginTop:12, padding:'10px 14px', borderRadius:8, fontSize:14,
                background: msg.startsWith('Error') ? 'rgba(255,77,109,0.1)' : 'rgba(46,204,113,0.1)',
                color: msg.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                border: `1px solid ${msg.startsWith('Error') ? 'rgba(255,77,109,0.3)' : 'rgba(46,204,113,0.3)'}`
              }}>{msg}</div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={handleSubmit}
                disabled={saving || !form.start_date || !form.end_date || !form.reason}>
                {saving ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
