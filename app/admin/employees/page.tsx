'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function AdminEmployees() {
  const [profile, setProfile] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEmp, setEditEmp] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    full_name:'', email:'', password:'', designation:'', department:'',
    phone:'', joining_date:'', role:'employee', total_leaves:20
  })

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href='/auth/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    const { data: emps } = await supabase.from('profiles').select('*').order('full_name')
    setEmployees(emps || [])
    setLoading(false)
  }

  const openAdd = () => {
    setEditEmp(null)
    setForm({ full_name:'', email:'', password:'', designation:'', department:'', phone:'', joining_date:'', role:'employee', total_leaves:20 })
    setMsg('')
    setShowModal(true)
  }

  const openEdit = (emp: any) => {
    setEditEmp(emp)
    setForm({ ...emp, password:'' })
    setMsg('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true); setMsg('')
    try {
      if (editEmp) {
        const { error } = await supabase.from('profiles').update({
          full_name: form.full_name, designation: form.designation,
          department: form.department, phone: form.phone,
          joining_date: form.joining_date, role: form.role,
          total_leaves: Number(form.total_leaves)
        }).eq('id', editEmp.id)
        if (error) throw error
        setMsg('Employee updated!')
      } else {
        const res = await fetch('/api/admin/create-employee', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify(form)
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setMsg('Employee created! They can now log in.')
      }
      await loadData()
      setTimeout(() => { setShowModal(false); setMsg('') }, 1500)
    } catch(e:any) {
      setMsg('Error: ' + e.message)
    }
    setSaving(false)
  }

  const handleToggleActive = async (emp: any) => {
    await supabase.from('profiles').update({ is_active: !emp.is_active }).eq('id', emp.id)
    await loadData()
  }

  const filtered = employees.filter(e =>
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)', color:'var(--text-2)' }}>Loading...</div>

  return (
    <div style={{ display:'flex' }}>
      <Sidebar role={profile?.role} userName={profile?.full_name||''} userEmail={profile?.email||''} />
      <main style={{ marginLeft:240, padding:32, minHeight:'100vh', background:'var(--bg)', flex:1 }}>
        <div className="animate-fadeUp">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-1)' }}>Employees</h1>
              <p style={{ color:'var(--text-2)', marginTop:4 }}>{employees.length} team members</p>
            </div>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
          </div>

          <div style={{ marginBottom:20 }}>
            <input className="input" placeholder="Search by name, email or department..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ maxWidth:400 }} />
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Employee</th><th>Department</th><th>Role</th>
                <th>Leaves Left</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(emp => {
                  const roleColor: Record<string,string> = { admin:'brand', hr:'warn', employee:'neutral' }
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:36, height:36, borderRadius:8, flexShrink:0,
                            background:'linear-gradient(135deg, var(--brand), var(--accent))',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:13, fontWeight:700, color:'#fff'
                          }}>{emp.full_name?.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}</div>
                          <div>
                            <div style={{ fontWeight:600, color:'var(--text-1)' }}>{emp.full_name}</div>
                            <div style={{ fontSize:12, color:'var(--text-3)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department || <span style={{ color:'var(--text-3)' }}>—</span>}</td>
                      <td><span className={`badge badge-${roleColor[emp.role]||'neutral'}`}>{emp.role}</span></td>
                      <td>{emp.total_leaves} days</td>
                      <td>
                        <span className={`badge badge-${emp.is_active ? 'success' : 'danger'}`}>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}>Edit</button>
                          <button className="btn btn-sm"
                            style={{ background: emp.is_active ? 'rgba(255,77,109,0.15)' : 'rgba(46,204,113,0.15)',
                              color: emp.is_active ? 'var(--danger)' : 'var(--success)', border:'none' }}
                            onClick={() => handleToggleActive(emp)}>
                            {emp.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowModal(false) }}>
          <div className="modal" style={{ maxWidth:560, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20 }}>
                {editEmp ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background:'none', border:'none', color:'var(--text-2)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { key:'full_name', label:'Full Name', type:'text', placeholder:'John Doe', span:2 },
                { key:'email', label:'Email', type:'email', placeholder:'john@company.com', disabled:!!editEmp },
                { key:'password', label: editEmp ? 'New Password (leave blank)' : 'Password', type:'password', placeholder:'••••••••' },
                { key:'designation', label:'Job Title', type:'text', placeholder:'Software Engineer' },
                { key:'department', label:'Department', type:'text', placeholder:'Engineering' },
                { key:'phone', label:'Phone', type:'tel', placeholder:'+92 300 0000000' },
                { key:'joining_date', label:'Joining Date', type:'date' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.span===2 ? '1/-1' : undefined }}>
                  <label className="label">{f.label}</label>
                  <input className="input" type={f.type} placeholder={f.placeholder}
                    disabled={f.disabled}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Annual Leaves</label>
                <input className="input" type="number" min={0} max={60}
                  value={form.total_leaves}
                  onChange={e => setForm(p => ({ ...p, total_leaves: Number(e.target.value) }))} />
              </div>
            </div>
            {msg && (
              <div style={{
                marginTop:14, padding:'10px 14px', borderRadius:8, fontSize:14,
                background: msg.startsWith('Error') ? 'rgba(255,77,109,0.1)' : 'rgba(46,204,113,0.1)',
                color: msg.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
                border: `1px solid ${msg.startsWith('Error') ? 'rgba(255,77,109,0.3)' : 'rgba(46,204,113,0.3)'}`
              }}>{msg}</div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editEmp ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
