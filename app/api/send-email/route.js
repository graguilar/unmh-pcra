import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'UNMH PCRA <onboarding@resend.dev>'
const COORDINATOR_EMAIL = 'graguilar@salud.unm.edu'

export async function POST(req) {
  try {
    const body = await req.json()
    const { type } = body

    // New submission alert to coordinator
    if (type === 'new_submission') {
      await resend.emails.send({
        from: FROM,
        to: COORDINATOR_EMAIL,
        subject: `New PCRA Submission — ${body.docId} · ${body.projectName}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#ba0c2f;color:#fff;padding:20px 24px;">
              <h2 style="margin:0;font-size:18px;">New PCRA Submission Received</h2>
            </div>
            <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:8px 0;font-weight:700;width:140px;">Document ID:</td><td style="color:#ba0c2f;font-weight:800;">${body.docId}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Project:</td><td>${body.projectName}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Building:</td><td>${body.building}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Requestor:</td><td>${body.requesterName} · ${body.requesterEmail}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Meeting:</td><td>${body.meetingDate} at ${body.meetingTime}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Project Manager:</td><td>${body.projectManager}</td></tr>
              </table>
              <div style="margin-top:20px;">
                <a href="https://unmh-pcra.vercel.app/dashboard" style="background:#ba0c2f;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Open Dashboard →</a>
              </div>
            </div>
          </div>
        `
      })
    }

    // Confirmation email to requestor after submission
    if (type === 'submission_confirmation') {
      await resend.emails.send({
        from: FROM,
        to: body.requesterEmail,
        subject: `PCRA Meeting Scheduled — ${body.docId}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#ba0c2f;color:#fff;padding:20px 24px;">
              <h2 style="margin:0;font-size:18px;">UNMH — Meeting Scheduled Successfully</h2>
            </div>
            <div style="padding:24px;">
              <p style="font-size:14px;color:#374151;">Your Pre-Construction Risk Assessment meeting has been scheduled. Please save your Document ID below.</p>
              <div style="background:#f9fafb;border:2px solid #ba0c2f;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
                <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:6px;">Your Document ID</div>
                <div style="font-size:32px;font-weight:900;color:#ba0c2f;">${body.docId}</div>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:8px 0;font-weight:700;width:140px;">Project:</td><td>${body.projectName}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Building:</td><td>${body.building}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Meeting:</td><td>${body.meetingDate} at ${body.meetingTime}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Project Manager:</td><td>${body.projectManager}</td></tr>
              </table>
              <div style="margin-top:20px;padding:14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;font-size:13px;">
                <strong>Next Steps:</strong><br/>
                1. Attend the MS Teams meeting with all parties<br/>
                2. After the meeting, complete the full PCRA assessment<br/>
                3. Use your Document ID to access your assessment at <a href="https://unmh-pcra.vercel.app/portal">your portal</a>
              </div>
            </div>
          </div>
        `
      })
    }

    // Contact message alert to coordinator
    if (type === 'contact_coordinator') {
      await resend.emails.send({
        from: FROM,
        to: COORDINATOR_EMAIL,
        subject: `New Message from Requestor — ${body.docId}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#007a86;color:#fff;padding:20px 24px;">
              <h2 style="margin:0;font-size:18px;">New Message from Requestor</h2>
            </div>
            <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
                <tr><td style="padding:8px 0;font-weight:700;width:140px;">Doc ID:</td><td style="color:#ba0c2f;font-weight:800;">${body.docId}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">Project:</td><td>${body.projectName}</td></tr>
                <tr><td style="padding:8px 0;font-weight:700;">From:</td><td>${body.senderName} · ${body.senderEmail}</td></tr>
              </table>
              <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:14px;font-size:14px;color:#374151;">${body.message}</div>
              <div style="margin-top:20px;">
                <a href="https://unmh-pcra.vercel.app/dashboard" style="background:#007a86;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Reply on Dashboard →</a>
              </div>
            </div>
          </div>
        `
      })
    }

    // Coordinator reply to requestor
    if (type === 'coordinator_reply') {
      await resend.emails.send({
        from: FROM,
        to: body.requesterEmail,
        subject: `PCRA Team Reply — ${body.docId}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#007a86;color:#fff;padding:20px 24px;">
              <h2 style="margin:0;font-size:18px;">Reply from PCRA Team</h2>
            </div>
            <div style="padding:24px;">
              <p style="font-size:14px;color:#374151;">The PCRA coordinator has replied to your message regarding <strong>${body.docId} — ${body.projectName}</strong>.</p>
              <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;font-size:14px;color:#374151;margin:16px 0;">${body.reply}</div>
              <a href="https://unmh-pcra.vercel.app/portal" style="background:#007a86;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Go to My Portal →</a>
            </div>
          </div>
        `
      })
    }

    // Status change notification to requestor
    if (type === 'status_change') {
      await resend.emails.send({
        from: FROM,
        to: body.requesterEmail,
        subject: `PCRA Status Update — ${body.docId}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#ba0c2f;color:#fff;padding:20px 24px;">
              <h2 style="margin:0;font-size:18px;">PCRA Status Update</h2>
            </div>
            <div style="padding:24px;">
              <p style="font-size:14px;color:#374151;">The status of your PCRA submission <strong>${body.docId}</strong> has been updated.</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
                <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:6px;">New Status</div>
                <div style="font-size:24px;font-weight:900;color:#111;">${body.newStatus?.replace('_', ' ').toUpperCase()}</div>
              </div>
              <a href="https://unmh-pcra.vercel.app/portal" style="background:#ba0c2f;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">View in Portal →</a>
            </div>
          </div>
        `
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}