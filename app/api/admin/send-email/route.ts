import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, body, sentBy } = await req.json()

    if (!recipients?.length || !subject || !body)
      return NextResponse.json({ error: 'Recipients, subject and body required' }, { status: 400 })

    // Dynamically import nodemailer (server only)
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"HR Portal" <${process.env.SMTP_FROM}>`,
      to: recipients.join(', '),
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#5a67fa;padding:24px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0">👥 HR Portal</h2>
          </div>
          <div style="background:#f8f9ff;padding:28px;border-radius:0 0 8px 8px">
            <div style="white-space:pre-wrap;font-size:15px;color:#1a1a2e;line-height:1.6">${body}</div>
            <hr style="border:1px solid #e0e0f0;margin:24px 0"/>
            <p style="font-size:12px;color:#888">This email was sent from the HR Portal. Please do not reply directly.</p>
          </div>
        </div>
      `,
    })

    // Log to db
    const supabase = createAdminSupabaseClient()
    await supabase.from('email_logs').insert({
      sent_by: sentBy, recipients, subject, body, status: 'sent'
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
