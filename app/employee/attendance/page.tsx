'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function EmployeeAttendance() {
  const [profile, setProfile] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showReasonModal, setShowReasonModal] = useState<string|null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href='/auth/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    const { data } = await supabase.from('attendance').select('*').eq('employee_id', user.id).order('date', { ascending: false }).limit(30)
    setRecords(data || [])
    setLoading(false)
  }

  const handleSubmitReason = async (recordId: string) => {
    setSaving(true)
    await supabase.from('attendance').update({ missed_reason: reason, regulation_approved: false }).eq('id', recordId)
    setReason(''); setShowReasonModal(null); setSaving(false)
    await loadData()
  }

  const handleAddMissedAttendance = async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('attendance').upsert({
      employee_id: user!.id, date, status:'absent'
    }, { onConflict:'employee_id,date' }).select().single()
    if (data) setShowReasonModal(data.id)
  }

  const formatTime = (ts: string | null) => ts ? new Date(ts).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }) : '—'
  const getDuration = (ci: string, co: string) => {
    if (!ci || !co) return '—'
    const diff = new Date(co).getTime() - new Date(ci).getTime()
    return `${Math.floor(diff/3600000)}h ${Math.floor((diff%3600000)/60000)}m`
  }

  const present = records.filter(r=>r.status==='present').length
  const late    = records.filter(r=>r.status==='late').length
  const absent  = records.filter(r=>r.status==='absent').length
  const statusColor: Record<string,string> = { present:'success', late:'warn', absent:'danger', 'half-day':'brand', holiday:'neutral' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>My Attendance</h1>
            <p style={{ color:'var(--text-2)', marginTop:4 }}>Last 30 days</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
            {[
              { label:'Present', value:present, icon:'✅', color:'var(--success)', bg:'rgba(46,204,113,0.12)' },
              { label:'Late',    value:late,    icon:'⏰', color:'var(--warn)',    bg:'rgba(255,140,66,0.12)' },
              { label:'Absent',  value:absent,  icon:'❌', color:'var(--danger)',  bg:'rgba(255,77,109,0.12)' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background:s.bg, color:s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--text-1)', lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Add missed attendance */}
          <div className="card" style={{ marginBottom:20, border:'1px solid rgba(90,103,250,0.2)' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:12, color:'var(--text-1)' }}>
              📋 Report Missed Attendance
            </h3>
            <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:12 }}>
              If you were present but forgot to check in, you can add a regulation note for admin approval.
            </p>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <input type="date" className="input" style={{ width:'auto' }} id="missed-date"
                max={new Date().toISOString().split('T')[0]} />
              <button className="btn btn-secondary"
                onClick={() => {
                  const d = (document.getElementById('missed-date') as HTMLInputElement)?.value
                  if (d) handleAddMissedAttendance(d)
                }}>
                + Report Missed Day
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Date</th><th>Check In</th><th>Check Out</th>
                <th>Duration</th><th>Status</th><th>Regulation</th>
              </tr></thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-3)', padding:32 }}>No attendance records yet</td></tr>
                ) : records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:500 }}>{new Date(r.date).toLocaleDateString('en', { weekday:'short', month:'short', day:'numeric' })}</td>
                    <td style={{ color:'var(--accent)' }}>{formatTime(r.check_in)}</td>
                    <td style={{ color:'var(--warn)' }}>{formatTime(r.check_out)}</td>
                    <td style={{ color:'var(--text-2)' }}>{getDuration(r.check_in, r.check_out)}</td>
                    <td><span className={`badge badge-${statusColor[r.status]||'neutral'}`}>{r.status}</span></td>
                    <td>
                      {r.missed_reason ? (
                        <div style={{ fontSize:12 }}>
                          <div style={{ color:'var(--text-2)' }}>{r.missed_reason.slice(0,40)}...</div>
                          <span className={`badge badge-${r.regulation_approved ? 'success' : 'warn'}`}>
                            {r.regulation_approved ? 'Approved' : 'Pending review'}
                          </span>
                        </div>
                      ) : (
                        (r.status === 'absent' && !r.missed_reason) ? (
                          <button className="btn btn-secondary btn-sm" onClick={() => setShowReasonModal(r.id)}>
                            Add Reason
                          </button>
                        ) : <span style={{ color:'var(--text-3)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showReasonModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowReasonModal(null) }}>
          <div className="modal">
            <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:16 }}>Regulation Note</h3>
            <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:14 }}>
              Explain why you missed attendance. Your admin will review and approve.
            </p>
            <label className="label">Your Reason</label>
            <textarea className="input" placeholder="e.g. I was working from client site and forgot to check in..."
              style={{ minHeight:100 }} value={reason} onChange={e => setReason(e.target.value)} />
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setShowReasonModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:2 }} disabled={saving || !reason.trim()}
                onClick={() => handleSubmitReason(showReasonModal)}>
                {saving ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
