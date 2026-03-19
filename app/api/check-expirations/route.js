 import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'UNMH PCRA <onboarding@resend.dev>'
const COORDINATOR_EMAIL = 'griot7070@gmail.com'

export async function GET(req) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const results = { checked: 0, emails_sent: 0, errors: [] }

  try {
    // Get all assessments with expiration dates
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('*, submissions(project_name, building, requester_email, project_manager)')
      .not('pcra_expiration_date', 'is', null)
      .eq('status', 'complete')

    if (error) throw error
    results.checked = assessments?.length || 0

    for (const assessment of assessments || []) {
      const expDate = new Date(assessment.pcra_expiration_date)
      expDate.setHours(0, 0, 0, 0)
      const daysUntil = Math.round((expDate - today) / (1000 * 60 * 60 * 24))
      const project = assessment.project_name || assessment.submissions?.project_name || 'Unknown Project'
      const building = assessment.submissions?.building || ''
      const pmEmail = COORDINATOR_EMAIL // Will use actual PM email once domain verified

      let subject = null
      let urgency = null
      let message = null

      if (daysUntil === 7) {
        subject = `PCRA Expiring in 7 Days — ${assessment.doc_id}`
        urgency = 'info'
        message = `The Pre-Construction Risk Assessment for <strong>${project}</strong> expires in <strong>7 days</strong> on ${expDate.toLocaleDateString()}. Please review and renew if the project is ongoing.`
      } else if (daysUntil === 1) {
        subject = `PCRA Expires Tomorrow — ${assessment.doc_id}`
        urgency = 'warning'
        message = `The Pre-Construction Risk Assessment for <strong>${project}</strong> expires <strong>tomorrow</strong> on ${expDate.toLocaleDateString()}. Immediate action required.`
      } else if (daysUntil === 0) {
        subject = `PCRA Expires TODAY — ${assessment.doc_id}`
        urgency = 'warning'
        message = `The Pre-Construction Risk Assessment for <strong>${project}</strong> expires <strong>today</strong>. Work must pause until the PCRA is renewed or closed.`
      } else if (daysUntil === -1) {
        subject = `🚨 URGENT — PCRA Overdue: ${assessment.doc_id}`
        urgency = 'urgent'
        message = `The Pre-Construction Risk Assessment for <strong>${project}</strong> passed its expiration date yesterday. <strong>Immediate follow-up is required.</strong> Work must pause until renewed or closed.`
      } else if (daysUntil === -2) {
        subject = `🚨 ESCALATION — PCRA Still Overdue: ${assessment.doc_id}`
        urgency = 'escalation'
        message = `The Pre-Construction Risk Assessment for <strong>${project}</strong> has been overdue for <strong>2 days</strong>. This is an escalation notice. Coordinator and Department Head have been notified.`
      }

      if (subject && message) {
        const borderColor = urgency === 'urgent' || urgency === 'escalation' ? '#ba0c2f' : urgency === 'warning' ? '#d97706' : '#007a86'
        const headerBg = urgency === 'urgent' || urgency === 'escalation' ? '#ba0c2f' : urgency === 'warning' ? '#d97706' : '#007a86'

        await resend.emails.send({
          from: FROM,
          to: pmEmail,
          subject,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:${headerBg};color:#fff;padding:20px 24px;">
                <h2 style="margin:0;font-size:18px;">${subject}</h2>
              </div>
              <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">
                <p style="font-size:14px;color:#374151;">${message}</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
                  <tr><td style="padding:8px 0;font-weight:700;width:160px;">Doc ID:</td><td style="color:#ba0c2f;font-weight:800;">${assessment.doc_id}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:700;">Project:</td><td>${project}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:700;">Building:</td><td>${building}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:700;">Expiration Date:</td><td>${expDate.toLocaleDateString()}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:700;">Days Overdue:</td><td style="color:${borderColor};font-weight:800;">${daysUntil <= 0 ? Math.abs(daysUntil) + ' day(s) overdue' : daysUntil + ' day(s) remaining'}</td></tr>
                </table>
                <div style="display:flex;gap:12px;margin-top:20px;">
                  <a href="https://unmh-pcra.vercel.app/dashboard" style="background:#ba0c2f;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Open Dashboard →</a>
                  <a href="https://unmh-pcra.vercel.app/assess/${assessment.doc_id}" style="background:#007a86;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">View Assessment →</a>
                </div>
              </div>
            </div>
          `
        })
        results.emails_sent++
      }
    }

    // Also check for missed daily checklists
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: activeAssessments } = await supabase
      .from('assessments')
      .select('doc_id, project_name, submissions(project_manager, building)')
      .eq('status', 'complete')
      .not('pcra_expiration_date', 'is', null)
      .gte('pcra_expiration_date', today.toISOString().split('T')[0])

    for (const assessment of activeAssessments || []) {
      const { data: checklists } = await supabase
        .from('daily_checklists')
        .select('checklist_type')
        .eq('doc_id', assessment.doc_id)
        .eq('completed_date', yesterdayStr)

      const submittedTypes = new Set(checklists?.map(c => c.checklist_type) || [])
      const requiredTypes = ['infection_control', 'environmental_safety', 'pm_inspection']
      const missing = requiredTypes.filter(t => !submittedTypes.has(t))

      if (missing.length > 0) {
        const missingLabels = {
          infection_control: 'Infection Control Checklist',
          environmental_safety: 'Environmental Safety Check',
          pm_inspection: 'PM Site Inspection'
        }
        const project = assessment.project_name || 'Unknown Project'

        await resend.emails.send({
          from: FROM,
          to: pmEmail,
          subject: `⚠️ Action Required — Daily Checklist Not Completed: ${assessment.doc_id}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#ba0c2f;color:#fff;padding:20px 24px;">
                <h2 style="margin:0;font-size:18px;">⚠️ Daily Checklist Not Completed</h2>
              </div>
              <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">
                <p style="font-size:14px;color:#374151;">One or more required daily site checklists were not completed for <strong>${project}</strong> on ${yesterday.toLocaleDateString()}. Immediate follow-up is required.</p>
                <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:14px;margin:16px 0;">
                  <strong style="color:#ba0c2f;">Missed on ${yesterday.toLocaleDateString()}:</strong><br/>
                  ${missing.map(t => `✗ ${missingLabels[t]}`).join('<br/>')}
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:8px 0;font-weight:700;width:160px;">Doc ID:</td><td style="color:#ba0c2f;font-weight:800;">${assessment.doc_id}</td></tr>
                  <tr><td style="padding:8px 0;font-weight:700;">Project:</td><td>${project}</td></tr>
                </table>
                <a href="https://unmh-pcra.vercel.app/dashboard" style="display:inline-block;margin-top:20px;background:#ba0c2f;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">View Dashboard →</a>
              </div>
            </div>
          `
        })
        results.emails_sent++
      }
    }

  } catch (err) {
    results.errors.push(err.message)
  }

  return Response.json(results)
}