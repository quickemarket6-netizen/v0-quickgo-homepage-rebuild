"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function HeroDriverVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="absolute right-0 lg:right-[-5%] bottom-[5%] lg:bottom-[10%] z-10"
    >
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 rounded-full blur-3xl" />
        
        {/* Driver Image Container */}
        <div className="relative w-[200px] sm:w-[280px] lg:w-[350px] aspect-square">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0017-VfUk2GL8cI8XZwFiuVYUELEHdaQEQW.jpg"
            alt="QuickGo Delivery Driver"
            fill
            className="object-contain object-right-bottom"
            priority
          />
          
          {/* Speed Lines */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 h-1 bg-gradient-to-r from-primary to-transparent opacity-60 blur-sm" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 mt-4 w-16 h-0.5 bg-gradient-to-r from-accent to-transparent opacity-40 blur-sm" />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -mt-4 w-20 h-0.5 bg-gradient-to-r from-secondary to-transparent opacity-50 blur-sm" />
        </div>
      </div>
    </motion.div>
  )
}
