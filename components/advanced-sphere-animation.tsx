"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AdvancedSphereAnimationProps {
  className?: string
  size?: number
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
}

export default function AdvancedSphereAnimation({
  className,
  size = 600,
  primaryColor = "#3b82f6", // blue-500
  secondaryColor = "#8b5cf6", // purple-500
  backgroundColor = "transparent",
}: AdvancedSphereAnimationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = svgRef.current
    const mainCircle = svg.querySelector("#mainCircle")
    const blob1 = svg.querySelector("#blob1")
    const blob2 = svg.querySelector("#blob2")
    const blob3 = svg.querySelector("#blob3")

    if (!mainCircle || !blob1 || !blob2 || !blob3) return

    // Animation parameters
    const duration = 20000 // 20 seconds for one full cycle

    // Create animation
    const animate = () => {
      const time = Date.now()

      // Main circle subtle pulsing
      const mainScale = 0.98 + Math.sin(time / 2000) * 0.02
      mainCircle.setAttribute("transform", `scale(${mainScale})`)

      // Blob 1 movement
      const blob1X = 50 + Math.sin(time / 3000) * 10
      const blob1Y = 50 + Math.cos(time / 4000) * 10
      const blob1Scale = 0.9 + Math.sin(time / 2500) * 0.1
      blob1.setAttribute("cx", blob1X.toString())
      blob1.setAttribute("cy", blob1Y.toString())
      blob1.setAttribute("transform", `scale(${blob1Scale})`)

      // Blob 2 movement
      const blob2X = 50 + Math.sin(time / 4000 + 2) * 15
      const blob2Y = 50 + Math.cos(time / 3500 + 1) * 15
      const blob2Scale = 0.85 + Math.sin(time / 3000 + 1) * 0.15
      blob2.setAttribute("cx", blob2X.toString())
      blob2.setAttribute("cy", blob2Y.toString())
      blob2.setAttribute("transform", `scale(${blob2Scale})`)

      // Blob 3 movement
      const blob3X = 50 + Math.sin(time / 5000 + 4) * 12
      const blob3Y = 50 + Math.cos(time / 4500 + 3) * 12
      const blob3Scale = 0.8 + Math.sin(time / 3500 + 2) * 0.2
      blob3.setAttribute("cx", blob3X.toString())
      blob3.setAttribute("cy", blob3Y.toString())
      blob3.setAttribute("transform", `scale(${blob3Scale})`)

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
        <defs>
          <radialGradient id="sphereGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
          </radialGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Main circle */}
        <circle
          id="mainCircle"
          cx="50"
          cy="50"
          r="35"
          fill="url(#sphereGradient)"
          filter="url(#glow)"
          transform-origin="center"
        />

        {/* Animated blobs */}
        <circle id="blob1" cx="50" cy="50" r="20" fill={primaryColor} fillOpacity="0.4" transform-origin="center" />

        <circle id="blob2" cx="50" cy="50" r="15" fill={secondaryColor} fillOpacity="0.5" transform-origin="center" />

        <circle id="blob3" cx="50" cy="50" r="10" fill={primaryColor} fillOpacity="0.6" transform-origin="center" />
      </svg>
    </div>
  )
}
