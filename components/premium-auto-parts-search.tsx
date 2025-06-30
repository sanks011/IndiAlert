"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  MapPin,
  Clock,
  Phone,
  Shield,
  Filter,
  FileText,
  ChevronDown,
  Star,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Settings,
  Gauge,
  PenToolIcon as Tool,
  Check,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function PremiumAutoPartsSearch() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [city, setCity] = useState("Москва")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const heroRef = useRef<HTMLDivElement>(null)
  const searchFormRef = useRef<HTMLFormElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Simulate geolocation detection
  const detectLocation = () => {
    setIsDetectingLocation(true)
    setTimeout(() => {
      setCity("Москва")
      setIsDetectingLocation(false)
    }, 1500)
  }

  useEffect(() => {
    // Detect location on initial load
    detectLocation()

    // Handle scroll events for animations
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)

      // Determine active section for animations
      const scrollPosition = window.scrollY + window.innerHeight / 2

      document.querySelectorAll("section[id]").forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop
        const sectionHeight = (section as HTMLElement).offsetHeight

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection((section as HTMLElement).id)
        }
      })
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This would handle the search in a real application
    alert("Поиск запчастей...")
  }

  // Parallax effect for hero section
  useEffect(() => {
    const handleParallax = () => {
      if (heroRef.current) {
        const scrollValue = window.scrollY
        heroRef.current.style.transform = `translateY(${scrollValue * 0.3}px)`
        heroRef.current.style.opacity = `${1 - scrollValue * 0.002}`
      }
    }

    window.addEventListener("scroll", handleParallax)
    return () => window.removeEventListener("scroll", handleParallax)
  }, [])

  // Animated counter for statistics
  const CounterAnimation = ({ end, duration = 2000, label }: { end: number; duration?: number; label: string }) => {
    const [count, setCount] = useState(0)
    const counterRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            let startTime: number
            const step = (timestamp: number) => {
              if (!startTime) startTime = timestamp
              const progress = Math.min((timestamp - startTime) / duration, 1)
              setCount(Math.floor(progress * end))
              if (progress < 1) {
                window.requestAnimationFrame(step)
              }
            }
            window.requestAnimationFrame(step)
            observer.disconnect()
          }
        },
        { threshold: 0.1 },
      )

      if (counterRef.current) {
        observer.observe(counterRef.current)
      }

      return () => observer.disconnect()
    }, [end, duration])

    return (
      <div ref={counterRef} className="text-center">
        <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
          {count}+
        </div>
        <p className="text-sm text-muted-foreground mt-2">{label}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled ? "bg-black/80 backdrop-blur-lg border-b border-white/10 py-2" : "bg-transparent py-4",
        )}
      >
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-sm opacity-70"></div>
              <div className="relative bg-black rounded-full p-2">
                <Search className="h-6 w-6 text-primary" />
              </div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              АвтоЗапчасти.Премиум
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Как это работает
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Отзывы
            </Link>
            <Link
              href="#for-suppliers"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Для поставщиков
            </Link>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Войти
            </Button>
            <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
              Регистрация
            </Button>
          </nav>

          {/* Mobile Navigation Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="container md:hidden py-4 border-t border-white/10 bg-black/95 backdrop-blur-lg absolute left-0 right-0">
            <nav className="flex flex-col gap-4">
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Как это работает
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Отзывы
              </Link>
              <Link
                href="#for-suppliers"
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Для поставщиков
              </Link>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full">
                Войти
              </Button>
              <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity w-full">
                Регистрация
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section with Search Form */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>

          {/* Animated background grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxMjEyMTIiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iLjUiLz48cGF0aCBkPSJNMCAzMGgzMHYzMEgweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9Ii41Ii8+PHBhdGggZD0iTTMwIDBIMHYzMGgzMHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIuNSIvPjxwYXRoIGQ9Ik0zMCAwaDMwdjMwSDMweiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9Ii41Ii8+PC9nPjwvc3ZnPg==')]"></div>

          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full filter blur-[100px] animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full filter blur-[80px] animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Parallax hero image */}
          <div ref={heroRef} className="absolute inset-0 opacity-30">
            <Image
              src="/placeholder.svg?height=1080&width=1920"
              fill
              alt="Luxury car parts"
              className="object-cover"
              priority
            />
          </div>

          <div className="container relative z-10 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Премиальный поиск автозапчастей</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Найдите автозапчасти в вашем городе за 1 минуту!
              </h1>

              <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto">
                Проверяйте наличие в магазинах и сервисах рядом с вами с помощью нашей премиальной системы поиска
              </p>
            </div>

            {/* Search Form */}
            <div className="relative max-w-4xl mx-auto">
              {/* Glowing border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>

              <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-900/5"></div>
                <CardHeader>
                  <CardTitle className="text-2xl">Найдите нужную запчасть прямо сейчас</CardTitle>
                  <CardDescription className="text-white/60">
                    Введите название или артикул запчасти, выберите город и радиус поиска
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form ref={searchFormRef} onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-4">
                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="part" className="text-sm font-medium mb-1 block text-white/70">
                        Название запчасти
                      </label>
                      <div className="relative">
                        <Input
                          id="part"
                          placeholder="Например, тормозные колодки"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <Search className="h-4 w-4 text-white/40" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="city" className="text-sm font-medium mb-1 block text-white/70">
                        Ваш город
                      </label>
                      <div className="relative">
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 text-white/40 hover:text-primary"
                          onClick={detectLocation}
                          disabled={isDetectingLocation}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                      {isDetectingLocation && (
                        <p className="text-xs text-primary animate-pulse mt-1">Определяем ваш город...</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="radius" className="text-sm font-medium mb-1 block text-white/70">
                        Радиус поиска
                      </label>
                      <Select defaultValue="30">
                        <SelectTrigger
                          id="radius"
                          className="bg-white/5 border-white/10 text-white focus:border-primary focus:ring-primary"
                        >
                          <SelectValue placeholder="Выберите радиус" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-xl border border-white/10">
                          <SelectItem value="10" className="text-white focus:bg-white/10 focus:text-white">
                            10 км
                          </SelectItem>
                          <SelectItem value="30" className="text-white focus:bg-white/10 focus:text-white">
                            30 км
                          </SelectItem>
                          <SelectItem value="50" className="text-white focus:bg-white/10 focus:text-white">
                            50 км
                          </SelectItem>
                          <SelectItem value="100" className="text-white focus:bg-white/10 focus:text-white">
                            100 км
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity h-12 text-base"
                      >
                        <Search className="mr-2 h-5 w-5" /> Найти запчасти
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
              <CounterAnimation end={5000} label="Магазинов" />
              <CounterAnimation end={1000000} label="Запчастей" />
              <CounterAnimation end={50000} label="Клиентов" />
              <CounterAnimation end={99} label="% Довольных" />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
            <span className="text-sm text-white/50 mb-2">Прокрутите вниз</span>
            <ChevronDown className="h-6 w-6 text-white/50" />
          </div>
        </section>

        {/* Service Description */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Animated gradient orb */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full filter blur-[120px] opacity-30"></div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                <Settings className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Премиальный сервис</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Сервис мгновенного поиска автозапчастей
              </h2>

              <p className="text-lg text-white/70">
                Сервис мгновенно показывает, где в вашем городе есть нужные автозапчасти. Экономьте время — не
                обзванивайте магазины, не ждите доставки из другого города!
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Clock className="h-8 w-8" />,
                  title: "Актуальные данные о наличии",
                  description: "Обновляем информацию о наличии запчастей в режиме реального времени",
                },
                {
                  icon: <Phone className="h-8 w-8" />,
                  title: "Прямые контакты продавцов",
                  description: "Звоните напрямую в магазины без посредников и дополнительных комиссий",
                },
                {
                  icon: <Filter className="h-8 w-8" />,
                  title: "Фильтры по цене и брендам",
                  description: "Сортируйте результаты по цене, расстоянию, бренду и другим параметрам",
                },
                {
                  icon: <FileText className="h-8 w-8" />,
                  title: "Поиск по OEM и VIN-коду",
                  description: "Находите оригинальные и совместимые запчасти по коду производителя",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors duration-300"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                  <div className="relative">
                    <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 p-3 rounded-lg w-16 h-16 flex items-center justify-center mb-6">
                      <div className="text-primary group-hover:text-white transition-colors duration-300">
                        {feature.icon}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-white/90 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-white/60 group-hover:text-white/70 transition-colors duration-300">
                      {feature.description}
                    </p>

                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowUpRight className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Animated lines */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            <div className="absolute top-2/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          </div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                <Gauge className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Простой процесс</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Как это работает
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection lines (only visible on md screens and up) */}
              <div className="hidden md:block absolute top-24 left-[calc(16.67%+8px)] right-[calc(16.67%+8px)] h-0.5">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary animate-pulse"></div>
              </div>

              {[
                {
                  step: 1,
                  title: "Введите запчасть и город",
                  description: "Укажите название или артикул запчасти, выберите город и радиус поиска",
                },
                {
                  step: 2,
                  title: "Сервис проверяет базу магазинов",
                  description: "Наша система мгновенно проверяет наличие запчастей в тысячах магазинов вашего города",
                },
                {
                  step: 3,
                  title: "Получите список адресов, цен и телефонов",
                  description: "Выбирайте лучшее предложение по цене и расположению, звоните напрямую продавцу",
                },
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-gradient-to-br from-black to-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-8 h-full hover:border-primary/50 transition-all duration-300 hover:translate-y-[-5px]">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-70"></div>
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-black text-primary font-bold text-xl border border-primary">
                          {step.step}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <h3 className="text-xl font-bold mb-4 text-white text-center">{step.title}</h3>

                      <p className="text-white/60 text-center">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo animation */}
            <div className="mt-20 max-w-4xl mx-auto">
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video">
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-medium">Демонстрация работы сервиса</p>
                  </div>
                </div>
                <Image
                  src="/placeholder.svg?height=720&width=1280"
                  width={1280}
                  height={720}
                  alt="Демонстрация работы сервиса"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Popular Parts */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                <Tool className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Быстрый доступ</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Популярные запчасти
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                "Аккумуляторы",
                "Масляные фильтры",
                "Воздушные фильтры",
                "Тормозные колодки",
                "Ремни ГРМ",
                "Свечи зажигания",
              ].map((part, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:translate-y-[-5px] cursor-pointer"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                  <div className="relative text-center">
                    <p className="font-medium text-white group-hover:text-primary transition-colors duration-300">
                      {part}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map Integration */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Интерактивная карта</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Магазины на карте
              </h2>
            </div>

            <div ref={mapRef} className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl blur opacity-30"></div>
              <div className="relative h-[500px] bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                  <Image
                    src="/placeholder.svg?height=800&width=1600"
                    fill
                    alt="Карта магазинов"
                    className="object-cover"
                  />
                </div>
                <div className="relative text-center max-w-md px-4">
                  <MapPin className="h-16 w-16 text-primary mx-auto mb-6 animate-bounce" />
                  <h3 className="text-2xl font-bold mb-4">Интерактивная карта магазинов</h3>
                  <p className="text-white/70 mb-6">
                    Находите ближайшие магазины с нужными запчастями прямо на карте. Сравнивайте цены и выбирайте
                    оптимальный вариант.
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                    Открыть карту
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 md:py-32 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Отзывы клиентов</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Отзывы пользователей
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  text: "Нашел глушитель за полцены в соседнем районе — спас сервис! Не пришлось ждать доставку из другого города.",
                  author: "Иван, Москва",
                  rating: 5,
                },
                {
                  text: "Срочно нужны были тормозные колодки. Через сервис нашел в магазине в 15 минутах от дома. Очень удобно!",
                  author: "Алексей, Санкт-Петербург",
                  rating: 5,
                },
                {
                  text: "Экономит кучу времени! Раньше обзванивала все магазины, теперь просто ввожу запчасть и вижу, где есть в наличии.",
                  author: "Елена, Екатеринбург",
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:border-primary/50 transition-all duration-300 hover:translate-y-[-5px]"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                  <div className="relative">
                    <div className="flex mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>

                    <p className="italic mb-6 text-white/80 group-hover:text-white transition-colors duration-300">
                      "{testimonial.text}"
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                        <span className="text-primary font-bold">{testimonial.author[0]}</span>
                      </div>
                      <p className="font-medium">{testimonial.author}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Наши партнеры
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-8 items-center">
              {[1, 2, 3, 4, 5].map((partner) => (
                <div
                  key={partner}
                  className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-6 h-24 w-48 flex items-center justify-center hover:border-primary/50 transition-all duration-300"
                >
                  <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                  <div className="relative">
                    <span className="text-white/40 font-medium group-hover:text-primary transition-colors duration-300">
                      Партнер {partner}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Second CTA */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-black to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-[100px] animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full filter blur-[80px] animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>

          <div className="container relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Начните поиск сейчас</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Не откладывайте — найдите запчасть сейчас!
              </h2>

              <p className="text-xl text-white/70 mb-8">
                Тысячи автовладельцев уже экономят время и деньги с нашим сервисом
              </p>
            </div>

            <div className="relative max-w-3xl mx-auto">
              {/* Glowing border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl blur opacity-30 animate-gradient-x"></div>

              <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-900/5"></div>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
                    <Input
                      placeholder="Название запчасти"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary"
                      required
                    />

                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary"
                      required
                    />

                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity h-12"
                    >
                      <Search className="mr-2 h-5 w-5" /> Найти
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* For Suppliers */}
        <section id="for-suppliers" className="py-24 md:py-32 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="container relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Для бизнеса</span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                  Для поставщиков автозапчастей
                </h2>

                <p className="text-lg text-white/70 mb-8">
                  Владеете магазином автозапчастей или СТО? Подключитесь к нашей системе и получайте новых клиентов
                  каждый день.
                </p>

                <ul className="space-y-4 mb-8">
                  {["Бесплатное подключение", "Интеграция с вашей системой учета", "Только целевые клиенты"].map(
                    (item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-70"></div>
                          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-black border border-primary">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                        </div>
                        <span className="text-white/80">{item}</span>
                      </li>
                    ),
                  )}
                </ul>

                <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                  Стать партнером <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-xl blur-md opacity-50"></div>
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    width={800}
                    height={600}
                    alt="Автомагазин"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-xl font-bold mb-2">Увеличьте продажи</p>
                    <p className="text-white/70">Подключитесь к нашей системе и получайте новых клиентов</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="container relative z-10 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-sm opacity-70"></div>
                  <div className="relative bg-black rounded-full p-2">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                  АвтоЗапчасти.Премиум
                </span>
              </div>

              <p className="text-white/60 mb-6">Премиальный сервис поиска автозапчастей в наличии в вашем городе</p>

              <div className="space-y-3">
                <p className="text-sm flex items-center gap-2 text-white/60">
                  <Phone className="h-4 w-4 text-primary" /> 8 (800) 123-45-67
                </p>
                <p className="text-sm text-white/60">
                  <span className="text-primary">@</span> info@автозапчасти-поиск.рф
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Сервис
              </h3>
              <ul className="space-y-3">
                {["О проекте", "Как это работает", "Часто задаваемые вопросы", "Блог"].map((item, index) => (
                  <li key={index}>
                    <Link
                      href="#"
                      className="text-white/60 hover:text-primary transition-colors duration-300 flex items-center gap-2"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Для бизнеса
              </h3>
              <ul className="space-y-3">
                {["Для поставщиков", "Для магазинов", "Для СТО", "Рекламодателям"].map((item, index) => (
                  <li key={index}>
                    <Link
                      href="#"
                      className="text-white/60 hover:text-primary transition-colors duration-300 flex items-center gap-2"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Помощь
              </h3>
              <ul className="space-y-3">
                {["Поддержка", "Контакты", "Политика конфиденциальности", "Пользовательское соглашение"].map(
                  (item, index) => (
                    <li key={index}>
                      <Link
                        href="#"
                        className="text-white/60 hover:text-primary transition-colors duration-300 flex items-center gap-2"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {item}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-white/40">
            <p>© {new Date().getFullYear()} АвтоЗапчасти.Премиум. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Missing Play component
function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
