// QuickGo Multi-AI Assistant Service
// Supports: Sakana Fugu, OpenAI GPT, Anthropic Claude, Google Gemini

import { streamText, convertToModelMessages, UIMessage } from 'ai'

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'sakana'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  description: string
  icon: string
  color: string
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'sakana/fugu',
    name: 'Sakana Fugu',
    provider: 'sakana',
    description: 'Systeme multi-agents — equilibre vitesse/qualite',
    icon: '🐡',
    color: 'from-fuchsia-500 to-pink-500'
  },
  {
    id: 'sakana/fugu-ultra',
    name: 'Sakana Fugu Ultra',
    provider: 'sakana',
    description: 'Raisonnement complexe multi-etapes, qualite maximale',
    icon: '🐡',
    color: 'from-purple-600 to-fuchsia-600'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Le modele le plus avance d\'OpenAI',
    icon: '🟢',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Rapide et economique',
    icon: '🟢',
    color: 'from-green-400 to-emerald-400'
  },
  {
    id: 'anthropic/claude-sonnet-4-5-20250514',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Le dernier modele Anthropic',
    icon: '🟠',
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'anthropic/claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Rapide et precis',
    icon: '🟠',
    color: 'from-orange-400 to-amber-400'
  },
  {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'IA multimodale Google',
    icon: '🔵',
    color: 'from-blue-500 to-cyan-500'
  }
]

export const QUICKGO_SYSTEM_PROMPT = `Tu es l'assistant IA officiel de QuickGo, la plateforme de livraison et marketplace #1 au Cameroun.

CONTEXTE QUICKGO:
- QuickGo est une plateforme de livraison rapide et marketplace
- Services: livraison de colis, courses, nourriture, shopping
- Zones: Yaounde, Douala, et autres villes du Cameroun
- Modes de livraison: Moto (rapide) et Voiture (confort)

TES CAPACITES:
- Aider les clients a passer des commandes
- Expliquer les services QuickGo
- Resoudre les problemes de livraison
- Donner des conseils aux vendeurs
- Aider avec les paiements (Mobile Money, carte)
- Suivi des commandes
- Assistance technique

CONTACTS SUPPORT:
- WhatsApp Cameroun: +237 694 341 586 ou +237 690 773 615
- WhatsApp Suisse: +41 77 976 87 68
- Site DL Solutions: www.dlsolutionssarl.tech

REGLES:
- Reponds toujours en francais sauf si on te parle en anglais
- Sois amical, professionnel et efficace
- Si tu ne connais pas la reponse, oriente vers le support
- Utilise des emojis avec moderation
- Donne des reponses concises mais completes

PRIX LIVRAISON (approximatifs):
- Moto: 500-2000 FCFA selon distance
- Voiture: 1000-5000 FCFA selon distance
- Frais de service: 200 FCFA

Tu es pret a aider les utilisateurs de QuickGo!`

export function getModelById(modelId: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === modelId)
}

export function getDefaultModel(): AIModel {
  return AI_MODELS[0] // GPT-4o by default
}
