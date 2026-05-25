"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"

interface AnimatedCounterProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  decimals?: number
  className?: string
  separator?: string
}

export function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
  separator = " "
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  })

  useEffect(() => {
    if (!inView) return

    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (end - startValue) * easeOutQuart
      
      countRef.current = currentValue
      setCount(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [inView, end, duration])

  const formatNumber = (num: number) => {
    const fixed = num.toFixed(decimals)
    const parts = fixed.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return parts.join(",")
  }

  return (
    <span ref={ref} className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  )
}

// Composant pour les statistiques avec effet de pulse
export function AnimatedStat({
  value,
  label,
  suffix = "",
  prefix = "",
  icon: Icon,
  className = ""
}: {
  value: number
  label: string
  suffix?: string
  prefix?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <div className={`text-center group ${className}`}>
      {Icon && (
        <div className="flex justify-center mb-2">
          <Icon className="w-8 h-8 text-lime-400 group-hover:scale-110 transition-transform" />
        </div>
      )}
      <div className="text-3xl md:text-4xl font-bold text-white">
        <AnimatedCounter 
          end={value} 
          suffix={suffix} 
          prefix={prefix}
          className="tabular-nums"
        />
      </div>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  )
}
