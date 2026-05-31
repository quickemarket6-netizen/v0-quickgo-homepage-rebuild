"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Package, 
  Truck, 
  Search,
  HelpCircle,
  MessageCircle,
  Loader2
} from "lucide-react"

const suggestedQuestions = [
  { icon: Search, text: "Rechercher des produits", prompt: "Montre-moi les produits populaires sur QuickGo" },
  { icon: Truck, text: "Prix de livraison", prompt: "Combien coute une livraison de Bastos a Mvog-Mbi en moto?" },
  { icon: Package, text: "Suivre commande", prompt: "Comment suivre ma commande?" },
  { icon: HelpCircle, text: "Aide & Support", prompt: "J'ai besoin d'aide pour un probleme" },
]

export default function AssistantPage() {
  const [input, setInput] = useState("")
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  const handleSuggestion = (prompt: string) => {
    sendMessage({ text: prompt })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
          {/* Header */}
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center mx-auto mb-4"
            >
              <Bot className="w-10 h-10 text-black" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              QuickGo Assistant
            </h1>
            <p className="text-muted-foreground">
              Je suis la pour vous aider avec vos livraisons et achats
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {suggestedQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestion(question.prompt)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-lime-500/50 hover:bg-lime-500/5 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-lime-500/10 flex items-center justify-center group-hover:bg-lime-500/20 transition-colors">
                        <question.icon className="w-5 h-5 text-lime-400" />
                      </div>
                      <span className="text-sm text-foreground">{question.text}</span>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-black" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-lime-500 text-black"
                          : "bg-card border border-border"
                      }`}
                    >
                      {message.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <p key={index} className="whitespace-pre-wrap">
                              {part.text}
                            </p>
                          )
                        }
                        if (part.type === "tool-invocation") {
                          return (
                            <div key={index} className="mt-2 p-3 rounded-lg bg-background/50 text-xs">
                              <div className="flex items-center gap-2 text-lime-400 mb-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Recherche en cours...</span>
                              </div>
                              {part.state === "output-available" && part.output != null && (
                                <pre className="text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(part.output as unknown, null, 2)}
                                </pre>
                              )}
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-black" />
                </div>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
                    <span className="text-muted-foreground">En train de reflechir...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="sticky bottom-4 bg-background pt-4">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-card border border-border focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none transition-all disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 rounded-xl bg-lime-500 hover:bg-lime-600 text-black p-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <a 
                href="https://wa.me/237690773615"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-lime-400 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                Support WhatsApp
              </a>
              <span>|</span>
              <span>QuickGo Assistant v1.0</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
