import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL    = os.getenv("FROM_EMAIL", SMTP_USER)


# ─────────────────────────────────────────────────────────────────────────────
# CORE SEND HELPER
# ─────────────────────────────────────────────────────────────────────────────
def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email via SMTP.
    Returns True on success, False on failure (so the caller can still proceed).
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  SMTP credentials not configured — email not sent")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = FROM_EMAIL
        msg["To"]      = to_email

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Email send failed to {to_email}: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# DOCTOR APPOINTMENT-REQUEST NOTIFICATION
# ─────────────────────────────────────────────────────────────────────────────
def send_doctor_request_email(
    doctor_email:   str,
    doctor_name:    str,
    user_name:      str,
    user_email:     str,
    report_id:      str | None = None,
    notification_id: str       = "",
) -> bool:
    """
    Sends a styled appointment-request notification to the doctor.
    """
    report_section = ""
    if report_id:
        report_section = f"""
        <tr>
          <td style="padding:8px 0; color:#555; font-size:14px;">
            <b>📋 Shared Report ID:</b><br/>
            <span style="font-family:monospace;background:#f5f5f5;padding:2px 6px;border-radius:4px;">{report_id}</span>
          </td>
        </tr>"""

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:30px 40px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">🩺 vAIdyam</h1>
                <p style="color:#bbdefb;margin:6px 0 0;font-size:14px;">AI-Powered Healthcare Platform</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 40px;">
                <h2 style="color:#1a73e8;margin:0 0 8px;">New Appointment Request</h2>
                <p style="color:#444;font-size:15px;margin:0 0 24px;">
                  Dear <b>Dr. {doctor_name}</b>,<br/><br/>
                  A patient has sent you a consultation request through vAIdyam.
                  Please find the details below:
                </p>

                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#f8fbff;border:1px solid #dce8fc;border-radius:8px;padding:20px;">
                  <tr>
                    <td style="padding:8px 0;color:#555;font-size:14px;">
                      <b>👤 Patient Name:</b> {user_name}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#555;font-size:14px;">
                      <b>📧 Patient Email:</b>
                      <a href="mailto:{user_email}" style="color:#1a73e8;">{user_email}</a>
                    </td>
                  </tr>
                  {report_section}
                  <tr>
                    <td style="padding:8px 0;color:#555;font-size:14px;">
                      <b>🔔 Notification ID:</b>
                      <span style="font-family:monospace;background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:12px;">{notification_id}</span>
                    </td>
                  </tr>
                </table>

                <p style="color:#666;font-size:13px;margin:24px 0 0;">
                  To respond to this patient, please reply directly to their email or log in to the vAIdyam dashboard.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0;">
                  This is an automated notification from vAIdyam.<br/>
                  Please do not reply directly to this email.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    subject = f"[vAIdyam] New Consultation Request from {user_name}"
    return send_email(doctor_email, subject, html_body)


# ─────────────────────────────────────────────────────────────────────────────
# CONFIRMATION EMAIL TO USER
# ─────────────────────────────────────────────────────────────────────────────
def send_user_request_confirmation(
    user_email:   str,
    user_name:    str,
    doctor_name:  str,
    doctor_email: str,
) -> bool:
    """Sends a confirmation to the user that their request was sent successfully."""

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

            <tr>
              <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:30px 40px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">🩺 vAIdyam</h1>
                <p style="color:#bbdefb;margin:6px 0 0;font-size:14px;">AI-Powered Healthcare Platform</p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 40px;">
                <h2 style="color:#1a73e8;margin:0 0 8px;">✅ Request Sent Successfully!</h2>
                <p style="color:#444;font-size:15px;margin:0 0 24px;">
                  Hi <b>{user_name}</b>,<br/><br/>
                  Your consultation request has been sent to <b>Dr. {doctor_name}</b>.
                  They will reach out to you at <a href="mailto:{user_email}" style="color:#1a73e8;">{user_email}</a>.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0"
                       style="background:#f8fbff;border:1px solid #dce8fc;border-radius:8px;padding:20px;">
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:14px;">
                      <b>🩺 Doctor:</b> Dr. {doctor_name}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#555;font-size:14px;">
                      <b>📧 Doctor's Email:</b>
                      <a href="mailto:{doctor_email}" style="color:#1a73e8;">{doctor_email}</a>
                    </td>
                  </tr>
                </table>
                <p style="color:#666;font-size:13px;margin:24px 0 0;">
                  The doctor has been notified and will contact you shortly.
                  You can also reach out directly using the email above.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                <p style="color:#999;font-size:12px;margin:0;">
                  This is an automated message from vAIdyam. Please do not reply.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    subject = f"[vAIdyam] Your request to Dr. {doctor_name} was sent"
    return send_email(user_email, subject, html_body)
