import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { content, postedBy } = await req.json()
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
    const organizationId = process.env.LINKEDIN_ORGANIZATION_ID

    if (!accessToken) {
      return NextResponse.json({ error: 'LinkedIn not configured. Add LINKEDIN_ACCESS_TOKEN to .env.local' }, { status: 400 })
    }

    // Post to LinkedIn API
    const authorUrn = organizationId
      ? `urn:li:organization:${organizationId}`
      : `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`

    const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    })

    const liData = await liRes.json()
    if (!liRes.ok) throw new Error(liData.message || 'LinkedIn API error')

    // Log to db
    const supabase = createAdminSupabaseClient()
    await supabase.from('linkedin_posts').insert({
      posted_by: postedBy, content, status: 'published',
      linkedin_post_id: liData.id
    })

    return NextResponse.json({ success: true, postId: liData.id })
  } catch (e: any) {
    // Log failure to db
    try {
      const supabase = createAdminSupabaseClient()
      const { postedBy, content } = await req.json().catch(() => ({}))
      await supabase.from('linkedin_posts').insert({ posted_by: postedBy, content, status: 'failed' })
    } catch {}
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
