"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  ArrowRight,
  Menu,
  X,
  Check,
  Car,
  Settings,
  Clock,
  Phone,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function AvantGardeAutoPartsSearch() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [city, setCity] = useState("Москва")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  // Simulate geolocation detection
  const detectLocation = () => {
    setIsDetectingLocation(true)
    setTimeout(() => {
      setCity("Москва")
      setIsDetectingLocation(false)
    }, 1500)
  }

  // Custom cursor effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    // Detect location on initial load
    detectLocation()

    // Handle scroll events for animations
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This would handle the search in a real application
    alert("Поиск запчастей...")
  }

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const testimonials = [
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
  ]

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative font-sans antialiased bg-[#FAFAFA]">
      {/* Custom cursor */}
      <div
        ref={cursorRef}
        className="fixed w-6 h-6 rounded-full border-2 border-blue-500 pointer-events-none z-50 mix-blend-difference hidden md:block"
        style={{ transform: "translate(-50%, -50%)" }}
      ></div>

      {/* Search panel overlay */}
      {showSearchPanel && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Поиск запчастей</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSearchPanel(false)} className="rounded-full">
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="mb-8">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите название или артикул запчасти"
                  className="h-16 text-xl pl-16 pr-4 rounded-none border-x-0 border-t-0 border-b-2 border-neutral-200 focus:border-blue-500 focus:ring-0"
                />
                <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 h-6 w-6 text-neutral-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                "Тормозные колодки",
                "Масляный фильтр",
                "Аккумулятор",
                "Свечи зажигания",
                "Воздушный фильтр",
                "Амортизаторы",
                "Ремень ГРМ",
                "Фары",
              ].map((item, index) => (
                <div key={index} className="group cursor-pointer" onClick={() => setSearchQuery(item)}>
                  <div className="aspect-square bg-neutral-100 rounded-3xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <p className="font-medium text-lg group-hover:text-blue-600 transition-colors duration-300">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
          scrolled ? "bg-white py-3" : "bg-transparent py-6",
        )}
      >
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-tight">АвтоПоиск</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-neutral-600 hover:text-blue-500 transition-colors"
            >
              Как это работает
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-neutral-600 hover:text-blue-500 transition-colors"
            >
              Отзывы
            </Link>
            <Link
              href="#for-suppliers"
              className="text-sm font-medium text-neutral-600 hover:text-blue-500 transition-colors"
            >
              Для поставщиков
            </Link>
            <Button
              onClick={() => setShowSearchPanel(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-10 px-5"
            >
              <Search className="h-4 w-4 mr-2" /> Поиск
            </Button>
          </nav>

          {/* Mobile Navigation Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-neutral-100 p-4">
            <nav className="flex flex-col gap-4">
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-neutral-600 hover:text-blue-500 transition-colors p-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Как это работает
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-neutral-600 hover:text-blue-500 transition-colors p-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Отзывы
              </Link>
              <Link
                href="#for-suppliers"
                className="text-sm font-medium text-neutral-600 hover:text-blue-500 transition-colors p-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Для поставщиков
              </Link>
              <Button
                onClick={() => {
                  setShowSearchPanel(true)
                  setIsMenuOpen(false)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-10 w-full"
              >
                <Search className="h-4 w-4 mr-2" /> Поиск
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 md:pr-8">
                <div className="relative mb-6">
                  <div className="absolute -left-4 -top-4 w-16 h-16 bg-orange-500 rounded-full opacity-10"></div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500 rounded-full opacity-10"></div>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                    Найдите <span className="text-blue-500">запчасти</span> за секунды
                  </h1>
                </div>

                <p className="text-xl text-neutral-600 mb-8 max-w-lg">
                  Мгновенно проверяйте наличие автозапчастей в магазинах вашего города и сравнивайте цены
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Button
                    onClick={() => setShowSearchPanel(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full h-14 px-8 text-lg"
                  >
                    Найти запчасти
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <Button variant="outline" className="rounded-full h-14 px-8 text-lg border-2">
                    Как это работает
                  </Button>
                </div>

                <div className="flex flex-wrap gap-y-4 gap-x-8">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">5000+ магазинов</p>
                      <p className="text-sm text-neutral-500">по всей России</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Актуальные цены</p>
                      <p className="text-sm text-neutral-500">обновляются ежечасно</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 relative">
                <div className="relative">
                  {/* Main image */}
                  <div className="relative z-10 rounded-3xl overflow-hidden">
                    <Image
                      src="/placeholder.svg?height=600&width=600"
                      width={600}
                      height={600}
                      alt="Автозапчасти"
                      className="object-cover w-full h-auto"
                    />
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-500 rounded-3xl rotate-12 opacity-10"></div>
                  <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-blue-500 rounded-full opacity-10"></div>

                  {/* Floating card 1 */}
                  <div className="absolute top-8 -left-16 bg-white rounded-2xl shadow-lg p-4 max-w-[200px] z-20 hidden md:block">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="font-medium">Быстрый поиск</p>
                    </div>
                    <p className="text-sm text-neutral-600">Среднее время поиска — 47 секунд</p>
                  </div>

                  {/* Floating card 2 */}
                  <div className="absolute -bottom-4 right-12 bg-white rounded-2xl shadow-lg p-4 max-w-[220px] z-20 hidden md:block">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="font-medium">Экономия</p>
                    </div>
                    <p className="text-sm text-neutral-600">В среднем клиенты экономят до 30% на запчастях</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Популярные категории</h2>
                <p className="text-neutral-600 max-w-xl">
                  Быстрый доступ к самым востребованным категориям автозапчастей
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-12 w-12 border-2"
                  onClick={() => {
                    const container = document.getElementById("categories-container")
                    if (container) container.scrollLeft -= 300
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-12 w-12 border-2"
                  onClick={() => {
                    const container = document.getElementById("categories-container")
                    if (container) container.scrollLeft += 300
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div
              id="categories-container"
              className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {[
                {
                  name: "Тормозная система",
                  image: "/placeholder.svg?height=300&width=300",
                  count: 1245,
                },
                {
                  name: "Фильтры",
                  image: "/placeholder.svg?height=300&width=300",
                  count: 876,
                },
                {
                  name: "Аккумуляторы",
                  image: "/placeholder.svg?height=300&width=300",
                  count: 543,
                },
                {
                  name: "Масла и жидкости",
                  image: "/placeholder.svg?height=300&width=300",
                  count: 1892,
                },
                {
                  name: "Подвеска",
                  image: "/placeholder.svg?height=300&width=300",
                  count: 765,
                },
                {
                  name: "Электрика",
                  image: "/placeholder.svg?height=300&width=300",
                  count: 1123,
                },
              ].map((category, index) => (
                <div
                  key={index}
                  className="min-w-[280px] snap-start group cursor-pointer"
                  onClick={() => setActiveCategory(category.name)}
                >
                  <div className="bg-neutral-50 rounded-3xl overflow-hidden h-full transition-all duration-300 hover:shadow-md">
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={category.image || "/placeholder.svg"}
                        width={300}
                        height={300}
                        alt={category.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-white font-medium text-xl">{category.name}</p>
                        <p className="text-white/80 text-sm">{category.count} товаров</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Как это работает</h2>
              <p className="text-lg text-neutral-600">
                Всего три простых шага для поиска нужной запчасти по лучшей цене
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-24 left-[calc(16.67%+8px)] right-[calc(16.67%+8px)] h-0.5">
                <div className="h-full bg-neutral-200 relative">
                  <div className="absolute top-1/2 left-1/3 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div className="absolute top-1/2 left-2/3 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
              </div>

              {[
                {
                  step: 1,
                  title: "Введите запрос",
                  description: "Укажите название или артикул запчасти, выберите город и радиус поиска",
                },
                {
                  step: 2,
                  title: "Получите результаты",
                  description: "Система мгновенно проверит наличие в тысячах магазинов вашего города",
                },
                {
                  step: 3,
                  title: "Выберите лучшее предложение",
                  description: "Сравните цены, расположение и наличие, свяжитесь напрямую с продавцом",
                },
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white rounded-3xl p-8 h-full border border-neutral-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white font-bold text-xl">
                        {step.step}
                      </div>
                    </div>

                    <div className="pt-6 text-center">
                      <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                      <p className="text-neutral-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo */}
            <div className="mt-24 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-neutral-100">
                <div className="bg-neutral-100 p-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 text-sm text-neutral-500">АвтоПоиск — Демонстрация</div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <div className="bg-neutral-50 rounded-2xl p-4">
                        <h3 className="font-medium mb-4">Параметры поиска</h3>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-neutral-500 block mb-1">Запчасть</label>
                            <div className="bg-white border border-neutral-200 rounded-lg p-2 text-sm">
                              Тормозные колодки
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-neutral-500 block mb-1">Город</label>
                            <div className="bg-white border border-neutral-200 rounded-lg p-2 text-sm">Москва</div>
                          </div>

                          <div>
                            <label className="text-sm text-neutral-500 block mb-1">Радиус</label>
                            <div className="bg-white border border-neutral-200 rounded-lg p-2 text-sm">30 км</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-2/3">
                      <h3 className="font-medium mb-4">Результаты поиска</h3>

                      <div className="space-y-4">
                        {[
                          {
                            name: "АвтоМаг",
                            address: "ул. Автомобильная, 42",
                            price: "2 450 ₽",
                            distance: "3.2 км",
                            inStock: true,
                          },
                          {
                            name: "ЗапчастиПлюс",
                            address: "пр. Механиков, 15",
                            price: "2 650 ₽",
                            distance: "5.7 км",
                            inStock: true,
                          },
                          {
                            name: "АвтоДеталь",
                            address: "ул. Моторная, 78",
                            price: "2 300 ₽",
                            distance: "8.1 км",
                            inStock: true,
                          },
                        ].map((result, index) => (
                          <div
                            key={index}
                            className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-blue-500 transition-colors duration-300"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{result.name}</h4>
                                <p className="text-sm text-neutral-500">{result.address}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{result.price}</p>
                                <p className="text-sm text-neutral-500">{result.distance}</p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm text-green-600">В наличии</span>
                              </div>

                              <Button variant="outline" size="sm" className="rounded-lg text-blue-500 border-blue-500">
                                Подробнее
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6">
                  Преимущества
                </div>

                <h2 className="text-3xl md:text-5xl font-bold mb-8">Почему выбирают наш сервис</h2>

                <div className="space-y-8">
                  {[
                    {
                      icon: <Clock className="h-6 w-6 text-blue-500" />,
                      title: "Экономия времени",
                      description: "Не нужно обзванивать десятки магазинов. Все результаты в одном месте за секунды.",
                    },
                    {
                      icon: <Settings className="h-6 w-6 text-blue-500" />,
                      title: "Актуальные данные",
                      description: "Информация о наличии и ценах обновляется в режиме реального времени.",
                    },
                    {
                      icon: <Phone className="h-6 w-6 text-blue-500" />,
                      title: "Прямой контакт",
                      description: "Звоните напрямую в магазины без посредников и дополнительных комиссий.",
                    },
                  ].map((feature, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-neutral-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-8 -left-8 w-48 h-48 bg-blue-500 rounded-full opacity-10"></div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-500 rounded-full opacity-10"></div>

                <div className="relative z-10 rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/placeholder.svg?height=600&width=600"
                    width={600}
                    height={600}
                    alt="Поиск автозапчастей"
                    className="object-cover w-full h-auto"
                  />
                </div>

                {/* Stats overlay */}
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lg p-6 max-w-[260px] z-20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="font-medium">Статистика</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-neutral-500">Запросов в день</p>
                        <p className="text-sm font-medium">15,000+</p>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-neutral-500">Магазинов</p>
                        <p className="text-sm font-medium">5,000+</p>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-neutral-500">Экономия времени</p>
                        <p className="text-sm font-medium">85%</p>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6">
                  Отзывы
                </div>

                <h2 className="text-3xl md:text-5xl font-bold mb-4">Что говорят наши клиенты</h2>
                <p className="text-neutral-600 max-w-xl">
                  Реальные отзывы от людей, которые уже воспользовались нашим сервисом
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-12 w-12 border-2"
                  onClick={prevTestimonial}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-12 w-12 border-2"
                  onClick={nextTestimonial}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-8 -left-8 w-48 h-48 bg-blue-500 rounded-full opacity-10"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-500 rounded-full opacity-10"></div>

              <div className="relative z-10 bg-white rounded-3xl p-8 md:p-12 shadow-xl">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4">
                      <Image
                        src="/placeholder.svg?height=300&width=300"
                        width={300}
                        height={300}
                        alt={testimonials[currentTestimonial].author}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <div>
                      <p className="font-bold text-xl">{testimonials[currentTestimonial].author.split(",")[0]}</p>
                      <p className="text-neutral-500">{testimonials[currentTestimonial].author.split(",")[1]}</p>
                    </div>
                  </div>

                  <div className="md:w-2/3">
                    <div className="flex mb-6">
                      {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                        <svg key={i} className="h-6 w-6 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    <p className="text-3xl font-light italic mb-8">"{testimonials[currentTestimonial].text}"</p>

                    <div className="flex items-center gap-4">
                      <div className="h-px bg-neutral-200 flex-grow"></div>
                      <div className="flex gap-2">
                        {testimonials.map((_, index) => (
                          <button
                            key={index}
                            className={`w-3 h-3 rounded-full ${index === currentTestimonial ? "bg-blue-500" : "bg-neutral-200"}`}
                            onClick={() => setCurrentTestimonial(index)}
                          ></button>
                        ))}
                      </div>
                      <div className="h-px bg-neutral-200 flex-grow"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Integration */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6">
                  Карта
                </div>

                <h2 className="text-3xl md:text-5xl font-bold mb-6">Находите магазины на карте</h2>
                <p className="text-lg text-neutral-600 mb-8">
                  Интерактивная карта показывает все магазины с нужными запчастями. Выбирайте ближайшие точки и
                  прокладывайте маршрут.
                </p>

                <ul className="space-y-4 mb-8">
                  {[
                    "Визуальное отображение всех магазинов с запчастями",
                    "Фильтрация по цене, наличию и расстоянию",
                    "Построение маршрута до выбранного магазина",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full bg-green-50 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button className="rounded-full bg-blue-500 hover:bg-blue-600 text-white h-12 px-6">
                  Открыть карту
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-blue-500 rounded-full opacity-10"></div>
                <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-orange-500 rounded-full opacity-10"></div>

                <div className="relative z-10 rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    width={800}
                    height={600}
                    alt="Карта магазинов"
                    className="object-cover w-full h-auto"
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
                      <div className="absolute -inset-2 bg-orange-500 rounded-full animate-ping opacity-30"></div>
                      <div className="relative w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Info card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">Автозапчасти "Мотор"</h3>
                        <p className="text-sm text-neutral-600">ул. Автомобильная, 42</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full text-blue-500 border-blue-500">
                        Маршрут
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Suppliers */}
        <section id="for-suppliers" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="relative">
                  <div className="absolute -top-8 -left-8 w-32 h-32 bg-blue-500 rounded-full opacity-10"></div>
                  <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-orange-500 rounded-full opacity-10"></div>

                  <div className="relative z-10 rounded-3xl overflow-hidden shadow-xl">
                    <Image
                      src="/placeholder.svg?height=600&width=800"
                      width={800}
                      height={600}
                      alt="Автомагазин"
                      className="object-cover w-full h-auto"
                    />

                    {/* Stats overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                      <div className="grid grid-cols-3 gap-4 text-white">
                        <div className="text-center">
                          <p className="text-3xl font-bold">+40%</p>
                          <p className="text-sm opacity-80">Рост продаж</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold">+65%</p>
                          <p className="text-sm opacity-80">Новых клиентов</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold">-20%</p>
                          <p className="text-sm opacity-80">Расходов</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6">
                  Для бизнеса
                </div>

                <h2 className="text-3xl md:text-5xl font-bold mb-6">Для поставщиков автозапчастей</h2>

                <p className="text-lg text-neutral-600 mb-8">
                  Владеете магазином автозапчастей или СТО? Подключитесь к нашей системе и получайте новых клиентов
                  каждый день.
                </p>

                <ul className="space-y-4 mb-8">
                  {["Бесплатное подключение", "Интеграция с вашей системой учета", "Только целевые клиенты"].map(
                    (item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-green-50 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-neutral-700">{item}</span>
                      </li>
                    ),
                  )}
                </ul>

                <Button className="rounded-full bg-blue-500 hover:bg-blue-600 text-white h-12 px-6">
                  Стать партнером
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-blue-500 text-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Начните поиск запчастей прямо сейчас</h2>
              <p className="text-xl opacity-90 mb-8">
                Тысячи автовладельцев уже экономят время и деньги с нашим сервисом
              </p>

              <Button
                onClick={() => setShowSearchPanel(true)}
                className="bg-white text-blue-500 hover:bg-blue-50 rounded-full h-14 px-8 text-lg"
              >
                Найти запчасти
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-x-16 gap-y-8">
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">5000+</p>
                <p className="text-lg opacity-80">Магазинов</p>
              </div>

              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">1M+</p>
                <p className="text-lg opacity-80">Запчастей</p>
              </div>

              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">50K+</p>
                <p className="text-lg opacity-80">Клиентов</p>
              </div>

              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold">99%</p>
                <p className="text-lg opacity-80">Довольных</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full"></div>
                </div>
                <span className="text-xl font-bold tracking-tight">АвтоПоиск</span>
              </div>

              <p className="text-neutral-400 mb-6">Сервис поиска автозапчастей в наличии в вашем городе</p>

              <div className="space-y-3">
                <p className="text-sm flex items-center gap-2 text-neutral-400">
                  <Phone className="h-4 w-4 text-blue-400" /> 8 (800) 123-45-67
                </p>
                <p className="text-sm text-neutral-400">info@автозапчасти-поиск.рф</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Сервис</h3>
              <ul className="space-y-3">
                {["О проекте", "Как это работает", "Часто задаваемые вопросы", "Блог"].map((item, index) => (
                  <li key={index}>
                    <Link href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Для бизнеса</h3>
              <ul className="space-y-3">
                {["Для поставщиков", "Для магазинов", "Для СТО", "Рекламодателям"].map((item, index) => (
                  <li key={index}>
                    <Link href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Помощь</h3>
              <ul className="space-y-3">
                {["Поддержка", "Контакты", "Политика конфиденциальности", "Пользовательское соглашение"].map(
                  (item, index) => (
                    <li key={index}>
                      <Link href="#" className="text-neutral-400 hover:text-blue-400 transition-colors duration-300">
                        {item}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-sm text-neutral-500">
            <p>© {new Date().getFullYear()} АвтоПоиск. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
