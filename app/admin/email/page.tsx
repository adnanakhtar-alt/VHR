'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminEmail() {
  const [profile, setProfile] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ to:'all', subject:'', body:'' })
  const [customEmails, setCustomEmails] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href='/auth/login'; return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: emps } = await supabase.from('profiles').select('id, full_name, email').eq('is_active', true)
      setEmployees(emps || [])
      const { data: emailLogs } = await supabase.from('email_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10)
      setLogs(emailLogs || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSend = async () => {
    setSending(true); setMsg('')
    let recipients: string[] = []
    if (form.to === 'all') {
      recipients = employees.map(e => e.email)
    } else if (form.to === 'custom') {
      recipients = customEmails.split(',').map(e => e.trim()).filter(Boolean)
    } else {
      const emp = employees.find(e => e.id === form.to)
      if (emp) recipients = [emp.email]
    }

    const res = await fetch('/api/admin/send-email', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ ...form, recipients, sentBy: profile?.id })
    })
    const json = await res.json()
    if (res.ok) {
      setMsg(`Email sent to ${recipients.length} recipient(s)!`)
      setForm({ to:'all', subject:'', body:'' })
      const { data: emailLogs } = await supabase.from('email_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10)
      setLogs(emailLogs || [])
    } else {
      setMsg('Error: ' + json.error)
    }
    setSending(false)
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>Send Email</h1>
            <p style={{ color:'var(--text-2)', marginTop:4 }}>Send emails to your team directly from the portal</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:20 }}>
            {/* Compose */}
            <div className="card">
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, marginBottom:20 }}>✉ Compose Email</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label className="label">Send To</label>
                  <select className="input" value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))}>
                    <option value="all">📧 All Employees ({employees.length})</option>
                    <option value="custom">✏️ Custom Emails</option>
                    <option disabled>──── Individual ────</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.email})</option>)}
                  </select>
                </div>
                {form.to === 'custom' && (
                  <div>
                    <label className="label">Email Addresses (comma-separated)</label>
                    <input className="input" placeholder="a@example.com, b@example.com"
                      value={customEmails} onChange={e => setCustomEmails(e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="label">Subject</label>
                  <input className="input" placeholder="Email subject..."
                    value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="input" placeholder="Write your message here..."
                    style={{ minHeight:180 }}
                    value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
                </div>
                {msg && (
                  <div style={{
                    padding:'10px 14px', borderRadius:8, fontSize:14,
                    background: msg.startsWith('Error') ? 'rgba(255,77,109,0.1)' : 'rgba(46,204,113,0.1)',
                    color: msg.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                    border: `1px solid ${msg.startsWith('Error') ? 'rgba(255,77,109,0.3)' : 'rgba(46,204,113,0.3)'}`
                  }}>{msg}</div>
                )}
                <button className="btn btn-primary" onClick={handleSend}
                  disabled={sending || !form.subject || !form.body}
                  style={{ justifyContent:'center', padding:'12px' }}>
                  {sending ? 'Sending...' : '✉ Send Email'}
                </button>
              </div>
            </div>

            {/* Recent logs */}
            <div className="card">
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, marginBottom:20 }}>📬 Recent Sent</h2>
              {logs.length === 0 ? (
                <p style={{ color:'var(--text-3)', textAlign:'center', padding:'24px 0' }}>No emails sent yet</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {logs.map(l => (
                    <div key={l.id} className="card-sm">
                      <div style={{ fontWeight:600, fontSize:14, color:'var(--text-1)', marginBottom:4 }}>{l.subject}</div>
                      <div style={{ fontSize:12, color:'var(--text-3)' }}>
                        To: {l.recipients.length} recipient{l.recipients.length>1?'s':''}
                        · {new Date(l.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                        By {l.profiles?.full_name}
                        · <span style={{ color: l.status==='sent' ? 'var(--success)' : 'var(--danger)' }}>{l.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
