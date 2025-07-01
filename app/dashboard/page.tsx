"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  Download,
  Eye,
  Home,
  Map,
  MapPin,
  Plus,
  Satellite,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const sampleAOIs = [
    {
      id: 1,
      name: "Amazon Forest - Block A",
      status: "Active",
      alerts: 3,
      lastUpdate: "2 hours ago",
      area: "2,450 km²",
    },
    {
      id: 2,
      name: "Delhi Urban Expansion",
      status: "Active",
      alerts: 1,
      lastUpdate: "5 hours ago",
      area: "890 km²",
    },
    {
      id: 3,
      name: "Coastal Erosion - Mumbai",
      status: "Paused",
      alerts: 0,
      lastUpdate: "1 day ago",
      area: "156 km²",
    },
  ]

  const recentAlerts = [
    {
      id: 1,
      aoi: "Amazon Forest - Block A",
      type: "Deforestation",
      severity: "High",
      time: "2 hours ago",
      description: "Significant tree cover loss detected in sector 7",
    },
    {
      id: 2,
      aoi: "Delhi Urban Expansion",
      type: "Urban Growth",
      severity: "Medium",
      time: "5 hours ago",
      description: "New construction activity identified in monitored zone",
    },
    {
      id: 3,
      aoi: "Amazon Forest - Block A",
      type: "Road Construction",
      severity: "High",
      time: "1 day ago",
      description: "Unauthorized road development detected",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">IndiAlert Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={() => window.location.href = "/"}
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-6 mb-8 border-b border-white/10">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "aois", label: "My AOIs", icon: Map },
            { id: "alerts", label: "Alerts", icon: AlertTriangle },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-white/70 hover:text-white"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">Active AOIs</CardTitle>
                  <MapPin className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-green-400 mt-1">+2 from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">Total Alerts</CardTitle>
                  <Bell className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47</div>
                  <p className="text-xs text-red-400 mt-1">+8 this week</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">Area Monitored</CardTitle>
                  <Satellite className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15,890</div>
                  <p className="text-xs text-white/50 mt-1">km² under monitoring</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-white/70">Detection Accuracy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.2%</div>
                  <p className="text-xs text-blue-400 mt-1">+0.3% improvement</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Alerts</CardTitle>
                  <Button variant="outline" size="sm" className="border-white/20 text-white">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full mt-2",
                          alert.severity === "High" ? "bg-red-500" : "bg-yellow-500"
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{alert.aoi}</h4>
                          <span className="text-sm text-white/50">{alert.time}</span>
                        </div>
                        <p className="text-sm text-blue-400 mb-1">{alert.type}</p>
                        <p className="text-sm text-white/70">{alert.description}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AOIs Tab */}
        {activeTab === "aois" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Areas of Interest</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New AOI
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sampleAOIs.map((aoi) => (
                <Card key={aoi.id} className="bg-white/5 border-white/10">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{aoi.name}</CardTitle>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs",
                          aoi.status === "Active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {aoi.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Area:</span>
                        <span>{aoi.area}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Alerts:</span>
                        <span className={aoi.alerts > 0 ? "text-red-400" : "text-green-400"}>
                          {aoi.alerts}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Last Update:</span>
                        <span>{aoi.lastUpdate}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1 border-white/20">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="border-white/20">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Alert Management</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/20">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" className="border-white/20">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-red-400">8</p>
                      <p className="text-sm text-red-300">High Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Bell className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">15</p>
                      <p className="text-sm text-yellow-300">Medium Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-blue-400">24</p>
                      <p className="text-sm text-blue-300">Low Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>All Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.concat(recentAlerts).map((alert, index) => (
                    <div
                      key={`${alert.id}-${index}`}
                      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          alert.severity === "High" ? "bg-red-500" : "bg-yellow-500"
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{alert.aoi}</h4>
                          <span className="text-sm text-white/50">{alert.time}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-400">{alert.type}</span>
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs",
                              alert.severity === "High"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            )}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">{alert.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics & Reports</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle>Change Detection Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-white/50">
                    Chart placeholder - Analytics coming soon
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle>Alert Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-white/50">
                    Chart placeholder - Analytics coming soon
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
