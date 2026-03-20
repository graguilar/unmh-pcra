import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    const in7Days = new Date()
    in7Days.setDate(today.getDate() + 7)
    const in7Str = in7Days.toISOString().split('T')[0]

    const { data: expiring, error } = await supabase
      .from('submissions')
      .select('*')
      .in('status', ['submitted', 'approved', 'in_progress'])
      .not('expiration_date', 'is', null)
      .lte('expiration_date', in7Str)

    if (error) throw error

    const results = []

    for (const sub of expiring || []) {
      const expDate = new Date(sub.expiration_date)
      const isExpired = expDate < today
      const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'UNMH PCRA <onboarding@resend.dev>',
          to: [sub.requester_email],
          subject: isExpired
            ? `EXPIRED: PCRA ${sub.doc_id} has expired`
            : `Action Required: PCRA ${sub.doc_id} expires in ${daysLeft} day(s)`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#ba0c2f;color:#fff;padding:16px 24px">
                <strong>UNMH Pre-Construction Risk Assessment</strong>
              </div>
              <div style="padding:24px;background:#fff;border:1px solid #e5e7eb">
                <h2 style="color:#111;margin-top:0">
                  ${isExpired ? '⚠️ PCRA Expired' : `⚠️ PCRA Expiring in ${daysLeft} Day(s)`}
                </h2>
                <p>Your Pre-Construction Risk Assessment <strong>${sub.doc_id}</strong> for <strong>${sub.project_name || 'your project'}</strong> ${isExpired ? 'has expired' : `will expire on ${sub.expiration_date}`}.</p>
                <p>Please contact the PCRA team to renew or extend your assessment before continuing work.</p>
                <a href="https://unmh-pcra.vercel.app/contact/${sub.doc_id}"
                   style="display:inline-block;background:#ba0c2f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;margin-top:8px">
                  Contact PCRA Team →
                </a>
                <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
                <p style="font-size:12px;color:#9ca3af">UNMH PCRA System · University of New Mexico Hospital</p>
              </div>
            </div>
          `
        })
      })

      results.push({ doc_id: sub.doc_id, expired: isExpired, daysLeft, emailSent: emailRes.ok })
    }

    return NextResponse.json({ checked: expiring?.length || 0, results })

  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}