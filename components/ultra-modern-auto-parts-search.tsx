"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
// Добавьте после других импортов
import {
  ArrowRight,
  BarChart,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Cpu,
  Layers,
  MapPin,
  RefreshCw,
  Satellite,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { TracingBeam } from "@/components/tracing-beam"
import AnimeSphereAnimation from "@/components/anime-sphere-animation"

// Компонент для анимированного placeholder
function AnimatedPlaceholder({ texts, className }: { texts: string[]; className?: string }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(80)

  useEffect(() => {
    const text = texts[currentTextIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Печатаем текст
        if (currentText.length < text.length) {
          setCurrentText(text.substring(0, currentText.length + 1))
          setTypingSpeed(80)
        } else {
          // Пауза перед удалением
          setIsDeleting(true)
          setTypingSpeed(1000)
        }
      } else {
        // Удаляем текст
        if (currentText.length > 0) {
          setCurrentText(text.substring(0, currentText.length - 1))
          setTypingSpeed(40)
        } else {
          // Переход к следующему тексту
          setIsDeleting(false)
          setCurrentTextIndex((currentTextIndex + 1) % texts.length)
          setTypingSpeed(500)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timeout)
  }, [currentText, currentTextIndex, isDeleting, texts, typingSpeed])

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export default function UltraModernAutoPartsSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [city, setCity] = useState("India")
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeSection, setActiveSection] = useState("search")
  const [showResults, setShowResults] = useState(false)
  const [selectedPart, setSelectedPart] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchSectionRef = useRef<HTMLElement>(null)
  const howSectionRef = useRef<HTMLElement>(null)

  // Handle search submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (searchQuery.trim()) {
      setShowResults(true)
      // Scroll to results after a small delay to allow for animation
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  // Handle escape key to close search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowResults(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Focus search input on initial load


  // Scroll to section when menu item is clicked
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)

    const sectionMap = {
      search: searchSectionRef,
      how: howSectionRef,
    }

    const sectionRef = sectionMap[sectionId as keyof typeof sectionMap]
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Handle scroll events for active section detection
  useEffect(() => {
    const handleScroll = () => {
      // Determine active section based on scroll position
      const sections = [
        { id: "search", ref: searchSectionRef },
        { id: "how", ref: howSectionRef },
      ]

      for (const section of sections) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Sample parts data
  const popularParts = [
    { name: "Deforestation", count: 1245 },
    { name: "Water Body Change", count: 876 },
    { name: "Land Reclamation", count: 543 },
    { name: "Illegal Encroachment", count: 1892 },
    { name: "Urban Expansion", count: 765 },
    { name: "Flood Monitoring", count: 1123 },
  ]

  // Sample results data
  const searchResults = [
    {
      id: 1,
      name: "Deforestation detected in Amazon AOI",
      price: "Included",
      store: "IndiAlert Engine",
      distance: "N/A",
      inStock: true,
      rating: 4.9,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      name: "Water body shrinkage in Rajasthan AOI",
      price: "Included",
      store: "IndiAlert Engine",
      distance: "N/A",
      inStock: true,
      rating: 4.8,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      name: "Illegal encroachment near Delhi AOI",
      price: "Included",
      store: "IndiAlert Engine",
      distance: "N/A",
      inStock: true,
      rating: 4.7,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 4,
      name: "Land reclamation in Shanghai AOI",
      price: "Included",
      store: "IndiAlert Engine",
      distance: "N/A",
      inStock: true,
      rating: 4.8,
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black"></div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        ></div>

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px] animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-400/10 blur-[80px] animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <span className="font-bold text-lg tracking-tight">IndiAlert</span>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className={cn(
                  "text-white/70 hover:text-white hover:bg-white/5 rounded-full",
                  activeSection === "search" && "text-white bg-white/5",
                )}
                onClick={() => scrollToSection("search")}
              >
                Search
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "text-white/70 hover:text-white hover:bg-white/5 rounded-full",
                  activeSection === "how" && "text-white bg-white/5",
                )}
                onClick={() => scrollToSection("how")}
              >
                How it works
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5 rounded-full">
                  Sign In
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4">
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area with TracingBeam */}
        <TracingBeam className="pt-24 pb-16">
          {/* Hero section with search */}
          <section
            ref={searchSectionRef}
            id="search"
            className="min-h-[90vh] flex flex-col items-center justify-center px-4 relative"
          >
            <div className="absolute inset-0 -z-10">
              <AnimeSphereAnimation />
            </div>
            <div
              className={cn(
                "max-w-4xl w-full transition-all duration-500 ease-out",
                searchFocused ? "scale-105" : "scale-100",
              )}
            >
              <h1
                className={cn(
                  "text-5xl md:text-7xl font-bold mb-6 text-center transition-all duration-500",
                  searchFocused ? "opacity-0 -translate-y-10" : "opacity-100 translate-y-0",
                )}
              >
                Detect Changes from Space Instantly
              </h1>

              <p
                className={cn(
                  "text-xl text-white/70 text-center mb-12 max-w-2xl mx-auto transition-all duration-500",
                  searchFocused ? "opacity-0 -translate-y-10" : "opacity-100 translate-y-0",
                )}
              >
                Monitor your Area of Interest (AOI) for changes using advanced satellite imagery and AI.
              </p>

              <form
                onSubmit={handleSearch}
                className={cn("relative transition-all duration-500", searchFocused ? "scale-110" : "scale-100")}
              >
                <div className="relative group">
                  <div
                    className={cn(
                      "absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 to-blue-500/0 rounded-full opacity-0 transition-all duration-300",
                      searchFocused ? "from-blue-500/20 to-blue-500/20 opacity-100 blur-sm" : "",
                    )}
                  ></div>

                  <div className="relative">
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      placeholder={searchFocused ? "" : "Select Area of Interest (AOI)"}
                      className="h-16 pl-16 pr-32 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder:text-white/50 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                    />

                    {searchFocused && searchQuery === "" && (
                      <div className="absolute left-16 top-1/2 transform -translate-y-1/2 text-white/50 pointer-events-none">
                        <AnimatedPlaceholder
                          texts={["Amazon forest AOI", "Urban expansion in Delhi", "Flood detection in Assam", "Deforestation alerts"]}
                        />
                      </div>
                    )}

                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />

                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        AI
                      </span>
                      <div className="text-sm text-white/50 border-r border-white/10 pr-4 pl-2">{city}</div>
                      <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 transition-transform duration-300 hover:scale-105"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {searchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 z-10">
                    <div className="text-sm text-white/50 mb-3 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                      <span>Popular Use Cases</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {popularParts.slice(0, 4).map((part, index) => (
                        <button
                          key={index}
                          type="button"
                          className="text-left p-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 group"
                          onClick={() => {
                            setSearchQuery(part.name)
                            handleSearch()
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors"></div>
                          <span>{part.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>

              <div
                className={cn(
                  "flex flex-wrap justify-center gap-4 mt-8 transition-all duration-500",
                  searchFocused ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0",
                )}
              >
                {popularParts.map((part, index) => (
                  <button
                    key={index}
                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors"
                    onClick={() => {
                      setSearchQuery(part.name)
                      handleSearch()
                    }}
                  >
                    {part.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div
              className={cn(
                "absolute bottom-8 left-0 right-0 flex justify-center gap-16 transition-all duration-500",
                searchFocused ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0",
              )}
            >
              <div className="text-center">
                <div className="text-3xl font-bold">5000+</div>
                <div className="text-white/50 text-sm">Satellites</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">1M+</div>
                <div className="text-white/50 text-sm">AOIs Monitored</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">30+</div>
                <div className="text-white/50 text-sm">Alerts Sent</div>
              </div>
            </div>
          </section>

          {/* Search results */}
          {showResults && (
            <section ref={resultsRef} className="py-16 px-4 border-t border-white/5 min-h-screen">
              <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Search results: {searchQuery}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white/5"
                    onClick={() => setShowResults(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className={cn(
                        "group relative border border-white/10 rounded-2xl p-6 transition-all duration-300",
                        "hover:border-blue-500/50 hover:bg-white/5",
                        selectedPart === result.name ? "border-blue-500 bg-white/5" : "",
                      )}
                      onClick={() => setSelectedPart(result.name)}
                    >
                      <div className="absolute -inset-px bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>

                      <div className="relative flex gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                          <Image
                            src={result.image || "/placeholder.svg"}
                            width={100}
                            height={100}
                            alt={result.name}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg mb-1">{result.name}</h3>
                            <span className="text-xl font-bold text-blue-400">{result.price}</span>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-white/70">{result.store}</span>
                            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                            <span className="text-white/70">{result.distance}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn("w-2 h-2 rounded-full", result.inStock ? "bg-green-500" : "bg-red-500")}
                              ></div>
                              <span className={cn("text-sm", result.inStock ? "text-green-400" : "text-red-400")}>
                                {result.inStock ? "In stock" : "Out of stock"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <div className="text-yellow-400">★</div>
                              <span className="text-white/70">{result.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <Button variant="ghost" className="text-white/70 hover:text-white p-0 h-auto">
                          Details
                        </Button>

                        <Button className="rounded-full bg-blue-600 hover:bg-blue-700 h-9 px-4">
                          Contact
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4">Store map</h3>

                  <div className="aspect-[16/9] rounded-xl overflow-hidden relative">
                    <Image
                      src="/placeholder.svg?height=720&width=1280"
                      width={1280}
                      height={720}
                      alt="Карта магазинов"
                      className="object-cover w-full h-full"
                    />

                    {/* Map pins */}
                    <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-blue-500 rounded-full animate-ping opacity-30"></div>
                        <div className="relative w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-green-500 rounded-full animate-ping opacity-30"></div>
                        <div className="relative w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-3/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className="absolute -inset-2 bg-red-500 rounded-full animate-ping opacity-30"></div>
                        <div className="relative w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* How it works section */}
          <section ref={howSectionRef} id="how" className="py-16 px-4 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center">How It Works</h2>
              <p className="text-white/70 text-center max-w-3xl mx-auto mb-16">
                Monitor your areas of interest in three simple steps. Our automated platform handles the complexity of
                satellite data analysis, delivering actionable alerts directly to you.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-16 relative">
                {[
                  {
                    icon: <MapPin className="h-8 w-8 text-blue-400" />,
                    title: "1. Define Your AOI",
                    description:
                      "Simply define your Area of Interest (AOI) on the map. You can draw a polygon, upload a file, or use an address.",
                    benefits: [
                      "Flexible AOI definition tools",
                      "Support for various file formats (KML, GeoJSON)",
                      "Save and manage multiple AOIs",
                    ],
                  },
                  {
                    icon: <Cpu className="h-8 w-8 text-blue-400" />,
                    title: "2. AI Analyzes Imagery",
                    description:
                      "Our platform automatically sources and analyzes multi-source satellite imagery for your AOI.",
                    benefits: [
                      "Access to multiple satellite constellations",
                      "AI algorithms detect significant changes",
                      "Filters out noise and seasonal variations",
                    ],
                  },
                  {
                    icon: <Bell className="h-8 w-8 text-blue-400" />,
                    title: "3. Receive Instant Alerts",
                    description: "Get notified via email or dashboard alerts the moment a relevant change is detected.",
                    benefits: [
                      "Customizable alert preferences",
                      "Detailed reports with before/after imagery",
                      "Integrate alerts with your existing workflows",
                    ],
                  },
                ].map((step, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -inset-px bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>

                    <div className="relative border border-white/10 rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-blue-500/50 group-hover:bg-white/5">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center text-xl font-bold">
                        {index + 1}
                      </div>

                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mt-4">
                        {step.icon}
                      </div>

                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-white/70 mb-6">{step.description}</p>

                      <div className="space-y-2">
                        {step.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            </div>
                            <p className="text-sm text-white/60">{benefit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-white/10 rounded-2xl p-8 mb-16 bg-white/5 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-6 text-center">Platform Advantages</h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Automated Monitoring",
                      description: "Set your AOI once and let our AI do the continuous work, 24/7.",
                      icon: <RefreshCw className="h-6 w-6 text-blue-400" />,
                    },
                    {
                      title: "High-Res Imagery",
                      description: "Access to a constellation of high-resolution satellites for detailed analysis.",
                      icon: <Satellite className="h-6 w-6 text-green-400" />,
                    },
                    {
                      title: "Actionable Insights",
                      description: "Receive clear alerts that highlight what has changed, where, and when.",
                      icon: <BarChart className="h-6 w-6 text-blue-400" />,
                    },
                    {
                      title: "Powered by AI",
                      description: "Our algorithms filter out noise to identify meaningful changes.",
                      icon: <Sparkles className="h-6 w-6 text-blue-400" />,
                    },
                  ].map((benefit, index) => (
                    <div
                      key={index}
                      className="border border-white/10 rounded-xl p-4 hover:border-blue-500/50 hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          {benefit.icon}
                        </div>
                        <h4 className="font-bold">{benefit.title}</h4>
                      </div>
                      <p className="text-white/70 text-sm">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 rounded-2xl p-8 mb-16 bg-gradient-to-br from-black to-blue-950/30 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                  AI-Powered Analysis at its Core
                </h3>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-blue-400">Intelligent Change Detection</h4>
                    <p className="text-white/70">
                      Our service uses advanced AI algorithms trained on petabytes of satellite data to identify
                      meaningful changes on the Earth's surface, distinguishing them from natural variations.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 text-blue-400" />
                        </div>
                        <p className="text-sm text-white/70">Detects deforestation and urban sprawl</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 text-blue-400" />
                        </div>
                        <p className="text-sm text-white/70">Monitors agricultural and water body changes</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                          <Check className="h-3 w-3 text-blue-400" />
                        </div>
                        <p className="text-sm text-white/70">Identifies new infrastructure and construction</p>
                      </li>
                    </ul>
                  </div>

                  <div className="relative">
                    <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-blue-500/20 rounded-2xl blur-md"></div>
                    <div className="relative border border-white/10 rounded-2xl p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <Cpu className="w-6 h-6 text-blue-400" />
                        </div>
                        <h4 className="text-xl font-semibold">Data Processing Engine</h4>
                      </div>
                      <p className="text-white/70 mb-4">
                        Our custom data pipeline processes terabytes of imagery daily to deliver timely and accurate
                        insights.
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Analysis Speed</span>
                        <span className="text-blue-400 font-medium">Up to 10,000 km²/hr</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 mb-3">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "90%" }}></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Detection Accuracy</span>
                        <span className="text-blue-400 font-medium">98.2%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full mt-1">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "98.2%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mb-16">
                <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 via-blue-500/20 to-blue-500/20 rounded-2xl blur-md"></div>

                <div className="relative border border-white/10 rounded-2xl overflow-hidden">
                  <div className="aspect-video relative">
                    <Image
                      src="/20250630_2155_Indian Map Gradient_simple_compose_01jz0tep46e3xb0rst3ra5snqr.png"
                      width={1280}
                      height={720}
                      alt="Satellite map of India for AI Change Detection"
                      className="object-contain w-full h-full bg-black"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-blue-600/80 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <polygon points="8,5 19,12 8,19" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold mb-6">Ready to start monitoring?</h3>
                <Button
                  className="rounded-full bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg"
                  onClick={() => scrollToSection("search")}
                >
                  Join the network
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </section>
        </TracingBeam>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 px-4">
          <div className="container mx-auto text-center text-white/50">
            <p>&copy; {new Date().getFullYear()} IndiAlert. All rights reserved.</p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
