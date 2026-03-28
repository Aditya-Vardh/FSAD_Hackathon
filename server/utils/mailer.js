const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_HOST === 'smtp.gmail.com' ? 'gmail' : undefined,
  host: process.env.SMTP_HOST !== 'smtp.gmail.com' ? (process.env.SMTP_HOST || 'smtp.gmail.com') : undefined,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : undefined
  },
  // Force IPv4 to avoid ENETUNREACH on Railway/Cloud
  family: 4
})



/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
async function sendEmail({ to, subject, text, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Mailer: SMTP credentials (SMTP_USER/SMTP_PASS) are missing from environment variables. Email notifications will be skipped.')
    return
  }


  try {
    const info = await transporter.sendMail({
      from: `"Peer Review System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    })
    console.log('Email sent: %s', info.messageId)
    return info
  } catch (error) {
    console.error('Mailer Error:', error)
  }
}

module.exports = { sendEmail }
