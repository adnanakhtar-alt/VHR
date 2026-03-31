'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminLinkedIn() {
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [msg, setMsg] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href='/auth/login'; return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data } = await supabase.from('linkedin_posts').select('*, profiles(full_name)').order('created_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true); setMsg('')
    const res = await fetch('/api/admin/linkedin-post', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ content, postedBy: profile?.id })
    })
    const json = await res.json()
    if (res.ok) {
      setMsg('Posted to LinkedIn successfully!')
      setContent('')
      const { data } = await supabase.from('linkedin_posts').select('*, profiles(full_name)').order('created_at', { ascending: false })
      setPosts(data || [])
    } else {
      setMsg('Error: ' + json.error + '. Make sure LinkedIn API is configured in .env')
    }
    setPosting(false)
  }

  const charCount = content.length
  const charLimit = 3000

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>
              💼 LinkedIn Posts
            </h1>
            <p style={{ color:'var(--text-2)', marginTop:4 }}>Post updates to your company LinkedIn page</p>
          </div>

          {/* Setup notice */}
          <div style={{ background:'rgba(90,103,250,0.08)', border:'1px solid rgba(90,103,250,0.2)', borderRadius:12, padding:'14px 18px', marginBottom:24 }}>
            <p style={{ fontSize:13, color:'var(--brand-light)' }}>
              ℹ️ <b>Setup required:</b> LinkedIn posting needs your LinkedIn API credentials in <code style={{ background:'rgba(255,255,255,0.1)', padding:'2px 6px', borderRadius:4 }}>.env.local</code>.
              See the <b>SETUP_GUIDE.md</b> for step-by-step instructions.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:20 }}>
            <div className="card">
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, marginBottom:20 }}>Compose Post</h2>
              <div style={{ position:'relative' }}>
                <textarea className="input" placeholder="What do you want to share with your network?&#10;&#10;Tips:&#10;• Start with a hook&#10;• Add value for your audience&#10;• Use line breaks for readability"
                  style={{ minHeight:220, paddingBottom:32 }}
                  value={content}
                  maxLength={charLimit}
                  onChange={e => setContent(e.target.value)} />
                <div style={{ position:'absolute', bottom:10, right:12, fontSize:12, color: charCount > charLimit * 0.9 ? 'var(--warn)' : 'var(--text-3)' }}>
                  {charCount}/{charLimit}
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
              <button className="btn btn-primary" style={{ marginTop:14, width:'100%', justifyContent:'center', padding:12 }}
                onClick={handlePost} disabled={posting || !content.trim()}>
                {posting ? 'Posting...' : '💼 Post to LinkedIn'}
              </button>
            </div>

            <div className="card">
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, marginBottom:20 }}>Post History</h2>
              {posts.length === 0 ? (
                <p style={{ color:'var(--text-3)', textAlign:'center', padding:'24px 0' }}>No posts yet</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {posts.map(p => (
                    <div key={p.id} className="card-sm">
                      <p style={{ fontSize:13, color:'var(--text-1)', marginBottom:6, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {p.content}
                      </p>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'var(--text-3)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                        <span className={`badge badge-${p.status==='published'?'success':p.status==='failed'?'danger':'neutral'}`}>{p.status}</span>
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
