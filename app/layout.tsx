import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IndiAlert - Satellite Change Monitoring for India",
  description: "Instant satellite change detection and environmental monitoring across India powered by AI",
  generator: 'Sankalpa'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense
          fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold mb-2">Loading IndiAlert</h2>
                <p className="text-white/60">Preparing your satellite change monitoring experience...</p>
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </body>
    </html>
  )
}
