'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminLeaves() {
  const [profile, setProfile] = useState<any>(null)
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [actionId, setActionId] = useState<string|null>(null)
  const [note, setNote] = useState('')
  const [showNoteModal, setShowNoteModal] = useState<{id:string, action:string}|null>(null)

  const supabase = createClient()

  useEffect(() => { loadData() }, [filter])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href='/auth/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    let q = supabase.from('leaves').select('*, profiles(full_name, email, designation, department, total_leaves)').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setLeaves(data || [])
    setLoading(false)
  }

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActionId(id)
    await supabase.from('leaves').update({
      status: action, admin_note: note || null,
      reviewed_by: profile?.id, reviewed_at: new Date().toISOString()
    }).eq('id', id)
    setNote(''); setShowNoteModal(null); setActionId(null)
    await loadData()
  }

  const handleAdjustLeaves = async (employeeId: string, current: number, delta: number) => {
    const newVal = Math.max(0, current + delta)
    await supabase.from('profiles').update({ total_leaves: newVal }).eq('id', employeeId)
    await loadData()
  }

  const typeColor: Record<string,string> = { annual:'brand', sick:'warn', casual:'success', unpaid:'neutral', emergency:'danger' }
  const statusColor: Record<string,string> = { pending:'warn', approved:'success', rejected:'danger' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  const pending = leaves.filter(l=>l.status==='pending').length

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>
              Leave Requests {pending > 0 && <span className="badge badge-warn" style={{ fontSize:14, marginLeft:8 }}>{pending} Pending</span>}
            </h1>
            <p style={{ color:'var(--text-2)', marginTop:4 }}>Review, approve or reject employee leaves</p>
          </div>

          {/* Filter tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {['pending','approved','rejected','all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding:'8px 18px', borderRadius:8, border:'1px solid var(--border)',
                  background: filter===f ? 'var(--brand)' : 'transparent',
                  color: filter===f ? '#fff' : 'var(--text-2)',
                  fontSize:13, fontWeight:500, cursor:'pointer', textTransform:'capitalize'
                }}>{f}</button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {leaves.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>No {filter} leave requests</div>
            ) : leaves.map(l => (
              <div key={l.id} className="card" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:16, color:'var(--text-1)' }}>{l.profiles?.full_name}</div>
                    <span style={{ fontSize:12, color:'var(--text-3)' }}>{l.profiles?.designation}</span>
                    <span className={`badge badge-${typeColor[l.leave_type]||'neutral'}`}>{l.leave_type}</span>
                    <span className={`badge badge-${statusColor[l.status]}`}>{l.status}</span>
                  </div>
                  <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom:8 }}>
                    <div style={{ fontSize:13, color:'var(--text-2)' }}>
                      📅 {new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()}
                      <span style={{ color:'var(--brand)', fontWeight:600, marginLeft:8 }}>{l.days_count} day{l.days_count>1?'s':''}</span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-2)' }}>
                      🌿 Leave balance: <b style={{ color:'var(--text-1)' }}>{l.profiles?.total_leaves} days</b>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-2)', background:'var(--bg-card2)', borderRadius:8, padding:'8px 12px' }}>
                    Reason: {l.reason}
                  </div>
                  {l.admin_note && (
                    <div style={{ fontSize:13, color:'var(--text-3)', marginTop:6 }}>Admin note: {l.admin_note}</div>
                  )}
                  {/* Adjust leaves for this employee */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10 }}>
                    <span style={{ fontSize:12, color:'var(--text-3)' }}>Adjust leaves:</span>
                    <button onClick={() => handleAdjustLeaves(l.profiles?.id||l.employee_id, l.profiles?.total_leaves, -1)}
                      style={{ width:26, height:26, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-card2)', color:'var(--danger)', cursor:'pointer', fontSize:14 }}>−</button>
                    <span style={{ fontWeight:600, color:'var(--text-1)', minWidth:30, textAlign:'center' }}>{l.profiles?.total_leaves}</span>
                    <button onClick={() => handleAdjustLeaves(l.profiles?.id||l.employee_id, l.profiles?.total_leaves, 1)}
                      style={{ width:26, height:26, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-card2)', color:'var(--success)', cursor:'pointer', fontSize:14 }}>+</button>
                  </div>
                </div>
                {l.status === 'pending' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <button className="btn btn-success btn-sm"
                      disabled={actionId===l.id}
                      onClick={() => setShowNoteModal({ id:l.id, action:'approved' })}>
                      ✓ Approve
                    </button>
                    <button className="btn btn-danger btn-sm"
                      disabled={actionId===l.id}
                      onClick={() => setShowNoteModal({ id:l.id, action:'rejected' })}>
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {showNoteModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowNoteModal(null) }}>
          <div className="modal" style={{ maxWidth:420 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:16, textTransform:'capitalize' }}>
              {showNoteModal.action} Leave
            </h3>
            <label className="label">Admin Note (Optional)</label>
            <textarea className="input" placeholder="Add a note for the employee..."
              value={note} onChange={e => setNote(e.target.value)} style={{ minHeight:80 }} />
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setShowNoteModal(null)}>Cancel</button>
              <button
                className={`btn ${showNoteModal.action==='approved' ? 'btn-success' : 'btn-danger'}`}
                style={{ flex:2 }}
                onClick={() => handleAction(showNoteModal.id, showNoteModal.action as any)}>
                Confirm {showNoteModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
