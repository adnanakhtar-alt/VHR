'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
    if (profile?.role === 'admin' || profile?.role === 'hr') {
      router.push('/admin/dashboard')
    } else {
      router.push('/employee/dashboard')
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)', padding:16,
      backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(90,103,250,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,229,195,0.05) 0%, transparent 50%)'
    }}>
      <div style={{ width:'100%', maxWidth:420 }} className="animate-fadeUp">
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            width:56, height:56, borderRadius:16, background:'var(--brand)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            fontSize:28, marginBottom:16, boxShadow:'0 0 32px rgba(90,103,250,0.4)'
          }}>👥</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>HR Portal</h1>
          <p style={{ color:'var(--text-2)', marginTop:4, fontSize:14 }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div style={{
                background:'rgba(255,77,109,0.1)', border:'1px solid rgba(255,77,109,0.3)',
                borderRadius:10, padding:'10px 14px', color:'var(--danger)', fontSize:14
              }}>{error}</div>
            )}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width:'100%', justifyContent:'center', marginTop:4, padding:'12px 20px', fontSize:15 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <div style={{ marginTop:20, textAlign:'center' }}>
            <p style={{ color:'var(--text-3)', fontSize:13 }}>
              No account? <span style={{ color:'var(--brand)' }}>Contact your HR/Admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
