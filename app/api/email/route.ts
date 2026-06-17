import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'
import {
  orderConfirmationTemplate,
  paymentAlertTemplate,
  paymentConfirmationTemplate,
  deliveryStatusTemplate,
  supportTicketTemplate,
  emailVerificationTemplate,
  welcomeEmailTemplate,
  passwordResetTemplate
} from '@/lib/email/templates'
import { createClient } from '@/lib/supabase/server'
import { randomInt } from 'crypto'
import { checkRateLimit } from '@/lib/payments/security'

// Cryptographically secure code — Math.random() is not suitable for security codes
function generateCode(length: number = 6): string {
  return randomInt(0, 10 ** length).toString().padStart(length, '0')
}

// Generate ticket ID
function generateTicketId(): string {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${generateCode(4)}`
}

// Types callable before auth (forgot-password flow). Everything else requires a session.
const PRE_AUTH_TYPES = new Set(['password_reset', 'email_verification'])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (PRE_AUTH_TYPES.has(type)) {
      // Rate-limit unauthenticated sensitive flows to prevent spam/brute-force
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip') ?? 'unknown'
      const rl = checkRateLimit(`email:${type}:${ip}`, { maxRequests: 3, windowMs: 15 * 60 * 1000 })
      if (!rl.allowed) {
        return NextResponse.json({ error: 'Trop de tentatives, réessayez dans 15 minutes' }, { status: 429 })
      }
    } else {
      // All other email types require an authenticated session
      if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      }
    }

    let result
    let subject: string
    let html: string
    let to: string

    switch (type) {
      case 'order_confirmation': {
        const { email, customerName, orderId, items, subtotal, deliveryFee, total, deliveryAddress, estimatedDelivery, paymentMethod } = data
        to = email
        subject = `Commande #${orderId} confirmee - QuickGo`
        html = orderConfirmationTemplate({
          customerName,
          orderId,
          items,
          subtotal,
          deliveryFee,
          total,
          deliveryAddress,
          estimatedDelivery,
          paymentMethod
        })
        break
      }

      case 'payment_alert': {
        const { email, customerName, orderId, total, paymentMethod } = data
        const validationCode = generateCode(6)
        to = email
        subject = `Action requise: Validez votre paiement - QuickGo`
        html = paymentAlertTemplate({
          customerName,
          orderId,
          total,
          paymentMethod,
          validationCode
        })
        // Store validation code in database for verification
        const supabase = await createClient()
        await supabase.from('payment_validations').upsert({
          order_id: orderId,
          code: validationCode,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
        break
      }

      case 'payment_confirmation': {
        const { email, customerName, orderId, amount, paymentMethod, transactionId } = data
        to = email
        subject = `Paiement confirme - Commande #${orderId} - QuickGo`
        html = paymentConfirmationTemplate({
          customerName,
          orderId,
          amount,
          paymentMethod,
          transactionId,
          date: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        })
        break
      }

      case 'delivery_status': {
        const { email, customerName, orderId, status, driverName, driverPhone, estimatedArrival, currentLocation } = data
        const statusTitles = {
          assigned: 'Livreur assigne',
          picked_up: 'Commande recuperee',
          on_the_way: 'En cours de livraison',
          nearby: 'Le livreur arrive bientot',
          delivered: 'Commande livree'
        }
        to = email
        subject = `${statusTitles[status as keyof typeof statusTitles] || 'Mise a jour'} - Commande #${orderId}`
        html = deliveryStatusTemplate({
          customerName,
          orderId,
          status,
          driverName,
          driverPhone,
          estimatedArrival,
          currentLocation
        })
        break
      }

      case 'support_ticket': {
        const { email, customerName, subject: ticketSubject, message, orderId, category } = data
        const ticketId = generateTicketId()
        to = email
        subject = `Ticket #${ticketId} cree - QuickGo Support`
        html = supportTicketTemplate({
          ticketId,
          customerName,
          customerEmail: email,
          subject: ticketSubject,
          message,
          orderId,
          category
        })
        // Also send to support team
        await sendEmail({
          to: 'support@quickgo.cm',
          subject: `[${category.toUpperCase()}] Nouveau ticket #${ticketId} - ${ticketSubject}`,
          html: `
            <h2>Nouveau ticket de support</h2>
            <p><strong>Ticket:</strong> #${ticketId}</p>
            <p><strong>Client:</strong> ${customerName} (${email})</p>
            <p><strong>Categorie:</strong> ${category}</p>
            ${orderId ? `<p><strong>Commande:</strong> #${orderId}</p>` : ''}
            <p><strong>Sujet:</strong> ${ticketSubject}</p>
            <hr>
            <p>${message}</p>
          `
        })
        break
      }

      case 'email_verification': {
        const { email, customerName } = data
        const verificationCode = generateCode(6)
        const verificationLink = `https://quickgo.cm/auth/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`
        to = email
        subject = `Verifiez votre email - QuickGo`
        html = emailVerificationTemplate({
          customerName,
          verificationCode,
          verificationLink
        })
        // Store verification code
        const supabase = await createClient()
        await supabase.from('email_verifications').upsert({
          email,
          code: verificationCode,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        break
      }

      case 'welcome': {
        const { email, customerName, promoCode } = data
        to = email
        subject = `Bienvenue sur QuickGo, ${customerName}!`
        html = welcomeEmailTemplate({
          customerName,
          promoCode: promoCode || 'BIENVENUE10'
        })
        break
      }

      case 'password_reset': {
        const { email, customerName } = data
        const resetCode = generateCode(6)
        const resetLink = `https://quickgo.cm/auth/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`
        to = email
        subject = `Reinitialisation de mot de passe - QuickGo`
        html = passwordResetTemplate({
          customerName,
          resetCode,
          resetLink
        })
        // Store reset code
        const supabase = await createClient()
        await supabase.from('password_resets').upsert({
          email,
          code: resetCode,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        })
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    result = await sendEmail({ to, subject, html })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        id: result.id
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Email API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get email preview (for testing)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  const preview = searchParams.get('preview') === 'true'

  if (!preview) {
    return NextResponse.json({ error: 'Use preview=true for email previews' }, { status: 400 })
  }

  // Sample data for previews
  const sampleData = {
    order_confirmation: orderConfirmationTemplate({
      customerName: 'Jean Dupont',
      orderId: 'QG-12345',
      items: [
        { name: 'Pizza Margherita', quantity: 2, price: 5000 },
        { name: 'Coca-Cola 1L', quantity: 3, price: 1500 }
      ],
      subtotal: 14500,
      deliveryFee: 1000,
      total: 15500,
      deliveryAddress: 'Bastos, Yaounde - Face station Total',
      estimatedDelivery: '30-45 minutes',
      paymentMethod: 'Mobile Money (MTN)'
    }),
    payment_alert: paymentAlertTemplate({
      customerName: 'Jean Dupont',
      orderId: 'QG-12345',
      total: 15500,
      paymentMethod: 'Mobile Money',
      validationCode: '847293'
    }),
    payment_confirmation: paymentConfirmationTemplate({
      customerName: 'Jean Dupont',
      orderId: 'QG-12345',
      amount: 15500,
      paymentMethod: 'MTN Mobile Money',
      transactionId: 'TXN-7839284',
      date: new Date().toLocaleDateString('fr-FR')
    }),
    delivery_status: deliveryStatusTemplate({
      customerName: 'Jean Dupont',
      orderId: 'QG-12345',
      status: 'on_the_way',
      driverName: 'Paul Kamga',
      driverPhone: '+237 690 123 456',
      estimatedArrival: '15 minutes',
      currentLocation: 'Carrefour Nlongkak'
    }),
    support_ticket: supportTicketTemplate({
      ticketId: 'TKT-ABC123-4567',
      customerName: 'Jean Dupont',
      customerEmail: 'jean@example.com',
      subject: 'Probleme avec ma commande',
      message: 'Ma commande n\'est pas arrivee a temps et le livreur ne repond pas.',
      orderId: 'QG-12345',
      category: 'complaint'
    }),
    welcome: welcomeEmailTemplate({
      customerName: 'Jean Dupont',
      promoCode: 'BIENVENUE10'
    })
  }

  const html = sampleData[type as keyof typeof sampleData]

  if (!html) {
    return NextResponse.json({ 
      availableTypes: Object.keys(sampleData) 
    })
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
