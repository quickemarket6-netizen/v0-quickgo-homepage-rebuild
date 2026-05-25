import { EMAIL_CONFIG } from './resend'

// Base email template wrapper
export function baseTemplate(content: string, title: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
    .container { max-width: 600px; margin: 0 auto; background-color: #111111; }
    .header { background: linear-gradient(135deg, #84cc16 0%, #22c55e 100%); padding: 30px; text-align: center; }
    .header img { height: 40px; }
    .header h1 { color: #000; margin: 10px 0 0; font-size: 24px; }
    .content { padding: 30px; color: #e5e5e5; }
    .content h2 { color: #84cc16; margin-top: 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #84cc16 0%, #22c55e 100%); color: #000 !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .order-box { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #333; }
    .order-item:last-child { border-bottom: none; }
    .total { font-size: 20px; color: #84cc16; font-weight: bold; }
    .footer { background: #0a0a0a; padding: 30px; text-align: center; color: #666; font-size: 12px; }
    .footer a { color: #84cc16; text-decoration: none; }
    .social-links { margin: 20px 0; }
    .social-links a { margin: 0 10px; color: #84cc16; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; color: #92400e; border-radius: 0 8px 8px 0; }
    .success-box { background: #d1fae5; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; color: #065f46; border-radius: 0 8px 8px 0; }
    .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; color: #991b1b; border-radius: 0 8px 8px 0; }
    .info-box { background: #1a1a1a; border: 1px solid #84cc16; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .tracking-status { display: flex; align-items: center; margin: 10px 0; }
    .tracking-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 15px; }
    .tracking-dot.active { background: #84cc16; }
    .tracking-dot.pending { background: #666; }
    .dl-signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center; }
    .dl-signature a { color: #84cc16; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>QuickGo</h1>
      <p style="color: #000; margin: 5px 0 0; font-size: 14px;">Livraison rapide au Cameroun</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p><strong>QuickGo</strong> - Votre partenaire de livraison</p>
      <p>${EMAIL_CONFIG.company.address}</p>
      <p>Tel: ${EMAIL_CONFIG.company.phone}</p>
      <div class="social-links">
        <a href="https://wa.me/237694341586">WhatsApp</a> |
        <a href="${EMAIL_CONFIG.company.website}">Site Web</a>
      </div>
      <div class="dl-signature">
        <p style="color: #666; font-size: 10px;">Propulse par</p>
        <a href="${EMAIL_CONFIG.dlSolutions.website}" style="font-size: 12px;">DL Solutions SARL</a>
        <p style="color: #555; font-size: 10px;">Solutions digitales innovantes pour l'Afrique</p>
      </div>
      <p style="margin-top: 20px; font-size: 10px; color: #444;">
        Cet email a ete envoye automatiquement. Si vous n'avez pas effectue cette action, 
        veuillez nous contacter immediatement.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Order Confirmation Email
export function orderConfirmationTemplate({
  customerName,
  orderId,
  items,
  subtotal,
  deliveryFee,
  total,
  deliveryAddress,
  estimatedDelivery,
  paymentMethod
}: {
  customerName: string
  orderId: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  deliveryFee: number
  total: number
  deliveryAddress: string
  estimatedDelivery: string
  paymentMethod: string
}) {
  const itemsHtml = items.map(item => `
    <div class="order-item">
      <span>${item.name} x${item.quantity}</span>
      <span>${item.price.toLocaleString()} FCFA</span>
    </div>
  `).join('')

  const content = `
    <h2>Merci pour votre commande!</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>Nous avons bien recu votre commande et elle est en cours de traitement.</p>
    
    <div class="success-box">
      <strong>Commande confirmee!</strong><br>
      Numero de commande: <strong>#${orderId}</strong>
    </div>

    <div class="order-box">
      <h3 style="margin-top: 0; color: #84cc16;">Resume de la commande</h3>
      ${itemsHtml}
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
        <div class="order-item">
          <span>Sous-total</span>
          <span>${subtotal.toLocaleString()} FCFA</span>
        </div>
        <div class="order-item">
          <span>Frais de livraison</span>
          <span>${deliveryFee.toLocaleString()} FCFA</span>
        </div>
        <div class="order-item">
          <span class="total">Total</span>
          <span class="total">${total.toLocaleString()} FCFA</span>
        </div>
      </div>
    </div>

    <div class="info-box">
      <p style="margin: 0;"><strong>Adresse de livraison:</strong><br>${deliveryAddress}</p>
      <p style="margin: 10px 0 0;"><strong>Livraison estimee:</strong> ${estimatedDelivery}</p>
      <p style="margin: 10px 0 0;"><strong>Mode de paiement:</strong> ${paymentMethod}</p>
    </div>

    <p style="text-align: center;">
      <a href="${EMAIL_CONFIG.company.website}/orders/${orderId}" class="button">
        Suivre ma commande
      </a>
    </p>

    <p>Une question? Contactez-nous sur WhatsApp:</p>
    <p><a href="https://wa.me/237690773615" style="color: #84cc16;">+237 690 773 615</a></p>
  `

  return baseTemplate(content, 'Confirmation de commande - QuickGo')
}

// Payment Alert (Before Validation)
export function paymentAlertTemplate({
  customerName,
  orderId,
  total,
  paymentMethod,
  validationCode
}: {
  customerName: string
  orderId: string
  total: number
  paymentMethod: string
  validationCode: string
}) {
  const content = `
    <h2>Validation de paiement requise</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    
    <div class="alert-box">
      <strong>Action requise!</strong><br>
      Veuillez valider votre paiement pour finaliser votre commande.
    </div>

    <div class="order-box">
      <p><strong>Commande:</strong> #${orderId}</p>
      <p><strong>Montant:</strong> <span class="total">${total.toLocaleString()} FCFA</span></p>
      <p><strong>Mode de paiement:</strong> ${paymentMethod}</p>
    </div>

    <div class="info-box" style="text-align: center;">
      <p style="margin: 0; color: #84cc16;">Code de validation:</p>
      <p style="font-size: 32px; letter-spacing: 8px; margin: 10px 0; color: #fff; font-weight: bold;">${validationCode}</p>
      <p style="margin: 0; font-size: 12px; color: #666;">Ce code expire dans 15 minutes</p>
    </div>

    <p style="text-align: center;">
      <a href="${EMAIL_CONFIG.company.website}/checkout/validate?order=${orderId}" class="button">
        Valider mon paiement
      </a>
    </p>

    <p style="color: #ef4444; font-size: 12px;">
      <strong>Important:</strong> Ne partagez jamais ce code avec qui que ce soit. 
      QuickGo ne vous demandera jamais votre code par telephone ou message.
    </p>
  `

  return baseTemplate(content, 'Validation de paiement - QuickGo')
}

// Payment Confirmation
export function paymentConfirmationTemplate({
  customerName,
  orderId,
  amount,
  paymentMethod,
  transactionId,
  date
}: {
  customerName: string
  orderId: string
  amount: number
  paymentMethod: string
  transactionId: string
  date: string
}) {
  const content = `
    <h2>Paiement confirme!</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    
    <div class="success-box">
      <strong>Paiement recu avec succes!</strong><br>
      Votre commande #${orderId} est maintenant en cours de preparation.
    </div>

    <div class="order-box">
      <h3 style="margin-top: 0; color: #84cc16;">Details du paiement</h3>
      <div class="order-item">
        <span>Montant paye</span>
        <span class="total">${amount.toLocaleString()} FCFA</span>
      </div>
      <div class="order-item">
        <span>Mode de paiement</span>
        <span>${paymentMethod}</span>
      </div>
      <div class="order-item">
        <span>Transaction ID</span>
        <span style="font-family: monospace;">${transactionId}</span>
      </div>
      <div class="order-item">
        <span>Date</span>
        <span>${date}</span>
      </div>
    </div>

    <p>Un livreur sera bientot assigne a votre commande. Vous recevrez une notification des qu'il sera en route.</p>

    <p style="text-align: center;">
      <a href="${EMAIL_CONFIG.company.website}/orders/${orderId}" class="button">
        Voir ma commande
      </a>
    </p>
  `

  return baseTemplate(content, 'Paiement confirme - QuickGo')
}

// Delivery Status Update
export function deliveryStatusTemplate({
  customerName,
  orderId,
  status,
  driverName,
  driverPhone,
  estimatedArrival,
  currentLocation
}: {
  customerName: string
  orderId: string
  status: 'assigned' | 'picked_up' | 'on_the_way' | 'nearby' | 'delivered'
  driverName?: string
  driverPhone?: string
  estimatedArrival?: string
  currentLocation?: string
}) {
  const statusConfig = {
    assigned: { title: 'Livreur assigne', message: 'Un livreur a ete assigne a votre commande.', color: '#3b82f6' },
    picked_up: { title: 'Commande recuperee', message: 'Le livreur a recupere votre commande.', color: '#8b5cf6' },
    on_the_way: { title: 'En route', message: 'Votre commande est en cours de livraison.', color: '#f59e0b' },
    nearby: { title: 'Bientot la!', message: 'Le livreur est a proximite de votre adresse.', color: '#84cc16' },
    delivered: { title: 'Livree!', message: 'Votre commande a ete livree avec succes.', color: '#22c55e' }
  }

  const config = statusConfig[status]

  const content = `
    <h2>${config.title}</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>${config.message}</p>

    <div class="order-box">
      <p><strong>Commande:</strong> #${orderId}</p>
      ${driverName ? `<p><strong>Livreur:</strong> ${driverName}</p>` : ''}
      ${driverPhone ? `<p><strong>Contact:</strong> <a href="tel:${driverPhone}" style="color: #84cc16;">${driverPhone}</a></p>` : ''}
      ${estimatedArrival ? `<p><strong>Arrivee estimee:</strong> ${estimatedArrival}</p>` : ''}
      ${currentLocation ? `<p><strong>Position actuelle:</strong> ${currentLocation}</p>` : ''}
    </div>

    <div style="margin: 20px 0;">
      <div class="tracking-status">
        <div class="tracking-dot ${['assigned', 'picked_up', 'on_the_way', 'nearby', 'delivered'].includes(status) ? 'active' : 'pending'}"></div>
        <span>Livreur assigne</span>
      </div>
      <div class="tracking-status">
        <div class="tracking-dot ${['picked_up', 'on_the_way', 'nearby', 'delivered'].includes(status) ? 'active' : 'pending'}"></div>
        <span>Commande recuperee</span>
      </div>
      <div class="tracking-status">
        <div class="tracking-dot ${['on_the_way', 'nearby', 'delivered'].includes(status) ? 'active' : 'pending'}"></div>
        <span>En route</span>
      </div>
      <div class="tracking-status">
        <div class="tracking-dot ${['nearby', 'delivered'].includes(status) ? 'active' : 'pending'}"></div>
        <span>A proximite</span>
      </div>
      <div class="tracking-status">
        <div class="tracking-dot ${status === 'delivered' ? 'active' : 'pending'}"></div>
        <span>Livree</span>
      </div>
    </div>

    <p style="text-align: center;">
      <a href="${EMAIL_CONFIG.company.website}/orders/${orderId}/track" class="button">
        Suivre en temps reel
      </a>
    </p>
  `

  return baseTemplate(content, `${config.title} - QuickGo`)
}

// Support/Complaint Email
export function supportTicketTemplate({
  ticketId,
  customerName,
  customerEmail,
  subject,
  message,
  orderId,
  category
}: {
  ticketId: string
  customerName: string
  customerEmail: string
  subject: string
  message: string
  orderId?: string
  category: 'complaint' | 'question' | 'refund' | 'technical' | 'other'
}) {
  const categoryLabels = {
    complaint: 'Plainte',
    question: 'Question',
    refund: 'Remboursement',
    technical: 'Probleme technique',
    other: 'Autre'
  }

  const content = `
    <h2>Demande d'assistance recue</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>Nous avons bien recu votre demande d'assistance et notre equipe la traitera dans les plus brefs delais.</p>
    
    <div class="info-box">
      <p style="margin: 0;"><strong>Numero de ticket:</strong> #${ticketId}</p>
      <p style="margin: 10px 0 0;"><strong>Categorie:</strong> ${categoryLabels[category]}</p>
      ${orderId ? `<p style="margin: 10px 0 0;"><strong>Commande concernee:</strong> #${orderId}</p>` : ''}
    </div>

    <div class="order-box">
      <p style="margin: 0;"><strong>Sujet:</strong> ${subject}</p>
      <p style="margin: 15px 0 0;"><strong>Votre message:</strong></p>
      <p style="background: #0a0a0a; padding: 15px; border-radius: 8px; margin-top: 10px;">${message}</p>
    </div>

    <p>Notre equipe vous repondra sous 24-48h. Pour une assistance immediate, contactez-nous sur WhatsApp:</p>
    
    <div style="text-align: center; margin: 20px 0;">
      <a href="https://wa.me/237694341586" class="button" style="margin-right: 10px;">
        WhatsApp CMR
      </a>
      <a href="https://wa.me/41779768768" class="button" style="background: #3b82f6;">
        WhatsApp CH
      </a>
    </div>

    <p style="font-size: 12px; color: #666;">
      Repondez directement a cet email pour ajouter des informations a votre ticket.
    </p>
  `

  return baseTemplate(content, `Ticket #${ticketId} - QuickGo Support`)
}

// Email Verification
export function emailVerificationTemplate({
  customerName,
  verificationCode,
  verificationLink
}: {
  customerName: string
  verificationCode: string
  verificationLink: string
}) {
  const content = `
    <h2>Verifiez votre adresse email</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>Bienvenue sur QuickGo! Pour completer votre inscription, veuillez verifier votre adresse email.</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="margin: 0; color: #84cc16;">Votre code de verification:</p>
      <p style="font-size: 36px; letter-spacing: 10px; margin: 15px 0; color: #fff; font-weight: bold;">${verificationCode}</p>
      <p style="margin: 0; font-size: 12px; color: #666;">Ce code expire dans 24 heures</p>
    </div>

    <p style="text-align: center;">Ou cliquez sur le bouton ci-dessous:</p>

    <p style="text-align: center;">
      <a href="${verificationLink}" class="button">
        Verifier mon email
      </a>
    </p>

    <p style="font-size: 12px; color: #666;">
      Si vous n'avez pas cree de compte sur QuickGo, ignorez cet email.
    </p>
  `

  return baseTemplate(content, 'Verification email - QuickGo')
}

// Welcome Email
export function welcomeEmailTemplate({
  customerName,
  promoCode
}: {
  customerName: string
  promoCode?: string
}) {
  const content = `
    <h2>Bienvenue sur QuickGo!</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>Felicitations! Votre compte QuickGo a ete cree avec succes. Vous pouvez maintenant profiter de tous nos services de livraison.</p>
    
    ${promoCode ? `
    <div class="success-box" style="text-align: center;">
      <p style="margin: 0;"><strong>Cadeau de bienvenue!</strong></p>
      <p style="font-size: 24px; margin: 10px 0; font-weight: bold;">Code promo: ${promoCode}</p>
      <p style="margin: 0; font-size: 12px;">10% de reduction sur votre premiere commande</p>
    </div>
    ` : ''}

    <div class="order-box">
      <h3 style="margin-top: 0; color: #84cc16;">Ce que vous pouvez faire:</h3>
      <ul style="padding-left: 20px;">
        <li>Commander vos produits preferes</li>
        <li>Suivre vos livraisons en temps reel</li>
        <li>Gerer votre portefeuille QuickGo</li>
        <li>Accumuler des points de fidelite</li>
        <li>Profiter d'offres exclusives</li>
      </ul>
    </div>

    <p style="text-align: center;">
      <a href="${EMAIL_CONFIG.company.website}/marketplace" class="button">
        Decouvrir QuickGo
      </a>
    </p>

    <p>Besoin d'aide? Notre assistant IA est disponible 24/7:</p>
    <p style="text-align: center;">
      <a href="${EMAIL_CONFIG.company.website}/assistant" style="color: #84cc16;">Parler a l'assistant</a>
    </p>
  `

  return baseTemplate(content, 'Bienvenue sur QuickGo!')
}

// Password Reset Email
export function passwordResetTemplate({
  customerName,
  resetCode,
  resetLink
}: {
  customerName: string
  resetCode: string
  resetLink: string
}) {
  const content = `
    <h2>Reinitialisation du mot de passe</h2>
    <p>Bonjour <strong>${customerName}</strong>,</p>
    <p>Vous avez demande la reinitialisation de votre mot de passe QuickGo.</p>
    
    <div class="info-box" style="text-align: center;">
      <p style="margin: 0; color: #84cc16;">Votre code de reinitialisation:</p>
      <p style="font-size: 36px; letter-spacing: 10px; margin: 15px 0; color: #fff; font-weight: bold;">${resetCode}</p>
      <p style="margin: 0; font-size: 12px; color: #666;">Ce code expire dans 1 heure</p>
    </div>

    <p style="text-align: center;">Ou cliquez sur le bouton ci-dessous:</p>

    <p style="text-align: center;">
      <a href="${resetLink}" class="button">
        Reinitialiser mon mot de passe
      </a>
    </p>

    <div class="alert-box">
      <strong>Important:</strong> Si vous n'avez pas demande cette reinitialisation, 
      ignorez cet email et assurez-vous que votre compte est securise.
    </div>
  `

  return baseTemplate(content, 'Reinitialisation mot de passe - QuickGo')
}
