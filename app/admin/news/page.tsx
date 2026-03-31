'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminNews() {
  const [profile, setProfile] = useState<any>(null)
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ title:'', content:'', category:'general' })

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href='/auth/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    const { data } = await supabase.from('news').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setNews(data || [])
    setLoading(false)
  }

  const openAdd = () => { setEditItem(null); setForm({ title:'', content:'', category:'general' }); setShowModal(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ title:item.title, content:item.content, category:item.category }); setShowModal(true) }

  const handleSave = async () => {
    setSaving(true)
    if (editItem) {
      await supabase.from('news').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id)
    } else {
      await supabase.from('news').insert({ ...form, posted_by: profile?.id })
    }
    setSaving(false); setShowModal(false)
    await loadData()
  }

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('news').update({ is_published: !current }).eq('id', id)
    await loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('news').delete().eq('id', id)
    await loadData()
  }

  const catColor: Record<string,string> = { general:'brand', holiday:'success', urgent:'danger', event:'accent', policy:'warn' }
  const catIcon: Record<string,string>  = { general:'📣', holiday:'🎉', urgent:'🚨', event:'📅', policy:'📋' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>News & Announcements</h1>
              <p style={{ color:'var(--text-2)', marginTop:4 }}>{news.length} announcements total</p>
            </div>
            <button className="btn btn-primary" onClick={openAdd}>+ New Announcement</button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {news.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>No announcements yet. Create your first one!</div>
            ) : news.map(n => (
              <div key={n.id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:20 }}>{catIcon[n.category]||'📣'}</span>
                      <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'var(--text-1)' }}>{n.title}</h3>
                      <span className={`badge badge-${catColor[n.category]||'brand'}`}>{n.category}</span>
                      {!n.is_published && <span className="badge badge-neutral">Draft</span>}
                    </div>
                    <p style={{ color:'var(--text-2)', fontSize:14, lineHeight:1.6, marginBottom:10 }}>{n.content}</p>
                    <div style={{ fontSize:12, color:'var(--text-3)' }}>
                      Posted by {n.profiles?.full_name} · {new Date(n.created_at).toLocaleDateString('en', { month:'long', day:'numeric', year:'numeric' })}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, marginLeft:16, flexShrink:0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(n)}>Edit</button>
                    <button className="btn btn-sm"
                      style={{ background: n.is_published ? 'rgba(255,140,66,0.15)' : 'rgba(46,204,113,0.15)', color: n.is_published ? 'var(--warn)' : 'var(--success)', border:'none' }}
                      onClick={() => handleToggle(n.id, n.is_published)}>
                      {n.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20 }}>{editItem ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'var(--text-2)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="general">📣 General</option>
                  <option value="holiday">🎉 Holiday</option>
                  <option value="urgent">🚨 Urgent</option>
                  <option value="event">📅 Event</option>
                  <option value="policy">📋 Policy</option>
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" placeholder="Announcement title..."
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Content</label>
                <textarea className="input" placeholder="Write your announcement..."
                  style={{ minHeight:120 }}
                  value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={handleSave} disabled={saving || !form.title || !form.content}>
                {saving ? 'Saving...' : editItem ? 'Update' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
