 import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Get all active submissions
  const { data: active, error } = await supabase
    .from('submissions')
    .select('doc_id, project_name, project_name, project_manager, requester_email, start_date, expiration_date')
    .in('status', ['approved', 'in_progress', 'active'])

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!active || active.length === 0) {
    return Response.json({ message: 'No active submissions', date: today })
  }

  // Get all checklists submitted today
  const { data: submitted } = await supabase
    .from('daily_checklists')
    .select('doc_id')
    .eq('completed_date', today)

  const submittedDocIds = new Set((submitted || []).map(c => c.doc_id))

  // Find active submissions missing today's checklist
  const missing = active.filter(s => {
    // Only flag if today is within their construction window
    if (s.start_date && new Date(today) < new Date(s.start_date)) return false
    if (s.expiration_date && new Date(today) > new Date(s.expiration_date)) return false
    return !submittedDocIds.has(s.doc_id)
  })

  if (missing.length === 0) {
    return Response.json({ message: 'All checklists submitted', date: today, checked: active.length })
  }

  // Send alert email for each missing checklist
  const results = []
  for (const sub of missing) {
    const pmEmail = sub.requester_email
    if (!pmEmail) continue

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'UNMH PCRA System <onboarding@resend.dev>',
      to: [pmEmail],
      subject: `⚠️ MISSED Daily Checklist — ${sub.doc_id} — ${sub.project_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ba0c2f; color: white; padding: 20px 24px;">
            <div style="font-size: 20px; font-weight: 900;">UNMH PCRA System</div>
            <div style="font-size: 13px; opacity: 0.85; margin-top: 4px;">Daily Checklist Alert</div>
          </div>

          <div style="background: #fff3cd; border-left: 5px solid #ff6b00; padding: 16px 24px; margin: 0;">
            <div style="font-size: 16px; font-weight: 800; color: #856404;">⚠️ MISSED DAILY CHECKLIST</div>
            <div style="font-size: 13px; color: #856404; margin-top: 4px;">
              No daily site checklist was submitted today for this active project.
            </div>
          </div>

          <div style="padding: 24px; background: #f9fafb;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 40%;">Document ID</td>
                <td style="padding: 8px 0; font-weight: 700; color: #111;">${sub.doc_id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Project Name</td>
                <td style="padding: 8px 0; font-weight: 700; color: #111;">${sub.project_name || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Project ID</td>
                <td style="padding: 8px 0; color: #111;">${sub.project_name || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Date Missed</td>
                <td style="padding: 8px 0; color: #111;">${new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
            </table>

            <div style="margin-top: 24px; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb;">
              <div style="font-size: 13px; font-weight: 700; color: #111; margin-bottom: 8px;">ACTION REQUIRED</div>
              <div style="font-size: 13px; color: #374151;">
                Please ensure the daily site checklist is completed as soon as possible.
                Consistent checklist completion is required for ICRA compliance.
              </div>
            </div>

            <div style="margin-top: 16px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/assess/${sub.doc_id}"
                style="display: inline-block; background: #ba0c2f; color: white; padding: 12px 28px;
                       border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">
                Submit Checklist Now →
              </a>
            </div>
          </div>

          <div style="padding: 16px 24px; background: #f3f4f6; font-size: 11px; color: #9ca3af; text-align: center;">
            UNMH Pre-Construction Risk Assessment System • Automated Alert
          </div>
        </div>
      `
    })

    results.push({
      doc_id: sub.doc_id,
      pm_email: pmEmail,
      success: !emailError,
      error: emailError?.message
    })
  }

  return Response.json({
    date: today,
    active_count: active.length,
    missing_count: missing.length,
    emails_sent: results
  })
}
