"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Search, Send, Truck, Store, Headphones, ChevronRight, Bell } from "lucide-react"
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

          {/* Thread list — staggered entrance + whileHover slide */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv, i) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 120, damping: 18 }}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedConv(conv)}
                className={`w-full flex items-center gap-3 p-4 border-b border-border/20 text-left transition-colors ${
                  selectedConv.id === conv.id ? "bg-quickgo-blue/10" : "hover:bg-card/50"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-2xl">{conv.avatar}</div>
                  {conv.online && (
                    /* Ping live dot for online status */
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400 border-2 border-background" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white font-medium text-sm truncate">{conv.name}</span>
                    <span className="text-muted-foreground text-xs shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-muted-foreground text-xs truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  /* Unread badge springs in */
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14, delay: i * 0.05 + 0.1 }}
                    className="bg-quickgo-blue text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  >
                    {conv.unread}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Support link at bottom — whileHover slide right */}
          <div className="p-4 border-t border-border/30">
            <Link href="/support">
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-quickgo-blue/10 border border-quickgo-blue/20 hover:bg-quickgo-blue/15 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-quickgo-blue/20 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4 text-quickgo-blue" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Contacter le support</p>
                  <p className="text-muted-foreground text-[10px]">Disponible 24h/24</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden sm:flex flex-1 flex-col">
          {/* Empty state — no thread selected */}
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-4"
                >
                  <Bell className="w-16 h-16 text-white/10 mx-auto" />
                </motion.div>
                <p className="text-white/40 font-semibold">Sélectionnez une conversation</p>
                <p className="text-white/20 text-sm mt-1">Vos messages apparaissent ici</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-card/20">
                <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-xl">{selectedConv.avatar}</div>
                <div>
                  <p className="text-white font-medium">{selectedConv.name}</p>
                  <p className="text-xs text-green-400">{selectedConv.online ? "En ligne" : "Hors ligne"}</p>
                </div>
              </div>

              {/* Messages — spring entrance per bubble */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                    >
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
                </AnimatePresence>
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-border/30 flex gap-3">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Écrivez un message..." className="flex-1 h-12 bg-card/50 border-border/30" />
                <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Button type="submit" className="h-12 w-12 p-0 rounded-xl bg-quickgo-blue hover:bg-quickgo-blue/90">
                    <Send className="w-5 h-5" />
                  </Button>
                </motion.div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
