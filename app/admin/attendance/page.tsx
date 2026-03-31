'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminAttendance() {
  const [profile, setProfile] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')

  const supabase = createClient()

  useEffect(() => { loadData() }, [dateFilter])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href='/auth/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const { data } = await supabase
      .from('attendance')
      .select('*, profiles(full_name, email, designation, department)')
      .eq('date', dateFilter)
      .order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  const handleApproveRegulation = async (id: string) => {
    await supabase.from('attendance').update({ regulation_approved: true }).eq('id', id)
    await loadData()
  }

  const formatTime = (ts: string | null) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' })
  }

  const getDuration = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '—'
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  const filtered = records.filter(r =>
    r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.profiles?.department?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor: Record<string,string> = { present:'success', absent:'danger', late:'warn', 'half-day':'brand', holiday:'neutral' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>Attendance</h1>
            <p style={{ color:'var(--text-2)', marginTop:4 }}>{records.length} records for {new Date(dateFilter).toLocaleDateString('en', { weekday:'long', month:'long', day:'numeric' })}</p>
          </div>

          {/* Summary */}
          <div className="grid-4" style={{ marginBottom:24 }}>
            {[
              { label:'Present', value: records.filter(r=>r.status==='present').length, color:'var(--success)', bg:'rgba(46,204,113,0.12)' },
              { label:'Absent',  value: records.filter(r=>r.status==='absent').length,  color:'var(--danger)',  bg:'rgba(255,77,109,0.12)' },
              { label:'Late',    value: records.filter(r=>r.status==='late').length,    color:'var(--warn)',    bg:'rgba(255,140,66,0.12)' },
              { label:'Pending Regulations', value: records.filter(r=>r.missed_reason && !r.regulation_approved).length, color:'var(--brand)', bg:'var(--brand-dim)' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {s.label==='Present'?'✅':s.label==='Absent'?'❌':s.label==='Late'?'⏰':'📋'}
                </div>
                <div>
                  <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--font-display)', color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'var(--text-2)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:12, marginBottom:20 }}>
            <input className="input" type="date" value={dateFilter}
              onChange={e => setDateFilter(e.target.value)} style={{ width:'auto' }} />
            <input className="input" placeholder="Search employee..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, maxWidth:300 }} />
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Employee</th><th>Check In</th><th>Check Out</th>
                <th>Duration</th><th>Status</th><th>Missed Reason</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-3)', padding:'32px' }}>No records found</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight:600, color:'var(--text-1)' }}>{r.profiles?.full_name}</div>
                      <div style={{ fontSize:12, color:'var(--text-3)' }}>{r.profiles?.department}</div>
                    </td>
                    <td style={{ color:'var(--accent)', fontWeight:500 }}>{formatTime(r.check_in)}</td>
                    <td style={{ color:'var(--warn)', fontWeight:500 }}>{formatTime(r.check_out)}</td>
                    <td style={{ color:'var(--text-2)' }}>{getDuration(r.check_in, r.check_out)}</td>
                    <td><span className={`badge badge-${statusColor[r.status]||'neutral'}`}>{r.status}</span></td>
                    <td>
                      {r.missed_reason ? (
                        <div>
                          <div style={{ fontSize:13, color:'var(--text-2)', maxWidth:200 }}>{r.missed_reason}</div>
                          {r.regulation_approved
                            ? <span className="badge badge-success" style={{ marginTop:4 }}>Approved</span>
                            : null}
                        </div>
                      ) : <span style={{ color:'var(--text-3)' }}>—</span>}
                    </td>
                    <td>
                      {r.missed_reason && !r.regulation_approved && (
                        <button className="btn btn-success btn-sm" onClick={() => handleApproveRegulation(r.id)}>
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
