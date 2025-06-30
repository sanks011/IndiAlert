"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Menu, X, Check, ChevronRight, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function MinimalAutoPartsSearch() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [city, setCity] = useState("Москва")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [activeSection, setActiveSection] = useState("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState(0)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Simulate geolocation detection
  const detectLocation = () => {
    setIsDetectingLocation(true)
    setTimeout(() => {
      setCity("Москва")
      setIsDetectingLocation(false)
    }, 1500)
  }

  useEffect(() => {
    // Focus search input on initial load
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This would handle the search in a real application
    alert("Поиск запчастей...")
  }

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const tabs = [
    { name: "Поиск", id: "search" },
    { name: "Как это работает", id: "how" },
    { name: "Для бизнеса", id: "business" },
  ]

  const faqItems = [
    {
      question: "Как быстро обновляется информация о наличии?",
      answer:
        "Информация о наличии запчастей обновляется в режиме реального времени. Магазины подключены к нашей системе и автоматически синхронизируют данные о товарах.",
    },
    {
      question: "Нужно ли регистрироваться для поиска?",
      answer:
        "Нет, базовый поиск доступен без регистрации. Однако зарегистрированные пользователи получают доступ к истории поиска, сохранению избранных магазинов и дополнительным фильтрам.",
    },
    {
      question: "Как связаться с магазином?",
      answer:
        "После поиска запчасти вы увидите список магазинов с контактной информацией. Вы можете позвонить напрямую по указанному номеру или запросить обратный звонок через наш сервис.",
    },
    {
      question: "Можно ли заказать доставку через ваш сервис?",
      answer:
        "Наш сервис предназначен для поиска запчастей в наличии. Вопросы доставки решаются напрямую с магазином. Некоторые из наших партнеров предлагают доставку, информация об этом указана в карточке магазина.",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* Main content */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left sidebar - navigation */}
        <div className="md:w-20 lg:w-24 border-r border-neutral-100 hidden md:flex flex-col items-center py-8">
          <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mb-12">
            <span className="text-white font-bold text-xl">A</span>
          </div>

          <div className="flex flex-col items-center gap-8">
            {tabs.map((tab, index) => (
              <button
                key={index}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  activeSection === tab.id
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                )}
                onClick={() => setActiveSection(tab.id)}
              >
                {index === 0 && <Search className="h-5 w-5" />}
                {index === 1 && <span className="font-medium">?</span>}
                {index === 2 && <span className="font-medium">B</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden border-b border-neutral-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-lg">АвтоПоиск</span>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {isMenuOpen && (
            <div className="mt-4 border-t border-neutral-100 pt-4">
              <div className="flex flex-col gap-4">
                {tabs.map((tab, index) => (
                  <button
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors",
                      activeSection === tab.id ? "bg-neutral-100 font-medium" : "text-neutral-600 hover:bg-neutral-50",
                    )}
                    onClick={() => {
                      setActiveSection(tab.id)
                      setIsMenuOpen(false)
                    }}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        activeSection === tab.id ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500",
                      )}
                    >
                      {index === 0 && <Search className="h-4 w-4" />}
                      {index === 1 && <span className="font-medium">?</span>}
                      {index === 2 && <span className="font-medium">B</span>}
                    </div>
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-auto">
          {activeSection === "search" && (
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">Найдите автозапчасти</h1>
                <p className="text-neutral-500 max-w-2xl">
                  Введите название или артикул запчасти, и мы мгновенно проверим наличие в магазинах вашего города
                </p>
              </div>

              <div className="mb-8">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Название или артикул запчасти"
                      className="h-14 pl-12 pr-4 rounded-xl border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  </div>

                  <div className="relative w-full md:w-48">
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-14 pl-12 pr-4 rounded-xl border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900"
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 text-neutral-400 hover:text-neutral-900"
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                    >
                      <span className="sr-only">Определить местоположение</span>
                      {isDetectingLocation ? (
                        <div className="h-4 w-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <Button type="submit" className="h-14 px-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white">
                    Найти
                  </Button>
                </form>
              </div>

              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Популярные запчасти</h2>
                  <Button variant="ghost" className="text-neutral-500 hover:text-neutral-900">
                    Все категории
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Тормозные колодки", "Масляный фильтр", "Аккумулятор", "Свечи зажигания"].map((item, index) => (
                    <button
                      key={index}
                      className="bg-neutral-50 hover:bg-neutral-100 transition-colors rounded-xl p-4 text-center h-24 flex items-center justify-center"
                      onClick={() => setSearchQuery(item)}
                    >
                      <span className="font-medium">{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-6">Последние поиски</h2>

                <div className="space-y-4">
                  {[
                    { query: "Тормозные колодки Toyota Camry", date: "2 часа назад" },
                    { query: "Масляный фильтр MANN", date: "5 часов назад" },
                    { query: "Аккумулятор Bosch 60Ah", date: "1 день назад" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="border border-neutral-100 rounded-xl p-4 hover:border-neutral-300 transition-colors cursor-pointer"
                      onClick={() => setSearchQuery(item.query)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.query}</p>
                          <p className="text-sm text-neutral-500">{item.date}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "how" && (
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">Как это работает</h1>
                <p className="text-neutral-500 max-w-2xl">
                  Наш сервис помогает быстро найти автозапчасти в наличии в магазинах вашего города
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    step: "01",
                    title: "Введите запрос",
                    description: "Укажите название или артикул запчасти, выберите город и радиус поиска",
                  },
                  {
                    step: "02",
                    title: "Получите результаты",
                    description: "Система мгновенно проверит наличие в тысячах магазинов вашего города",
                  },
                  {
                    step: "03",
                    title: "Выберите лучшее предложение",
                    description: "Сравните цены, расположение и наличие, свяжитесь напрямую с продавцом",
                  },
                ].map((step, index) => (
                  <div key={index} className="relative">
                    <div className="bg-neutral-50 rounded-xl p-6 h-full">
                      <div className="text-4xl font-bold text-neutral-200 mb-4">{step.step}</div>
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-neutral-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-16">
                <h2 className="text-2xl font-bold mb-6">Демонстрация работы</h2>

                <div className="bg-neutral-50 rounded-xl p-6">
                  <div className="aspect-video relative rounded-lg overflow-hidden">
                    <Image
                      src="/placeholder.svg?height=720&width=1280"
                      width={1280}
                      height={720}
                      alt="Демонстрация работы сервиса"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-neutral-900/80 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-16 border-l-white border-b-8 border-b-transparent ml-2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6">Часто задаваемые вопросы</h2>

                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "border border-neutral-200 rounded-xl overflow-hidden transition-all",
                        expandedFaq === index ? "bg-neutral-50" : "bg-white",
                      )}
                    >
                      <button
                        className="w-full p-4 flex items-center justify-between text-left"
                        onClick={() => toggleFaq(index)}
                      >
                        <span className="font-medium">{item.question}</span>
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            expandedFaq === index ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500",
                          )}
                        >
                          {expandedFaq === index ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </div>
                      </button>

                      {expandedFaq === index && <div className="p-4 pt-0 text-neutral-600">{item.answer}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "business" && (
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">Для бизнеса</h1>
                <p className="text-neutral-500 max-w-2xl">
                  Владеете магазином автозапчастей или СТО? Подключитесь к нашей системе и получайте новых клиентов
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 mb-16">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Преимущества подключения</h2>

                  <ul className="space-y-4">
                    {[
                      "Новые клиенты, которые целенаправленно ищут запчасти",
                      "Автоматическая синхронизация с вашей системой учета",
                      "Бесплатное подключение и простая интеграция",
                      "Аналитика и статистика по запросам в вашем регионе",
                      "Возможность настройки специальных предложений",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-neutral-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">Оставить заявку на подключение</h3>

                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Название компании</label>
                      <Input className="rounded-lg border-neutral-200" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input type="email" className="rounded-lg border-neutral-200" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Телефон</label>
                      <Input type="tel" className="rounded-lg border-neutral-200" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Город</label>
                      <Input className="rounded-lg border-neutral-200" />
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white h-12"
                    >
                      Отправить заявку
                    </Button>
                  </form>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-6">Истории успеха</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      name: 'Автомагазин "Мотор"',
                      location: "Москва",
                      quote:
                        "После подключения к сервису количество клиентов выросло на 30%. Особенно ценно, что приходят клиенты, которые точно знают, что им нужно.",
                      stats: "+30% клиентов",
                    },
                    {
                      name: 'СТО "АвтоМастер"',
                      location: "Санкт-Петербург",
                      quote:
                        "Сервис помог нам оптимизировать складские запасы. Теперь мы точно знаем, какие запчасти пользуются спросом, и не храним лишнее.",
                      stats: "-20% складских издержек",
                    },
                  ].map((story, index) => (
                    <div key={index} className="border border-neutral-200 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{story.name}</h3>
                          <p className="text-neutral-500">{story.location}</p>
                        </div>
                        <div className="bg-green-50 text-green-700 font-medium px-3 py-1 rounded-full text-sm">
                          {story.stats}
                        </div>
                      </div>

                      <p className="text-neutral-600 italic">"{story.quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar - stats and info */}
        <div className="md:w-72 lg:w-80 border-l border-neutral-100 hidden md:block p-6">
          <div className="sticky top-6">
            <div className="mb-8">
              <h3 className="font-bold mb-4">Статистика сервиса</h3>

              <div className="space-y-4">
                {[
                  { label: "Магазинов", value: "5,000+" },
                  { label: "Запчастей", value: "1M+" },
                  { label: "Запросов в день", value: "15K+" },
                  { label: "Городов", value: "300+" },
                ].map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-neutral-500">{stat.label}</span>
                    <span className="font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold mb-4">Популярные города</h3>

              <div className="space-y-2">
                {["Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Казань"].map((city, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors"
                    onClick={() => setCity(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">Нужна помощь?</h3>

              <div className="bg-neutral-50 rounded-xl p-4">
                <p className="text-sm text-neutral-600 mb-4">
                  Если у вас возникли вопросы по работе сервиса, свяжитесь с нашей поддержкой
                </p>

                <Button variant="outline" className="w-full rounded-lg border-neutral-300">
                  Написать в поддержку
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold">АвтоПоиск</span>
            </div>

            <div className="flex gap-6">
              <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                О сервисе
              </Link>
              <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                Условия использования
              </Link>
              <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                Конфиденциальность
              </Link>
              <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                Контакты
              </Link>
            </div>

            <div className="text-sm text-neutral-500">© {new Date().getFullYear()} АвтоПоиск</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
