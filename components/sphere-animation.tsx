"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SphereAnimationProps {
  className?: string
  size?: number
  color?: string
  backgroundColor?: string
}

export default function SphereAnimation({
  className,
  size = 500,
  color = "#000000",
  backgroundColor = "transparent",
}: SphereAnimationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = svgRef.current
    const circle = svg.querySelector("circle")
    if (!circle) return

    // Animation parameters
    const duration = 20000 // 20 seconds for one full cycle
    const maxScale = 1.05
    const minScale = 0.95

    // Create animation
    const animate = () => {
      const now = Date.now() / duration
      const scale = minScale + Math.abs(Math.sin(now * Math.PI * 2)) * (maxScale - minScale)

      // Apply scale transformation
      circle.setAttribute("transform", `scale(${scale})`)

      // Continue animation
      requestAnimationFrame(animate)
    }

    // Start animation
    const animationId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor }}
      >
        <circle cx="50" cy="50" r="40" fill={color} transform-origin="center" />
      </svg>
    </div>
  )
}
