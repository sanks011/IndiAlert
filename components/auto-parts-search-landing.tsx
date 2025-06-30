"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, MapPin, Clock, Phone, Shield, Filter, FileText, Star, Menu, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

export default function AutoPartsSearchLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [city, setCity] = useState("Москва")
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

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
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This would handle the search in a real application
    alert("Поиск запчастей...")
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">АвтоЗапчасти.Поиск</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary">
              Как это работает
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-primary">
              Отзывы
            </Link>
            <Link href="#for-suppliers" className="text-sm font-medium hover:text-primary">
              Для поставщиков
            </Link>
            <Button>Войти</Button>
          </nav>

          {/* Mobile Navigation Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="container md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <Link
                href="#how-it-works"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Как это работает
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Отзывы
              </Link>
              <Link
                href="#for-suppliers"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Для поставщиков
              </Link>
              <Button className="w-full">Войти</Button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section with Search Form */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white z-0"></div>
          <div className="container relative z-10 py-12 md:py-24 lg:py-32">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Найдите автозапчасти в вашем городе за 1 минуту!
                </h1>
                <p className="text-xl text-muted-foreground">Проверяйте наличие в магазинах и сервисах рядом с вами</p>
              </div>
              <div className="relative">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  width={600}
                  height={400}
                  alt="Автомеханик ищет запчасти"
                  className="rounded-lg object-cover shadow-lg"
                />
              </div>
            </div>

            {/* Search Form */}
            <Card className="mt-8 md:mt-12">
              <CardHeader>
                <CardTitle>Найдите нужную запчасть прямо сейчас</CardTitle>
                <CardDescription>Введите название или артикул запчасти, выберите город и радиус поиска</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label htmlFor="part" className="text-sm font-medium mb-1 block">
                      Название запчасти
                    </label>
                    <Input id="part" placeholder="Например, тормозные колодки" className="w-full" required />
                  </div>

                  <div>
                    <label htmlFor="city" className="text-sm font-medium mb-1 block">
                      Ваш город
                    </label>
                    <div className="relative">
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                    {isDetectingLocation && (
                      <p className="text-xs text-muted-foreground mt-1">Определяем ваш город...</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="radius" className="text-sm font-medium mb-1 block">
                      Радиус поиска
                    </label>
                    <Select defaultValue="30">
                      <SelectTrigger id="radius">
                        <SelectValue placeholder="Выберите радиус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 км</SelectItem>
                        <SelectItem value="30">30 км</SelectItem>
                        <SelectItem value="50">50 км</SelectItem>
                        <SelectItem value="100">100 км</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-4">
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                      <Search className="mr-2 h-4 w-4" /> Найти запчасти
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Service Description */}
        <section className="container py-12 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Сервис мгновенного поиска автозапчастей</h2>
            <p className="text-lg text-muted-foreground">
              Сервис мгновенно показывает, где в вашем городе есть нужные автозапчасти. Экономьте время — не
              обзванивайте магазины, не ждите доставки!
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">Актуальные данные о наличии</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Обновляем информацию о наличии запчастей в режиме реального времени
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">Прямые контакты продавцов</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Звоните напрямую в магазины без посредников и дополнительных комиссий
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                  <Filter className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">Фильтры по цене и брендам</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Сортируйте результаты по цене, расстоянию, бренду и другим параметрам
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">Поиск по OEM и VIN-коду</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Находите оригинальные и совместимые запчасти по коду производителя
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-muted py-12 md:py-24">
          <div className="container">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Как это работает</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                    1
                  </div>
                  <CardTitle>Введите запчасть и город</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Укажите название или артикул запчасти, выберите город и радиус поиска
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                    2
                  </div>
                  <CardTitle>Сервис проверяет базу магазинов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Наша система мгновенно проверяет наличие запчастей в тысячах магазинов вашего города
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                    3
                  </div>
                  <CardTitle>Получите список адресов, цен и телефонов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Выбирайте лучшее предложение по цене и расположению, звоните напрямую продавцу
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Popular Parts */}
        <section className="container py-12 md:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">Популярные запчасти</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              "Аккумуляторы",
              "Масляные фильтры",
              "Воздушные фильтры",
              "Тормозные колодки",
              "Ремни ГРМ",
              "Свечи зажигания",
            ].map((part, index) => (
              <Card key={index} className="text-center hover:border-primary cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <p className="font-medium">{part}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Map Integration Placeholder */}
        <section className="container py-12">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">Магазины на карте</h2>

          <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center border">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Интерактивная карта магазинов</p>
              <p className="text-muted-foreground">Здесь будет отображаться карта с магазинами автозапчастей</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="bg-muted py-12 md:py-24">
          <div className="container">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Отзывы пользователей</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="italic mb-4">
                    "Нашел глушитель за полцены в соседнем районе — спас сервис! Не пришлось ждать доставку из другого
                    города."
                  </p>
                  <p className="font-medium">Иван, Москва</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="italic mb-4">
                    "Срочно нужны были тормозные колодки. Через сервис нашел в магазине в 15 минутах от дома. Очень
                    удобно!"
                  </p>
                  <p className="font-medium">Алексей, Санкт-Петербург</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="italic mb-4">
                    "Экономит кучу времени! Раньше обзванивала все магазины, теперь просто ввожу запчасть и вижу, где
                    есть в наличии."
                  </p>
                  <p className="font-medium">Елена, Екатеринбург</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="container py-12 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8">Наши партнеры</h2>

          <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
            {[1, 2, 3, 4, 5].map((partner) => (
              <div key={partner} className="h-12 w-32 bg-muted rounded flex items-center justify-center">
                <span className="text-muted-foreground font-medium">Партнер {partner}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Second CTA */}
        <section className="bg-primary text-primary-foreground py-12 md:py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Не откладывайте — найдите запчасть сейчас!</h2>
              <p className="text-lg opacity-90">Тысячи автовладельцев уже экономят время и деньги с нашим сервисом</p>
            </div>

            <Card className="bg-background text-foreground max-w-3xl mx-auto">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
                  <Input placeholder="Название запчасти" className="w-full" required />

                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="w-full" required />

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    <Search className="mr-2 h-4 w-4" /> Найти
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Suppliers */}
        <section id="for-suppliers" className="container py-12 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Для поставщиков автозапчастей</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Владеете магазином автозапчастей или СТО? Подключитесь к нашей системе и получайте новых клиентов каждый
                день.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Бесплатное подключение</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Интеграция с вашей системой учета</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>Только целевые клиенты</span>
                </li>
              </ul>
              <Button className="gap-2">
                Стать партнером <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=400&width=600"
                width={600}
                height={400}
                alt="Автомагазин"
                className="rounded-lg object-cover shadow-lg"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="container py-8 md:py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">АвтоЗапчасти.Поиск</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Сервис поиска автозапчастей в наличии в вашем городе</p>
              <div className="space-y-2">
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" /> 8 (800) 123-45-67
                </p>
                <p className="text-sm">info@автозапчасти-поиск.рф</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Сервис</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    О проекте
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Как это работает
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Часто задаваемые вопросы
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Блог
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Для бизнеса</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Для поставщиков
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Для магазинов
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Для СТО
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Рекламодателям
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Помощь</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Поддержка
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Контакты
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Пользовательское соглашение
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} АвтоЗапчасти.Поиск. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
