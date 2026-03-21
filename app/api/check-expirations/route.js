import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const COORDINATOR_EMAIL = 'griot7070@gmail.com'

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: 'UNMH PCRA <onboarding@resend.dev>', to, subject, html })
  })
  return res.ok
}

function emailHtml({ title, color, sub, message, actions }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:${color};color:#fff;padding:20px 24px">
        <div style="font-size:18px;font-weight:900">${title}</div>
        <div style="font-size:12px;opacity:0.85;margin-top:4px">UNMH Pre-Construction Risk Assessment</div>
      </div>
      <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb">
        <table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff;padding:16px;border-radius:8px">
          <tr><td style="padding:8px;font-weight:700;width:140px;color:#6b7280">Doc ID:</td><td style="padding:8px;font-weight:900;color:#ba0c2f">${sub.doc_id}</td></tr>
          <tr><td style="padding:8px;font-weight:700;color:#6b7280">Project:</td><td style="padding:8px">${sub.project_name || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:700;color:#6b7280">Building:</td><td style="padding:8px">${sub.building || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:700;color:#6b7280">Expiration:</td><td style="padding:8px;color:#ba0c2f;font-weight:700">${sub.expiration_date}</td></tr>
        </table>
        <p style="font-size:14px;color:#374151;margin-top:16px">${message}</p>
        ${actions ? `<div style="margin-top:16px;padding:14px;background:#fff3cd;border:1px solid #fcd34d;border-radius:6px;font-size:13px"><strong>Required Actions:</strong><br/>${actions}</div>` : ''}
        <div style="margin-top:20px">
          <a href="https://unmh-pcra.vercel.app/contact/${sub.doc_id}" style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px">Contact PCRA Team →</a>
        </div>
      </div>
      <div style="padding:12px 24px;background:#f3f4f6;font-size:11px;color:#9ca3af;text-align:center">UNMH PCRA System · Automated Notification</div>
    </div>
  `
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const in7 = new Date(today); in7.setDate(today.getDate() + 7)
    const in1 = new Date(today); in1.setDate(today.getDate() + 1)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

    const in7Str = in7.toISOString().split('T')[0]
    const in1Str = in1.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: subs, error } = await supabase
      .from('submissions')
      .select('doc_id, project_name, building, expiration_date, requester_email, status')
      .in('status', ['submitted', 'approved', 'in_progress', 'active'])
      .not('expiration_date', 'is', null)

    if (error) throw error

    const results = []

    for (const sub of subs || []) {
      const exp = sub.expiration_date
      const to = sub.requester_email ? [sub.requester_email] : [COORDINATOR_EMAIL]

      // 7 days before
      if (exp === in7Str) {
        const sent = await sendEmail(to,
          `Reminder: PCRA ${sub.doc_id} expires in 7 days`,
          emailHtml({
            title: '📅 PCRA Expiring in 7 Days',
            color: '#059669',
            sub,
            message: 'Your PCRA will expire in 7 days. Please review whether the project will still be active and plan for renewal if needed.',
            actions: 'Review current project scope · Contact PCRA team if renewal needed'
          })
        )
        results.push({ doc_id: sub.doc_id, stage: '7_days_before', sent })
      }

      // 24 hours before
      if (exp === in1Str) {
        const sent = await sendEmail([...to, COORDINATOR_EMAIL],
          `⚠️ URGENT: PCRA ${sub.doc_id} expires TOMORROW`,
          emailHtml({
            title: '⚠️ PCRA Expires Tomorrow',
            color: '#d97706',
            sub,
            message: 'Your PCRA expires tomorrow. Work must pause if the assessment is not renewed before expiration.',
            actions: '1. Contact PCRA team today to initiate renewal<br/>2. Ensure all active work is aware of the expiration'
          })
        )
        results.push({ doc_id: sub.doc_id, stage: '24_hours_before', sent })
      }

      // Day of expiration
      if (exp === todayStr) {
        const sent = await sendEmail([...to, COORDINATOR_EMAIL],
          `🔴 PCRA ${sub.doc_id} EXPIRES TODAY — Work Must Pause`,
          emailHtml({
            title: '🔴 PCRA Expires Today',
            color: '#ba0c2f',
            sub,
            message: 'Your PCRA expires today. All construction work must pause until the assessment is renewed.',
            actions: '1. Pause all active construction work<br/>2. Contact PCRA team immediately<br/>3. Do not resume work until renewal is confirmed'
          })
        )
        results.push({ doc_id: sub.doc_id, stage: 'day_of', sent })
      }

      // 24 hours after (overdue)
      if (exp === yesterdayStr) {
        const sent = await sendEmail([...to, COORDINATOR_EMAIL],
          `🚨 URGENT — PCRA ${sub.doc_id} OVERDUE — Immediate Action Required`,
          emailHtml({
            title: '🚨 PCRA OVERDUE — Immediate Action Required',
            color: '#ba0c2f',
            sub,
            message: 'This PCRA expired yesterday and no renewal has been recorded. This is an urgent compliance issue.',
            actions: '1. Verify all work has been paused<br/>2. Contact PCRA coordinator immediately<br/>3. Submit renewal request today<br/>4. Document any work performed after expiration'
          })
        )
        results.push({ doc_id: sub.doc_id, stage: '24_hours_after', sent })
      }
    }

    return NextResponse.json({ date: todayStr, checked: subs?.length || 0, results })

  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}