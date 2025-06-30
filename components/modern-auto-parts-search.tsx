"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, ArrowRight, Menu, X, Check, Car, Settings, Clock, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function ModernAutoPartsSearch() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [city, setCity] = useState("Москва")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const searchRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          scrolled ? "bg-white shadow-sm py-3" : "bg-transparent py-5",
        )}
      >
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">АвтоЗапчасти</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
            >
              Как это работает
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
            >
              Отзывы
            </Link>
            <Link
              href="#for-suppliers"
              className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
            >
              Для поставщиков
            </Link>
            <Button variant="outline" className="rounded-full">
              Войти
            </Button>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700">Регистрация</Button>
          </nav>

          {/* Mobile Navigation Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="container md:hidden py-4 bg-white absolute left-0 right-0 top-full shadow-lg">
            <nav className="flex flex-col gap-4">
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Как это работает
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Отзывы
              </Link>
              <Link
                href="#for-suppliers"
                className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Для поставщиков
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button variant="outline" className="w-full rounded-full">
                  Войти
                </Button>
                <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700">Регистрация</Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[#F5F9FF] -skew-y-6 origin-top-left transform-gpu h-[120%] -translate-y-[10%]"></div>

          <div className="container relative z-10 py-16 md:py-24 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6 max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  Быстрый поиск автозапчастей
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900">
                  Найдите нужные запчасти <span className="text-blue-600">за минуту</span>
                </h1>

                <p className="text-xl text-neutral-600">
                  Мгновенно проверяйте наличие автозапчастей в магазинах вашего города и сравнивайте цены
                </p>

                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={scrollToSearch}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-base h-12 px-6"
                  >
                    Найти запчасти
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button variant="outline" className="rounded-full text-base h-12 px-6">
                    Как это работает
                  </Button>
                </div>

                <div className="flex flex-wrap gap-8 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-neutral-700">5000+ магазинов</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-neutral-700">Актуальные цены</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-neutral-700">Экономия времени</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-blue-50 rounded-full blur-3xl opacity-70"></div>
                <div className="relative">
                  <Image
                    src="/placeholder.svg?height=600&width=600"
                    width={600}
                    height={600}
                    alt="Автозапчасти"
                    className="object-cover rounded-2xl shadow-lg"
                  />

                  <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lg p-4 max-w-[240px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Быстрый результат</span>
                    </div>
                    <p className="text-sm text-neutral-600">Среднее время поиска запчасти — 47 секунд</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Form */}
        <section ref={searchRef} className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">Найдите нужную запчасть прямо сейчас</h2>
                <p className="text-neutral-600">
                  Введите название или артикул запчасти, выберите город и радиус поиска
                </p>
              </div>

              <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
                <CardContent className="p-0">
                  <div className="bg-blue-600 p-4 md:p-6">
                    <div className="flex flex-wrap gap-4 mb-4">
                      <Button
                        variant={activeTab === "all" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("all")}
                        className={cn(
                          "rounded-full text-sm",
                          activeTab === "all" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500",
                        )}
                      >
                        Все запчасти
                      </Button>
                      <Button
                        variant={activeTab === "original" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("original")}
                        className={cn(
                          "rounded-full text-sm",
                          activeTab === "original" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500",
                        )}
                      >
                        Оригинальные
                      </Button>
                      <Button
                        variant={activeTab === "analog" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("analog")}
                        className={cn(
                          "rounded-full text-sm",
                          activeTab === "analog" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500",
                        )}
                      >
                        Аналоги
                      </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-12">
                      <div className="md:col-span-5 relative">
                        <Input
                          placeholder="Название или артикул запчасти"
                          className="h-12 rounded-full bg-white/90 border-0 pl-12 pr-4"
                          required
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      </div>

                      <div className="md:col-span-3 relative">
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-12 rounded-full bg-white/90 border-0 pl-12 pr-4"
                          required
                        />
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-neutral-400 hover:text-blue-600"
                          onClick={detectLocation}
                          disabled={isDetectingLocation}
                        >
                          <span className="sr-only">Определить местоположение</span>
                          {isDetectingLocation ? (
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="md:col-span-2">
                        <Select defaultValue="30">
                          <SelectTrigger className="h-12 rounded-full bg-white/90 border-0">
                            <SelectValue placeholder="Радиус" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 км</SelectItem>
                            <SelectItem value="30">30 км</SelectItem>
                            <SelectItem value="50">50 км</SelectItem>
                            <SelectItem value="100">100 км</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          className="w-full h-12 rounded-full bg-white text-blue-600 hover:bg-blue-50"
                        >
                          Найти
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="p-4 md:p-6 bg-white">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-neutral-500">Популярные запросы:</span>
                      {["Тормозные колодки", "Масляный фильтр", "Аккумулятор", "Свечи зажигания"].map((item, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="h-auto py-1 px-3 text-sm rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        >
                          {item}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Почему выбирают наш сервис</h2>
              <p className="text-lg text-neutral-600">
                Мы создали удобный инструмент для быстрого поиска автозапчастей, который экономит ваше время и деньги
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Clock className="h-6 w-6 text-blue-600" />,
                  title: "Экономия времени",
                  description: "Не нужно обзванивать десятки магазинов. Все результаты в одном месте за секунды.",
                },
                {
                  icon: <Settings className="h-6 w-6 text-blue-600" />,
                  title: "Актуальные данные",
                  description: "Информация о наличии и ценах обновляется в режиме реального времени.",
                },
                {
                  icon: <Phone className="h-6 w-6 text-blue-600" />,
                  title: "Прямой контакт",
                  description: "Звоните напрямую в магазины без посредников и дополнительных комиссий.",
                },
              ].map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-[#F5F9FF] rounded-2xl p-8 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                      {feature.icon}
                    </div>

                    <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-neutral-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 md:py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Как это работает</h2>
              <p className="text-lg text-neutral-600">
                Всего три простых шага для поиска нужной запчасти по лучшей цене
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-24 left-[calc(16.67%+8px)] right-[calc(16.67%+8px)] h-0.5 bg-neutral-200"></div>

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
                  <div className="bg-white rounded-2xl p-8 h-full shadow-sm border border-neutral-100">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl">
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
          </div>
        </section>

        {/* Popular Parts */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Популярные категории запчастей</h2>
              <p className="text-lg text-neutral-600">Быстрый доступ к самым востребованным категориям автозапчастей</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  name: "Тормозная система",
                  image: "/placeholder.svg?height=200&width=200",
                },
                {
                  name: "Фильтры",
                  image: "/placeholder.svg?height=200&width=200",
                },
                {
                  name: "Аккумуляторы",
                  image: "/placeholder.svg?height=200&width=200",
                },
                {
                  name: "Масла и жидкости",
                  image: "/placeholder.svg?height=200&width=200",
                },
                {
                  name: "Подвеска",
                  image: "/placeholder.svg?height=200&width=200",
                },
                {
                  name: "Электрика",
                  image: "/placeholder.svg?height=200&width=200",
                },
              ].map((category, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="bg-[#F5F9FF] rounded-2xl p-4 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                    <div className="mb-4 aspect-square rounded-xl overflow-hidden">
                      <Image
                        src={category.image || "/placeholder.svg"}
                        width={200}
                        height={200}
                        alt={category.name}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="font-medium">{category.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map Integration */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Находите магазины на карте</h2>
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

                <Button className="rounded-full bg-blue-600 hover:bg-blue-700">Открыть карту</Button>
              </div>

              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    width={800}
                    height={600}
                    alt="Карта магазинов"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">Автозапчасти "Мотор"</h3>
                        <p className="text-sm text-neutral-600">ул. Автомобильная, 42</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full">
                        Маршрут
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24 bg-white">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Отзывы пользователей</h2>
              <p className="text-lg text-neutral-600">Что говорят о нашем сервисе те, кто уже нашел нужные запчасти</p>
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
                  className="bg-[#F5F9FF] rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <svg key={i} className="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="italic mb-6 text-neutral-700">"{testimonial.text}"</p>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-bold text-blue-600">{testimonial.author[0]}</span>
                    </div>
                    <p className="font-medium">{testimonial.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">Наши партнеры</h2>
              <p className="text-neutral-600">Сотрудничаем с ведущими поставщиками автозапчастей</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 items-center">
              {[1, 2, 3, 4, 5].map((partner) => (
                <div key={partner} className="h-16 w-40 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <span className="text-neutral-400 font-medium">Партнер {partner}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Second CTA */}
        <section className="py-16 md:py-24 bg-blue-600 text-white">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Не откладывайте — найдите запчасть сейчас!</h2>
              <p className="text-xl opacity-90 mb-8">
                Тысячи автовладельцев уже экономят время и деньги с нашим сервисом
              </p>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Input placeholder="Название запчасти" className="h-12 rounded-full pl-12" required />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  </div>

                  <div className="relative">
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-12 rounded-full pl-12"
                      required
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  </div>

                  <Button type="submit" className="h-12 rounded-full bg-blue-600 hover:bg-blue-700">
                    <Search className="mr-2 h-5 w-5" /> Найти
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* For Suppliers */}
        <section id="for-suppliers" className="py-16 md:py-24">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6">
                  Для бизнеса
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-6">Для поставщиков автозапчастей</h2>

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

                <Button className="rounded-full bg-blue-600 hover:bg-blue-700">
                  Стать партнером <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    width={800}
                    height={600}
                    alt="Автомагазин"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">Увеличьте продажи</h3>
                        <p className="text-sm text-neutral-600">Привлекайте новых клиентов через нашу платформу</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full">
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-16">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Car className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">АвтоЗапчасти</span>
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
            <p>© {new Date().getFullYear()} АвтоЗапчасти.Поиск. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
