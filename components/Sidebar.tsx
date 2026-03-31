'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface SidebarProps {
  role: 'admin' | 'hr' | 'employee'
  userName: string
  userEmail: string
}

const adminNav = [
  { href: '/admin/dashboard',  icon: '▦',  label: 'Dashboard' },
  { href: '/admin/employees',  icon: '👥', label: 'Employees' },
  { href: '/admin/attendance', icon: '⏱',  label: 'Attendance' },
  { href: '/admin/leaves',     icon: '🌿', label: 'Leaves' },
  { href: '/admin/news',       icon: '📢', label: 'News' },
  { href: '/admin/email',      icon: '✉',  label: 'Send Email' },
  { href: '/admin/linkedin',   icon: '💼', label: 'LinkedIn' },
]

const employeeNav = [
  { href: '/employee/dashboard',  icon: '▦',  label: 'Dashboard' },
  { href: '/employee/attendance', icon: '⏱',  label: 'Attendance' },
  { href: '/employee/leaves',     icon: '🌿', label: 'Leaves' },
]

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const nav = (role === 'admin' || role === 'hr') ? adminNav : employeeNav
  const initials = userName.split(' ').map((n:string) => n[0]).join('').toUpperCase().slice(0,2)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside style={{
      width:240, minHeight:'100vh', background:'var(--bg-card)',
      borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column',
      position:'fixed', top:0, left:0, zIndex:50, padding:'24px 0'
    }}>
      <div style={{ padding:'0 20px 24px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:10, background:'var(--brand)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
            boxShadow:'0 0 16px rgba(90,103,250,0.4)'
          }}>👥</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, lineHeight:1, color:'var(--text-1)' }}>HR Portal</div>
            <div style={{ fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2 }}>
              {role === 'admin' ? 'Admin Panel' : role === 'hr' ? 'HR Manager' : 'My Workspace'}
            </div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2 }}>
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', borderRadius:10,
              color: active ? 'var(--text-1)' : 'var(--text-2)',
              background: active ? 'var(--brand-dim)' : 'transparent',
              borderLeft: active ? '2px solid var(--brand)' : '2px solid transparent',
              fontWeight: active ? 600 : 400, fontSize:14, textDecoration:'none',
              transition:'all 0.15s'
            }}>
              <span style={{ fontSize:15, width:20, textAlign:'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding:'16px 12px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            background:'linear-gradient(135deg, var(--brand), var(--accent))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:700, color:'#fff'
          }}>{initials || '?'}</div>
          <div style={{ overflow:'hidden', minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userEmail}</div>
          </div>
        </div>
        <button onClick={handleLogout} disabled={loggingOut}
          style={{
            width:'100%', padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)',
            background:'transparent', color:'var(--text-2)', fontSize:13, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6
          }}>
          ↩ {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
