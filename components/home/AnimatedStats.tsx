'use client'

import { useEffect, useState, useRef } from 'react'

interface Stat {
  value: number
  suffix: string
  prefix?: string
  label: string
  decimals?: number
}

const stats: Stat[] = [
  { value: 4.2, suffix: 'M', prefix: '$', label: 'Total Savings', decimals: 1 },
  { value: 127, suffix: 'K', label: 'Active Users' },
  { value: 23, suffix: '%', label: 'Avg. Savings' },
]

function AnimatedNumber({
  value,
  suffix,
  prefix = '',
  decimals = 0,
  isVisible
}: {
  value: number
  suffix: string
  prefix?: string
  decimals?: number
  isVisible: boolean
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(value, increment * step)
      setDisplayValue(current)

      if (step >= steps) {
        clearInterval(timer)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, isVisible])

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.floor(displayValue).toString()

  return (
    <span>
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

export default function AnimatedStats() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-3 gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center md:text-left">
          <div className="text-3xl md:text-4xl font-black text-green-500 mb-2">
            <AnimatedNumber
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              decimals={stat.decimals}
              isVisible={isVisible}
            />
          </div>
          <div className="text-sm text-gray-500">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
