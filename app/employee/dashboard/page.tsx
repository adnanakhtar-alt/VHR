'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [leaveStats, setLeaveStats] = useState({ total:0, used:0, pending:0 })
  const [news, setNews] = useState<any[]>([])
  const [recentAttendance, setRecentAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [time, setTime] = useState(new Date())

  const supabase = createClient()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href='/auth/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const today = new Date().toISOString().split('T')[0]
    const { data: att } = await supabase.from('attendance').select('*').eq('employee_id', user.id).eq('date', today).single()
    setTodayRecord(att)

    const { data: leaves } = await supabase.from('leaves').select('*').eq('employee_id', user.id)
    const approved = leaves?.filter(l => l.status === 'approved').reduce((a:number,l:any) => a + l.days_count, 0) || 0
    const pending = leaves?.filter(l => l.status === 'pending').length || 0
    setLeaveStats({ total: p?.total_leaves || 20, used: approved, pending })

    const { data: newsData } = await supabase.from('news').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(3)
    setNews(newsData || [])

    const { data: recent } = await supabase.from('attendance').select('*').eq('employee_id', user.id).order('date', { ascending: false }).limit(7)
    setRecentAttendance(recent || [])
    setLoading(false)
  }

  const handleCheckIn = async () => {
    setCheckingIn(true)
    const { data: { user } } = await supabase.auth.getUser()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()
    const hour = new Date().getHours()
    const status = hour >= 9 ? 'late' : 'present'
    const { data } = await supabase.from('attendance').upsert({ employee_id: user!.id, date: today, check_in: now, status }, { onConflict:'employee_id,date' }).select().single()
    setTodayRecord(data)
    setCheckingIn(false)
  }

  const handleCheckOut = async () => {
    setCheckingIn(true)
    if (!todayRecord) return
    const { data } = await supabase.from('attendance').update({ check_out: new Date().toISOString() }).eq('id', todayRecord.id).select().single()
    setTodayRecord(data)
    setCheckingIn(false)
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' })
  const remaining = Math.max(0, leaveStats.total - leaveStats.used)
  const catIcon: Record<string,string> = { general:'📣', holiday:'🎉', urgent:'🚨', event:'📅', policy:'📋' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>
              Hello, {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color:'var(--text-2)', marginTop:4 }}>
              {time.toLocaleDateString('en', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              {' · '}
              <span style={{ fontFamily:'var(--font-display)', color:'var(--brand)', fontWeight:600 }}>
                {time.toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
              </span>
            </p>
          </div>

          {/* Check In / Out Card */}
          <div className="card" style={{ marginBottom:20, background:'linear-gradient(135deg, #1a1f3c 0%, #0d1528 100%)', border:'1px solid rgba(90,103,250,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--text-1)', marginBottom:8 }}>Today's Attendance</h2>
                <div style={{ display:'flex', gap:24 }}>
                  <div>
                    <div style={{ fontSize:12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Check In</div>
                    <div style={{ fontSize:20, fontWeight:700, color: todayRecord?.check_in ? 'var(--accent)' : 'var(--text-3)', fontFamily:'var(--font-display)' }}>
                      {todayRecord?.check_in ? formatTime(todayRecord.check_in) : '—:——'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Check Out</div>
                    <div style={{ fontSize:20, fontWeight:700, color: todayRecord?.check_out ? 'var(--warn)' : 'var(--text-3)', fontFamily:'var(--font-display)' }}>
                      {todayRecord?.check_out ? formatTime(todayRecord.check_out) : '—:——'}
                    </div>
                  </div>
                  {todayRecord && (
                    <div>
                      <div style={{ fontSize:12, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Status</div>
                      <div style={{ marginTop:4 }}>
                        <span className={`badge badge-${todayRecord.status==='present'?'success':todayRecord.status==='late'?'warn':'neutral'}`}>
                          {todayRecord.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {!todayRecord?.check_in && (
                  <button className="btn btn-primary" style={{ padding:'12px 24px', fontSize:15 }}
                    onClick={handleCheckIn} disabled={checkingIn}>
                    {checkingIn ? '...' : '⏵ Check In'}
                  </button>
                )}
                {todayRecord?.check_in && !todayRecord?.check_out && (
                  <button className="btn" style={{ padding:'12px 24px', fontSize:15, background:'var(--warn)', color:'#fff' }}
                    onClick={handleCheckOut} disabled={checkingIn}>
                    {checkingIn ? '...' : '⏹ Check Out'}
                  </button>
                )}
                {todayRecord?.check_in && todayRecord?.check_out && (
                  <div style={{ color:'var(--success)', fontSize:14, fontWeight:600 }}>✓ Done for today!</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'var(--brand-dim)', color:'var(--brand)' }}>🌿</div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--text-1)', lineHeight:1 }}>{remaining}</div>
                <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>Leaves Remaining</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'rgba(46,204,113,0.12)', color:'var(--success)' }}>✅</div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--text-1)', lineHeight:1 }}>{leaveStats.used}</div>
                <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>Days Used</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background:'rgba(255,140,66,0.12)', color:'var(--warn)' }}>⏳</div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--text-1)', lineHeight:1 }}>{leaveStats.pending}</div>
                <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>Pending Requests</div>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Recent Attendance */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16 }}>Recent Attendance</h2>
                <a href="/employee/attendance" style={{ fontSize:13, color:'var(--brand)', textDecoration:'none' }}>View All →</a>
              </div>
              {recentAttendance.length === 0 ? (
                <p style={{ color:'var(--text-3)', textAlign:'center', padding:16 }}>No records yet</p>
              ) : recentAttendance.map(r => (
                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border-soft)' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:'var(--text-1)' }}>{new Date(r.date).toLocaleDateString('en', { weekday:'short', month:'short', day:'numeric' })}</div>
                    <div style={{ fontSize:12, color:'var(--text-3)' }}>{r.check_in ? formatTime(r.check_in) : 'No check-in'}</div>
                  </div>
                  <span className={`badge badge-${r.status==='present'?'success':r.status==='late'?'warn':r.status==='absent'?'danger':'neutral'}`}>{r.status}</span>
                </div>
              ))}
            </div>

            {/* News */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16 }}>Announcements</h2>
              </div>
              {news.length === 0 ? (
                <p style={{ color:'var(--text-3)', textAlign:'center', padding:16 }}>No announcements</p>
              ) : news.map(n => (
                <div key={n.id} style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border-soft)' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:18 }}>{catIcon[n.category]||'📣'}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:'var(--text-1)', marginBottom:4 }}>{n.title}</div>
                      <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.5 }}>{n.content.slice(0,120)}{n.content.length>120?'...':''}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
