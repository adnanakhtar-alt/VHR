'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ total:0, present:0, onLeave:0, pending:0, news:0 })
  const [recentLeaves, setRecentLeaves] = useState<any[]>([])
  const [attendanceChart, setAttendanceChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)

      const today = new Date().toISOString().split('T')[0]
      const [{ count: total }, { count: present }, { count: onLeave }, { count: pending }, { count: newsCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count:'exact', head:true }).eq('is_active', true).neq('role','admin'),
        supabase.from('attendance').select('*', { count:'exact', head:true }).eq('date', today).eq('status','present'),
        supabase.from('leaves').select('*', { count:'exact', head:true }).eq('status','approved').lte('start_date', today).gte('end_date', today),
        supabase.from('leaves').select('*', { count:'exact', head:true }).eq('status','pending'),
        supabase.from('news').select('*', { count:'exact', head:true }).eq('is_published', true),
      ])
      setStats({ total: total||0, present: present||0, onLeave: onLeave||0, pending: pending||0, news: newsCount||0 })

      const { data: leaves } = await supabase.from('leaves')
        .select('*, profiles(full_name, designation)')
        .order('created_at', { ascending:false }).limit(5)
      setRecentLeaves(leaves || [])

      // Last 7 days attendance
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayName = d.toLocaleDateString('en', { weekday:'short' })
        const { count } = await supabase.from('attendance').select('*', { count:'exact', head:true })
          .eq('date', dateStr).eq('status','present')
        days.push({ day: dayName, present: count || 0 })
      }
      setAttendanceChart(days)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading dashboard...</div>

  const statCards = [
    { label:'Total Employees', value: stats.total, icon:'👥', color:'var(--brand)', bg:'var(--brand-dim)' },
    { label:'Present Today',   value: stats.present, icon:'✅', color:'var(--success)', bg:'rgba(46,204,113,0.12)' },
    { label:'On Leave Today',  value: stats.onLeave, icon:'🌿', color:'var(--accent)', bg:'var(--accent-dim)' },
    { label:'Pending Leaves',  value: stats.pending, icon:'⏳', color:'var(--warn)', bg:'rgba(255,140,66,0.12)' },
  ]

  const statusColor: Record<string,string> = { pending:'warn', approved:'success', rejected:'danger' }

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name || ''} userEmail={profile?.email || ''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>
              Good {new Date().getHours()<12?'Morning':'Afternoon'}, {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color:'var(--text-2)', marginTop:4 }}>Here's what's happening today — {new Date().toLocaleDateString('en', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
          </div>

          {/* Stat Cards */}
          <div className="grid-4" style={{ marginBottom:24 }}>
            {statCards.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--text-1)', lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
            {/* Attendance Chart */}
            <div className="card">
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-1)', marginBottom:20 }}>Attendance — Last 7 Days</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={attendanceChart} barCategoryGap="30%">
                  <XAxis dataKey="day" tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-3)', fontSize:12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-1)' }} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="present" radius={[6,6,0,0]}>
                    {attendanceChart.map((_, i) => <Cell key={i} fill="var(--brand)" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-1)', marginBottom:20 }}>Quick Actions</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { href:'/admin/employees', label:'Add New Employee', icon:'👤', color:'var(--brand)' },
                  { href:'/admin/leaves',    label:'Review Leave Requests', icon:'📋', color:'var(--warn)', badge: stats.pending },
                  { href:'/admin/news',      label:'Post Announcement', icon:'📢', color:'var(--accent)' },
                  { href:'/admin/email',     label:'Send Email to Team', icon:'✉', color:'var(--success)' },
                ].map(a => (
                  <a key={a.href} href={a.href} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                    borderRadius:10, background:'var(--bg-card2)', border:'1px solid var(--border-soft)',
                    textDecoration:'none', color:'var(--text-1)', fontSize:14, transition:'all 0.15s'
                  }}>
                    <span style={{ fontSize:18 }}>{a.icon}</span>
                    <span style={{ flex:1 }}>{a.label}</span>
                    {a.badge ? <span className="badge badge-warn">{a.badge}</span> : null}
                    <span style={{ color:'var(--text-3)' }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Leave Requests */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-1)' }}>Recent Leave Requests</h2>
              <a href="/admin/leaves" style={{ fontSize:13, color:'var(--brand)', textDecoration:'none' }}>View All →</a>
            </div>
            {recentLeaves.length === 0 ? (
              <p style={{ color:'var(--text-3)', textAlign:'center', padding:'24px 0' }}>No leave requests yet</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Employee</th><th>Type</th><th>Duration</th><th>Status</th><th>Applied</th>
                  </tr></thead>
                  <tbody>
                    {recentLeaves.map(l => (
                      <tr key={l.id}>
                        <td><b style={{ color:'var(--text-1)' }}>{l.profiles?.full_name}</b><br/><span style={{ color:'var(--text-3)', fontSize:12 }}>{l.profiles?.designation}</span></td>
                        <td style={{ textTransform:'capitalize' }}>{l.leave_type}</td>
                        <td>{l.days_count} day{l.days_count>1?'s':''}</td>
                        <td><span className={`badge badge-${statusColor[l.status]}`}>{l.status}</span></td>
                        <td style={{ color:'var(--text-2)', fontSize:13 }}>{new Date(l.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
