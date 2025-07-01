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
import AOICreationModal from "@/components/aoi-creation-modal"

interface DashboardData {
  stats: {
    activeAOIs: number
    totalAlerts: number
    areaMonitored: number
    detectionAccuracy: number
    newAlertsThisWeek: number
  }
  aois: Array<{
    id: string
    name: string
    status: string
    alertType: string
    area: string
    alertCount: number
    lastUpdate: string
    createdAt: string
    geometry: any
    threshold: number
    notificationPreferences: any
  }>
  alerts: {
    recent: Array<{
      id: string
      aoiName: string
      type: string
      severity: string
      confidence: number
      description: string
      time: string
      status: string
    }>
    summary: {
      high: number
      medium: number
      low: number
      total: number
    }
  }
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAOIModal, setShowAOIModal] = useState(false)
  const [creatingAOI, setCreatingAOI] = useState(false)

  // Get user ID from localStorage (you might want to use a proper auth context)
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      // First try to get from userData (new format)
      const userData = localStorage.getItem('userData')
      if (userData) {
        try {
          const parsed = JSON.parse(userData)
          return parsed.id
        } catch (e) {
          console.error('Error parsing userData:', e)
        }
      }
      
      // Fallback: if user logged in with old format but no userData, they need to re-login
      const oldAuth = localStorage.getItem('indiAlert_auth')
      if (oldAuth) {
        console.log('Old auth format detected, user needs to re-login for dashboard access')
        return null
      }
    }
    return null
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const userId = getUserId()
      
      if (!userId) {
        setError('Please log in to view your dashboard. If you were previously logged in, please sign in again.')
        return
      }

      const response = await fetch(`/api/dashboard?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setDashboardData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAOI = async (aoiData: any) => {
    try {
      setCreatingAOI(true)
      const userId = getUserId()
      
      if (!userId) {
        throw new Error('Please log in to create an AOI')
      }

      const response = await fetch('/api/aoi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...aoiData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create AOI')
      }

      const result = await response.json()
      console.log('AOI created:', result)
      
      // Refresh dashboard data
      await fetchDashboardData()
      
      // Close modal
      setShowAOIModal(false)
      
      // Show success message (you can implement a toast notification here)
      alert('AOI created successfully! Monitoring has started.')
      
    } catch (err) {
      console.error('AOI creation error:', err)
      alert(err instanceof Error ? err.message : 'Failed to create AOI')
    } finally {
      setCreatingAOI(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#F0EDCF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B60B0] mx-auto mb-4"></div>
          <p className="text-[#F0EDCF]/70">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-[#F0EDCF] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            onClick={fetchDashboardData}
            className="bg-[#0B60B0] hover:bg-[#40A2D8] text-[#F0EDCF]"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-[#F0EDCF]">
      {/* Header */}
      <header className="border-b border-[#0B60B0]/30 bg-black/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0B60B0] to-[#40A2D8] bg-clip-text text-transparent">
              IndiAlert Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#F0EDCF]/80 hover:text-[#F0EDCF] hover:bg-[#0B60B0]/20 transition-all duration-200 border border-transparent hover:border-[#40A2D8]/30"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#F0EDCF]/80 hover:text-[#F0EDCF] hover:bg-[#0B60B0]/20 transition-all duration-200 border border-transparent hover:border-[#40A2D8]/30"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="text-[#F0EDCF]/80 hover:text-[#F0EDCF] hover:bg-[#0B60B0]/20 transition-all duration-200 border border-transparent hover:border-[#40A2D8]/30"
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
        <div className="flex gap-6 mb-8 border-b border-[#0B60B0]/30">
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
                "flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 font-medium",
                activeTab === tab.id
                  ? "border-[#0B60B0] text-[#0B60B0] bg-[#0B60B0]/10"
                  : "border-transparent text-[#F0EDCF]/70 hover:text-[#40A2D8] hover:border-[#40A2D8]/50"
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
              <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#F0EDCF]/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#F0EDCF]/70">Active AOIs</CardTitle>
                  <MapPin className="h-4 w-4 text-[#40A2D8]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F0EDCF]">{dashboardData?.stats.activeAOIs || 0}</div>
                  <p className="text-xs text-[#40A2D8] mt-1">Areas being monitored</p>
                </CardContent>
              </Card>

              <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#F0EDCF]/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#F0EDCF]/70">Total Alerts</CardTitle>
                  <Bell className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F0EDCF]">{dashboardData?.stats.totalAlerts || 0}</div>
                  <p className="text-xs text-red-400 mt-1">+{dashboardData?.stats.newAlertsThisWeek || 0} this week</p>
                </CardContent>
              </Card>

              <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#F0EDCF]/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#F0EDCF]/70">Area Monitored</CardTitle>
                  <Satellite className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F0EDCF]">{dashboardData?.stats.areaMonitored?.toLocaleString() || 0}</div>
                  <p className="text-xs text-[#F0EDCF]/50 mt-1">km² under monitoring</p>
                </CardContent>
              </Card>

              <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#F0EDCF]/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#F0EDCF]/70">Detection Accuracy</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#40A2D8]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#F0EDCF]">{dashboardData?.stats.detectionAccuracy || 0}%</div>
                  <p className="text-xs text-[#40A2D8] mt-1">AI model accuracy</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[#F0EDCF]">Recent Alerts</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-[#0B60B0] text-[#0B60B0] hover:bg-[#0B60B0] hover:text-[#F0EDCF] transition-all duration-200"
                    onClick={() => setActiveTab("alerts")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dashboardData?.alerts.recent.length === 0 ? (
                  <div className="text-center py-8 text-[#F0EDCF]/50">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-[#F0EDCF]/30" />
                    <p className="text-lg mb-2">No alerts yet</p>
                    <p className="text-sm">Create an AOI to start monitoring changes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.alerts.recent.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-[#F0EDCF]/5 border border-[#0B60B0]/20 hover:bg-[#F0EDCF]/10 hover:border-[#40A2D8]/40 transition-all duration-200"
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full mt-2",
                            alert.severity === "high" ? "bg-red-500" : 
                            alert.severity === "medium" ? "bg-yellow-500" : "bg-blue-500"
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-[#F0EDCF]">{alert.aoiName}</h4>
                            <span className="text-sm text-[#F0EDCF]/50">
                              {new Date(alert.time).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-[#40A2D8] mb-1 capitalize">{alert.type.replace('_', ' ')}</p>
                          <p className="text-sm text-[#F0EDCF]/70">{alert.description}</p>
                          <p className="text-xs text-[#F0EDCF]/50 mt-1">
                            Confidence: {Math.round(alert.confidence * 100)}%
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-[#F0EDCF]/70 hover:text-[#F0EDCF] hover:bg-[#0B60B0]/20 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* AOIs Tab */}
        {activeTab === "aois" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#F0EDCF]">My Areas of Interest</h2>
              <Button 
                onClick={() => setShowAOIModal(true)}
                className="bg-[#0B60B0] hover:bg-[#40A2D8] text-[#F0EDCF] border-0 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New AOI
              </Button>
            </div>

            {dashboardData?.aois.length === 0 ? (
              <div className="text-center py-16">
                <Map className="h-16 w-16 mx-auto mb-6 text-[#F0EDCF]/30" />
                <h3 className="text-xl font-semibold text-[#F0EDCF] mb-2">No AOIs Created Yet</h3>
                <p className="text-[#F0EDCF]/70 mb-6 max-w-md mx-auto">
                  Start monitoring changes in India by creating your first Area of Interest. 
                  Draw areas on the map and set up alert preferences.
                </p>
                <Button 
                  onClick={() => setShowAOIModal(true)}
                  className="bg-[#0B60B0] hover:bg-[#40A2D8] text-[#F0EDCF]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First AOI
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {dashboardData?.aois.map((aoi) => (
                  <Card key={aoi.id} className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#F0EDCF]/10 hover:shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-[#F0EDCF]">{aoi.name}</CardTitle>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium capitalize",
                            aoi.status === "active"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          )}
                        >
                          {aoi.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#F0EDCF]/70">Area:</span>
                          <span className="text-[#F0EDCF]">{aoi.area}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#F0EDCF]/70">Alert Type:</span>
                          <span className="text-[#40A2D8] capitalize">{aoi.alertType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#F0EDCF]/70">Threshold:</span>
                          <span className="text-[#F0EDCF]">{Math.round(aoi.threshold * 100)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#F0EDCF]/70">Last Update:</span>
                          <span className="text-[#F0EDCF]">
                            {new Date(aoi.lastUpdate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 border-[#0B60B0] text-[#0B60B0] hover:bg-[#0B60B0] hover:text-[#F0EDCF] transition-all duration-200"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-[#0B60B0] text-[#0B60B0] hover:bg-[#0B60B0] hover:text-[#F0EDCF] transition-all duration-200"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#F0EDCF]">Alert Management</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-[#0B60B0] text-[#0B60B0] hover:bg-[#0B60B0] hover:text-[#F0EDCF] transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  className="border-[#0B60B0] text-[#0B60B0] hover:bg-[#0B60B0] hover:text-[#F0EDCF] transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-red-500/10 border-red-500/30 hover:border-red-500/50 transition-all duration-200 hover:bg-red-500/15">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-red-400">{dashboardData?.alerts.summary.high || 0}</p>
                      <p className="text-sm text-red-300">High Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-200 hover:bg-yellow-500/15">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Bell className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">{dashboardData?.alerts.summary.medium || 0}</p>
                      <p className="text-sm text-yellow-300">Medium Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#40A2D8]/10 border-[#40A2D8]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#40A2D8]/15">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-[#40A2D8]" />
                    <div>
                      <p className="text-2xl font-bold text-[#40A2D8]">{dashboardData?.alerts.summary.low || 0}</p>
                      <p className="text-sm text-[#40A2D8]/80">Low Priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-[#F0EDCF]">All Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.alerts.recent.length === 0 ? (
                  <div className="text-center py-12 text-[#F0EDCF]/50">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-[#F0EDCF]/30" />
                    <h3 className="text-xl font-semibold text-[#F0EDCF] mb-2">No Alerts Yet</h3>
                    <p className="text-sm">Alerts will appear here when changes are detected in your AOIs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.alerts.recent.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-[#F0EDCF]/5 border border-[#0B60B0]/20 hover:bg-[#F0EDCF]/10 hover:border-[#40A2D8]/40 transition-all duration-200 hover:shadow-md"
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            alert.severity === "high" ? "bg-red-500" : 
                            alert.severity === "medium" ? "bg-yellow-500" : "bg-blue-500"
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-[#F0EDCF]">{alert.aoiName}</h4>
                            <span className="text-sm text-[#F0EDCF]/50">
                              {new Date(alert.time).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#40A2D8] capitalize">{alert.type.replace('_', ' ')}</span>
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium capitalize",
                                alert.severity === "high"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : alert.severity === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              )}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-[#F0EDCF]/50 text-xs">
                              {Math.round(alert.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-[#F0EDCF]/70 mt-1">{alert.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#F0EDCF]/70 hover:text-[#F0EDCF] hover:bg-[#0B60B0]/20 transition-all duration-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#F0EDCF]/70 hover:text-[#F0EDCF] hover:bg-[#0B60B0]/20 transition-all duration-200"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#F0EDCF]">Analytics & Reports</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#F0EDCF]/10">
                <CardHeader>
                  <CardTitle className="text-[#F0EDCF]">Change Detection Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-[#F0EDCF]/50 border border-[#0B60B0]/20 rounded-lg bg-[#F0EDCF]/3">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[#40A2D8]" />
                      <p>Chart placeholder - Analytics coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50 transition-all duration-200 hover:bg-[#F0EDCF]/10">
                <CardHeader>
                  <CardTitle className="text-[#F0EDCF]">Alert Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-[#F0EDCF]/50 border border-[#0B60B0]/20 rounded-lg bg-[#F0EDCF]/3">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-[#40A2D8]" />
                      <p>Chart placeholder - Analytics coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* AOI Creation Modal */}
      <AOICreationModal
        isOpen={showAOIModal}
        onClose={() => setShowAOIModal(false)}
        onSubmit={handleCreateAOI}
        isLoading={creatingAOI}
      />
    </div>
  )
}
