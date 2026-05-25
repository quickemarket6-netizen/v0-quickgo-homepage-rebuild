import { Resend } from 'resend'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY

export const resend = resendApiKey ? new Resend(resendApiKey) : null

// Email configuration
export const EMAIL_CONFIG = {
  from: 'QuickGo <noreply@quickgo.cm>',
  replyTo: 'support@quickgo.cm',
  company: {
    name: 'QuickGo',
    website: 'https://quickgo.cm',
    phone: '+237 690 773 615',
    whatsapp: '+237694341586',
    address: 'Yaounde, Cameroun'
  },
  dlSolutions: {
    name: 'DL Solutions SARL',
    website: 'https://www.dlsolutionssarl.tech',
    altWebsite: 'https://www.daveandlucesolutions.com',
    phones: ['+237 694 341 586', '+237 690 773 615', '+41 77 976 87 68']
  }
}

// Send email helper function
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}) {
  if (!resend) {
    console.warn('[Email] Resend API key not configured, skipping email send')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: replyTo || EMAIL_CONFIG.replyTo
    })

    if (error) {
      console.error('[Email] Error sending email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Email] Exception sending email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
