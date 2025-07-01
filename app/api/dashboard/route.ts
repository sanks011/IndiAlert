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
    const aoiIds = aois.map(aoi => aoi._id)
    
    // Get user's alerts
    const alerts = await Alert.find({ aoiId: { $in: aoiIds } }).sort({ createdAt: -1 }).limit(10)
    
    // Calculate stats
    const totalAOIs = aois.length
    const activeAOIs = aois.filter(aoi => aoi.status === 'active').length
    const totalAlerts = await Alert.countDocuments({ aoiId: { $in: aoiIds } })
    const highPriorityAlerts = await Alert.countDocuments({ aoiId: { $in: aoiIds }, severity: 'high' })
    const mediumPriorityAlerts = await Alert.countDocuments({ aoiId: { $in: aoiIds }, severity: 'medium' })
    const lowPriorityAlerts = await Alert.countDocuments({ aoiId: { $in: aoiIds }, severity: 'low' })
    
    // Calculate new alerts from this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const newAlertsThisWeek = await Alert.countDocuments({ 
      aoiId: { $in: aoiIds }, 
      createdAt: { $gte: oneWeekAgo } 
    })
    
    // Calculate detection accuracy from alert confidence
    const avgConfidenceResult = await Alert.aggregate([
      { $match: { aoiId: { $in: aoiIds } } },
      { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } }
    ])
    const detectionAccuracy = avgConfidenceResult.length > 0 ? 
      Math.round(avgConfidenceResult[0].avgConfidence * 100) : 0
    
    // Calculate total area monitored
    const totalAreaMonitored = aois.reduce((sum, aoi) => sum + (aoi.area || 0), 0)

    // Get recent alerts with AOI details
    const recentAlertsWithAOI = await Alert.find({ aoiId: { $in: aoiIds } })
      .populate('aoiId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)

    const dashboardData = {
      stats: {
        activeAOIs,
        totalAlerts,
        areaMonitored: Math.round(totalAreaMonitored * 100) / 100,
        detectionAccuracy,
        newAlertsThisWeek
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
