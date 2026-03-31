import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { full_name, email, password, designation, department, phone, joining_date, role, total_leaves } = body

    if (!email || !password || !full_name)
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })

    const supabase = createAdminSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name, role: role || 'employee' }
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    await supabase.from('profiles').update({
      designation, department, phone,
      joining_date: joining_date || null,
      role: role || 'employee',
      total_leaves: total_leaves || 20
    }).eq('id', authData.user.id)

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
