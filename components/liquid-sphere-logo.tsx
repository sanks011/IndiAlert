"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LiquidSphereLogoProps {
  className?: string
  size?: number
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

export default function LiquidSphereLogo({
  className,
  size = 40,
  primaryColor = "#3b82f6", // blue-500
  secondaryColor = "#8b5cf6", // purple-500
  accentColor = "#06b6d4", // cyan-500
}: LiquidSphereLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestIdRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, primaryColor)
    gradient.addColorStop(0.5, secondaryColor)
    gradient.addColorStop(1, accentColor)

    // Animation parameters
    const numBlobs = 6
    const blobRadius = size * 0.3
    const centerX = size / 2
    const centerY = size / 2
    const orbitRadius = size * 0.15
    const blobOpacity = 0.7

    // Animation function
    const animate = (time: number) => {
      if (!ctx) return

      timeRef.current = time * 0.001 // Convert to seconds

      // Clear canvas
      ctx.clearRect(0, 0, size, size)

      // Draw base circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = primaryColor
      ctx.globalAlpha = 0.2
      ctx.fill()

      // Draw animated blobs
      for (let i = 0; i < numBlobs; i++) {
        const angle = (i / numBlobs) * Math.PI * 2 + timeRef.current
        const wobble = Math.sin(timeRef.current * 2 + i) * 0.1
        const x = centerX + Math.cos(angle) * orbitRadius * (1 + wobble)
        const y = centerY + Math.sin(angle) * orbitRadius * (1 + wobble)
        const scale = 0.8 + Math.sin(timeRef.current * 3 + i * 0.5) * 0.2

        ctx.beginPath()
        ctx.arc(x, y, blobRadius * scale, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.globalAlpha = blobOpacity
        ctx.fill()
      }

      // Draw shimmering effect
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = Math.random() * size * 0.3
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance
        const particleSize = Math.random() * 2 + 1

        ctx.beginPath()
        ctx.arc(x, y, particleSize, 0, Math.PI * 2)
        ctx.fillStyle = "white"
        ctx.globalAlpha = Math.random() * 0.5
        ctx.fill()
      }

      // Reset global alpha
      ctx.globalAlpha = 1

      // Continue animation
      requestIdRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    requestIdRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(requestIdRef.current)
    }
  }, [size, primaryColor, secondaryColor, accentColor])

  return <canvas ref={canvasRef} className={cn("rounded-full", className)} style={{ width: size, height: size }} />
}
