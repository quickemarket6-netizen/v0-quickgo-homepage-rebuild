"use client"

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Bot, User, Sparkles, ChevronDown, Loader2, 
  MessageSquare, Zap, Brain, Settings, RefreshCw,
  Copy, Check, ThumbsUp, ThumbsDown, Volume2, VolumeX,
  Trash2, Download, Share2, Mic, MicOff, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { AI_MODELS, type AIModel, getDefaultModel } from '@/lib/ai/multi-assistant'
import { cn } from '@/lib/utils'

// Quick suggestions for users
const QUICK_SUGGESTIONS = [
  { icon: '📦', text: 'Comment suivre ma commande?' },
  { icon: '🛵', text: 'Prix de livraison Yaounde-Douala' },
  { icon: '💳', text: 'Modes de paiement acceptes' },
  { icon: '🏪', text: 'Comment devenir vendeur?' },
  { icon: '🚨', text: 'Signaler un probleme' },
  { icon: '📱', text: 'Contacter le support' },
]

export default function AIAssistantPage() {
  const [selectedModel, setSelectedModel] = useState<AIModel>(getDefaultModel())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/ai-chat',
      body: { model: selectedModel.id }
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return
    sendMessage({ text: inputValue })
    setInputValue('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const clearChat = () => {
    setMessages([])
  }

  const getMessageText = (msg: typeof messages[0]): string => {
    if (!msg.parts || !Array.isArray(msg.parts)) return ''
    return msg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
              selectedModel.color
            )}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">QuickGo AI</h1>
              <p className="text-xs text-muted-foreground">Assistant intelligent</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span>{selectedModel.icon}</span>
                  <span className="hidden sm:inline">{selectedModel.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Choisir un modele IA</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* OpenAI Models */}
                <DropdownMenuLabel className="text-xs text-green-500">OpenAI</DropdownMenuLabel>
                {AI_MODELS.filter(m => m.provider === 'openai').map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      selectedModel.id === model.id && "bg-accent"
                    )}
                  >
                    <span>{model.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                    {selectedModel.id === model.id && <Check className="w-4 h-4 text-green-500" />}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
                {/* Anthropic Models */}
                <DropdownMenuLabel className="text-xs text-orange-500">Anthropic</DropdownMenuLabel>
                {AI_MODELS.filter(m => m.provider === 'anthropic').map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      selectedModel.id === model.id && "bg-accent"
                    )}
                  >
                    <span>{model.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                    {selectedModel.id === model.id && <Check className="w-4 h-4 text-orange-500" />}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
                {/* Google Models */}
                <DropdownMenuLabel className="text-xs text-blue-500">Google</DropdownMenuLabel>
                {AI_MODELS.filter(m => m.provider === 'google').map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      selectedModel.id === model.id && "bg-accent"
                    )}
                  >
                    <span>{model.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                    {selectedModel.id === model.id && <Check className="w-4 h-4 text-blue-500" />}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {/* Sakana Fugu Models */}
                <DropdownMenuLabel className="text-xs text-pink-500">Sakana Fugu</DropdownMenuLabel>
                {AI_MODELS.filter(m => m.provider === 'sakana').map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      selectedModel.id === model.id && "bg-accent"
                    )}
                  >
                    <span>{model.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                    {selectedModel.id === model.id && <Check className="w-4 h-4 text-pink-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Actions */}
            <Button variant="ghost" size="icon" onClick={clearChat} title="Nouvelle conversation">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="max-w-4xl mx-auto px-4 pb-32">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="py-12 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8"
            >
              <div className={cn(
                "w-20 h-20 rounded-2xl bg-gradient-to-br mx-auto flex items-center justify-center mb-4",
                selectedModel.color
              )}>
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Bienvenue sur QuickGo AI</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Je suis votre assistant intelligent. Posez-moi vos questions sur QuickGo, 
                vos commandes, livraisons ou tout autre sujet!
              </p>
            </motion.div>

            {/* Model Info */}
            <div className="mb-8">
              <Badge variant="outline" className="gap-2">
                <span>{selectedModel.icon}</span>
                Propulse par {selectedModel.name}
              </Badge>
            </div>

            {/* Quick Suggestions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {QUICK_SUGGESTIONS.map((suggestion, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-accent/50 text-left transition-all group"
                >
                  <span className="text-2xl mb-2 block">{suggestion.icon}</span>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {suggestion.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          <div className="py-6 space-y-6">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isUser = message.role === 'user'
                const text = getMessageText(message)
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      "flex gap-3",
                      isUser ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      isUser 
                        ? "bg-primary text-primary-foreground" 
                        : `bg-gradient-to-br ${selectedModel.color}`
                    )}>
                      {isUser ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      isUser 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted rounded-tl-sm"
                    )}>
                      <p className="whitespace-pre-wrap text-sm">{text}</p>
                      
                      {/* Message Actions */}
                      {!isUser && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(text, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                  selectedModel.color
                )}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {selectedModel.name} reflechit...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-2 bg-card/95 backdrop-blur border-border/50">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Posez votre question..."
                disabled={isLoading}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className={cn(
                  "rounded-xl h-10 w-10 bg-gradient-to-br",
                  selectedModel.color
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
          
          <p className="text-center text-xs text-muted-foreground mt-2">
            Propulse par {selectedModel.name} • QuickGo AI peut faire des erreurs
          </p>
        </div>
      </div>
    </div>
  )
}
