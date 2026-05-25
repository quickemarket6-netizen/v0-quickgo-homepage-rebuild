"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Search, Send, Truck, Store, Headphones, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const conversations = [
  {
    id: 1,
    name: "Apple Store Cameroun",
    type: "vendor",
    avatar: "🍎",
    lastMessage: "Votre commande est prête pour l'expédition",
    time: "Il y a 5 min",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Jean Paul - Livreur",
    type: "driver",
    avatar: "🛵",
    lastMessage: "Je suis en route, arrivée dans 10 min",
    time: "Il y a 12 min",
    unread: 1,
    online: true,
  },
  {
    id: 3,
    name: "Support QuickGo",
    type: "support",
    avatar: "💬",
    lastMessage: "Votre demande a été traitée avec succès",
    time: "Hier",
    unread: 0,
    online: true,
  },
  {
    id: 4,
    name: "Mode Africaine",
    type: "vendor",
    avatar: "👗",
    lastMessage: "Merci pour votre commande !",
    time: "Il y a 2 jours",
    unread: 0,
    online: false,
  },
]

const initialMessages = [
  { id: 1, from: "vendor", text: "Bonjour ! Comment puis-je vous aider ?", time: "10:00" },
  { id: 2, from: "user", text: "Bonjour, où en est ma commande #QG12345 ?", time: "10:02" },
  { id: 3, from: "vendor", text: "Votre commande est en cours de préparation. Elle sera expédiée dans 30 minutes.", time: "10:05" },
  { id: 4, from: "vendor", text: "Votre commande est prête pour l'expédition", time: "10:30" },
]

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState(conversations[0])
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [search, setSearch] = useState("")

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, from: "user", text: newMessage, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
    ])
    setNewMessage("")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex overflow-hidden pt-16 max-h-screen">
        {/* Conversations Sidebar */}
        <div className="w-full sm:w-80 border-r border-border/30 flex flex-col">
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-bold text-white">Messages</h1>
              <span className="ml-auto bg-quickgo-blue text-white text-xs px-2 py-0.5 rounded-full">3</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10 h-10 bg-card/50 border-border/30" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv) => (
              <button key={conv.id} onClick={() => setSelectedConv(conv)}
                className={`w-full flex items-center gap-3 p-4 border-b border-border/20 text-left transition-colors ${
                  selectedConv.id === conv.id ? "bg-quickgo-blue/10" : "hover:bg-card/50"
                }`}>
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-2xl">{conv.avatar}</div>
                  {conv.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white font-medium text-sm truncate">{conv.name}</span>
                    <span className="text-muted-foreground text-xs shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-muted-foreground text-xs truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="bg-quickgo-blue text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden sm:flex flex-1 flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-card/20">
            <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-xl">{selectedConv.avatar}</div>
            <div>
              <p className="text-white font-medium">{selectedConv.name}</p>
              <p className="text-xs text-green-400">{selectedConv.online ? "En ligne" : "Hors ligne"}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  msg.from === "user"
                    ? "bg-quickgo-blue text-white rounded-br-sm"
                    : "bg-card border border-border/30 text-white rounded-bl-sm"
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.from === "user" ? "text-white/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-border/30 flex gap-3">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Écrivez un message..." className="flex-1 h-12 bg-card/50 border-border/30" />
            <Button type="submit" className="h-12 w-12 p-0 rounded-xl bg-quickgo-blue hover:bg-quickgo-blue/90">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
