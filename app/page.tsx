'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin' || profile?.role === 'hr') {
        router.push('/admin/dashboard')
      } else {
        router.push('/employee/dashboard')
      }
    }
    check()
  }, [router])

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid var(--brand)', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'var(--text-2)' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
