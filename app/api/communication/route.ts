import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  communicationManager, 
  smsTemplates, 
  whatsappTemplates,
  type CommunicationChannel,
  type MessageType 
} from '@/lib/communication/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      action,
      channels,
      messageType,
      title,
      content,
      recipients,
      templateData,
      phone,
      email,
      scheduledAt
    } = body

    switch (action) {
      case 'send_notification': {
        // Send multi-channel notification
        const message = {
          id: `msg_${Date.now()}`,
          type: messageType as MessageType,
          title,
          body: content,
          channels: channels as CommunicationChannel[],
          recipients: recipients || { type: 'individual' as const },
          priority: 'normal' as const,
          createdAt: new Date(),
          status: 'sending' as const
        }

        // Get recipient contacts based on selection
        let contacts: { phone?: string; email?: string }[] = []

        if (recipients?.userIds?.length) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('phone, email')
            .in('id', recipients.userIds)

          contacts = profiles || []
        } else if (recipients?.segment) {
          // Get users by segment
          let query = supabase.from('profiles').select('phone, email')
          
          if (recipients.segment !== 'all') {
            query = query.eq('role', recipients.segment)
          }
          
          const { data: profiles } = await query.limit(1000)
          contacts = profiles || []
        } else if (phone || email) {
          contacts = [{ phone, email }]
        }

        const results = await communicationManager.sendMessage(message, contacts)

        // Log communication
        await supabase.from('communication_logs').insert({
          user_id: user.id,
          type: messageType,
          channel: (channels as string[]).join(','),
          subject: title,
          content,
          recipient: `${contacts.length} destinataires`,
          results_json: results,
          status: 'sent',
        })

        return NextResponse.json({
          success: true,
          message: 'Messages envoyes',
          results,
          recipientsCount: contacts.length
        })
      }

      case 'send_sms': {
        const { template, customMessage } = body
        let smsContent = customMessage

        if (template && smsTemplates[template as keyof typeof smsTemplates]) {
          smsContent = smsTemplates[template as keyof typeof smsTemplates](templateData)
        }

        // In production, call SMS API
        return NextResponse.json({
          success: true,
          message: 'SMS envoye',
          to: phone,
          content: smsContent
        })
      }

      case 'send_whatsapp': {
        const { template, customMessage } = body
        
        if (template && whatsappTemplates[template as keyof typeof whatsappTemplates]) {
          const templateInfo = whatsappTemplates[template as keyof typeof whatsappTemplates](templateData)
          // Send template message
          return NextResponse.json({
            success: true,
            message: 'WhatsApp template envoye',
            to: phone,
            template: templateInfo
          })
        }

        // Generate WhatsApp link for manual sending
        const whatsappLink = communicationManager.getWhatsAppLink(phone, customMessage || content)
        
        return NextResponse.json({
          success: true,
          message: 'Lien WhatsApp genere',
          whatsappLink,
          to: phone
        })
      }

      case 'send_push': {
        // Store push notification for delivery
        await supabase.from('push_notifications').insert({
          user_id: recipients?.userIds?.[0] || null,
          title,
          body: content,
          data: templateData,
          sent_at: new Date().toISOString(),
          read: false
        })

        return NextResponse.json({
          success: true,
          message: 'Push notification envoyee'
        })
      }

      case 'schedule_broadcast': {
        // Schedule a broadcast message
        const { data: broadcast } = await supabase.from('broadcasts').insert({
          title,
          content,
          channels,
          segment: recipients?.segment || 'all',
          scheduled_at: scheduledAt,
          status: scheduledAt ? 'scheduled' : 'draft',
          created_by: user.id
        }).select().single()

        return NextResponse.json({
          success: true,
          message: scheduledAt ? 'Diffusion programmee' : 'Brouillon sauvegarde',
          broadcast
        })
      }

      case 'get_whatsapp_link': {
        const link = communicationManager.getWhatsAppLink(phone, content)
        return NextResponse.json({ success: true, link })
      }

      case 'get_call_link': {
        const link = communicationManager.getCallLink(phone)
        return NextResponse.json({ success: true, link })
      }

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

  } catch (error) {
    console.error('[Communication API] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET: Fetch communication history and stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'history'

    switch (action) {
      case 'history': {
        const { data: logs } = await supabase
          .from('communication_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        return NextResponse.json({ success: true, logs: logs || [] })
      }

      case 'stats': {
        // Get communication stats
        const { data: logs } = await supabase
          .from('communication_logs')
          .select('channels, recipients_count, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const stats = {
          totalSent: logs?.length || 0,
          totalRecipients: logs?.reduce((sum, l) => sum + (l.recipients_count || 0), 0) || 0,
          byChannel: {} as Record<string, number>
        }

        logs?.forEach(log => {
          (log.channels as string[])?.forEach(channel => {
            stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1
          })
        })

        return NextResponse.json({ success: true, stats })
      }

      case 'broadcasts': {
        const { data: broadcasts } = await supabase
          .from('broadcasts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        return NextResponse.json({ success: true, broadcasts: broadcasts || [] })
      }

      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

  } catch (error) {
    console.error('[Communication API] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
