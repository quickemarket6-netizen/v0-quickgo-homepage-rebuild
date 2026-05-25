"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PremiumFeatureCardProps {
  image: string
  title: string
  description: string
  href: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function PremiumFeatureCard({
  image,
  title,
  description,
  href,
  className,
  size = "md"
}: PremiumFeatureCardProps) {
  const sizeClasses = {
    sm: "h-48 md:h-56",
    md: "h-56 md:h-64",
    lg: "h-64 md:h-80"
  }

  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-zinc-900/90 to-black",
          "border border-lime-500/20",
          "transition-all duration-500 ease-out",
          "hover:border-lime-500/60 hover:shadow-[0_0_40px_rgba(132,204,22,0.15)]",
          "hover:scale-[1.02]",
          sizeClasses[size],
          className
        )}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-lime-500/10 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
        </div>

        {/* Image container */}
        <div className="relative w-full h-full">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          <h3 className="text-lg md:text-xl font-bold text-white mb-1 group-hover:text-lime-400 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 line-clamp-2">
            {description}
          </p>
          
          {/* Arrow indicator */}
          <div className="mt-3 flex items-center gap-2 text-lime-500 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
            <span className="text-xs font-medium">Decouvrir</span>
            <svg 
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-lime-500/20 to-transparent transform rotate-45 translate-x-16 -translate-y-16 group-hover:from-lime-500/40 transition-colors duration-500" />
        </div>
      </div>
    </Link>
  )
}

// Grid component for premium cards
interface PremiumFeatureGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function PremiumFeatureGrid({ 
  children, 
  columns = 4,
  className 
}: PremiumFeatureGridProps) {
  const colClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div className={cn("grid gap-4 md:gap-6", colClasses[columns], className)}>
      {children}
    </div>
  )
}
