"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function HeroPhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="absolute left-1/2 -translate-x-1/2 lg:left-[15%] lg:translate-x-0 top-[10%] z-20"
    >
      <div className="relative">
        {/* Phone Frame Glow */}
        <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 rounded-[3rem] blur-2xl opacity-60" />
        
        {/* Phone Device */}
        <div className="relative w-[220px] sm:w-[260px] lg:w-[280px] aspect-[9/19] rounded-[2.5rem] bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 shadow-2xl shadow-black/50">
          {/* Screen */}
          <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-background">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-10 flex items-center justify-between px-6">
              <span className="text-[10px] text-white font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 border border-white/80 rounded-sm">
                  <div className="w-3/4 h-full bg-secondary rounded-sm" />
                </div>
              </div>
            </div>
            
            {/* App Content */}
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0026-TirPRYobrhth8yBzOidOz2Yg88nJk6.jpg"
              alt="QuickGo App"
              fill
              className="object-cover object-top"
              priority
            />
            
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
          </div>
        </div>
        
        {/* Reflection */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-gradient-to-b from-white/5 to-transparent blur-xl rounded-full" />
      </div>
    </motion.div>
  )
}
