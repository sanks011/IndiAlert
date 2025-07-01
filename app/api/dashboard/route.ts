import { NextRequest, NextResponse } from 'next/server'
import connectMongoDB from '@/lib/mongodb'
import AOI from '@/models/AOI'
import Alert from '@/models/Alert'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await connectMongoDB()

    // Get user's AOIs
    const aois = await AOI.find({ userId }).sort({ createdAt: -1 })
    
    // Get user's alerts
    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).limit(10)
    
    // Calculate stats
    const totalAOIs = aois.length
    const activeAOIs = aois.filter(aoi => aoi.status === 'active').length
    const totalAlerts = await Alert.countDocuments({ userId })
    const highPriorityAlerts = await Alert.countDocuments({ userId, severity: 'high' })
    const mediumPriorityAlerts = await Alert.countDocuments({ userId, severity: 'medium' })
    const lowPriorityAlerts = await Alert.countDocuments({ userId, severity: 'low' })
    const newAlerts = await Alert.countDocuments({ userId, status: 'new' })
    
    // Calculate total area monitored
    const totalAreaMonitored = aois.reduce((sum, aoi) => sum + (aoi.area || 0), 0)

    // Get recent alerts with AOI details
    const recentAlertsWithAOI = await Alert.find({ userId })
      .populate('aoiId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)

    const dashboardData = {
      stats: {
        activeAOIs,
        totalAlerts,
        areaMonitored: Math.round(totalAreaMonitored),
        detectionAccuracy: 98.2, // This would come from your AI model metrics
        newAlertsThisWeek: newAlerts
      },
      aois: aois.map(aoi => ({
        id: aoi._id,
        name: aoi.name,
        status: aoi.status,
        alertType: aoi.alertType,
        area: `${Math.round(aoi.area)} km²`,
        alertCount: 0, // Will be populated by aggregation
        lastUpdate: aoi.lastMonitored,
        createdAt: aoi.createdAt,
        geometry: aoi.geometry,
        threshold: aoi.threshold,
        notificationPreferences: aoi.notificationPreferences
      })),
      alerts: {
        recent: recentAlertsWithAOI.map(alert => ({
          id: alert._id,
          aoiName: alert.aoiId?.name || 'Unknown AOI',
          type: alert.type,
          severity: alert.severity,
          confidence: alert.confidence,
          description: alert.description,
          time: alert.createdAt,
          status: alert.status
        })),
        summary: {
          high: highPriorityAlerts,
          medium: mediumPriorityAlerts,
          low: lowPriorityAlerts,
          total: totalAlerts
        }
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
