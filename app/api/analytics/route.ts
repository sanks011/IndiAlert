import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import AOI from '@/models/AOI'
import Alert from '@/models/Alert'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const timeRange = searchParams.get('timeRange') || '30' // days

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const userObjectId = new mongoose.Types.ObjectId(userId)
    const daysAgo = parseInt(timeRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Get all user's AOIs
    const userAOIs = await AOI.find({ userId: userObjectId })
    const aoiIds = userAOIs.map(aoi => aoi._id)

    // 1. Alert trends over time (daily)
    const alertTrends = await Alert.aggregate([
      {
        $match: {
          aoiId: { $in: aoiIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            severity: "$severity"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ])

    // 2. Alert distribution by type
    const alertTypeDistribution = await Alert.aggregate([
      {
        $match: {
          aoiId: { $in: aoiIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ])

    // 3. Alert severity distribution
    const severityDistribution = await Alert.aggregate([
      {
        $match: {
          aoiId: { $in: aoiIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 }
        }
      }
    ])

    // 4. AOI performance metrics
    const aoiPerformance = await Promise.all(
      userAOIs.map(async (aoi) => {
        const alertCount = await Alert.countDocuments({
          aoiId: aoi._id,
          createdAt: { $gte: startDate }
        })

        const highSeverityAlerts = await Alert.countDocuments({
          aoiId: aoi._id,
          severity: 'high',
          createdAt: { $gte: startDate }
        })

        const avgConfidence = await Alert.aggregate([
          {
            $match: {
              aoiId: aoi._id,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: null,
              avgConfidence: { $avg: "$confidence" }
            }
          }
        ])

        return {
          aoiId: aoi._id,
          name: aoi.name,
          alertType: aoi.alertType,
          area: aoi.area,
          status: aoi.status,
          totalAlerts: alertCount,
          highSeverityAlerts,
          avgConfidence: avgConfidence[0]?.avgConfidence || 0,
          lastMonitored: aoi.lastMonitored
        }
      })
    )

    // 5. Monthly summary statistics
    const monthlyStats = await Alert.aggregate([
      {
        $match: {
          aoiId: { $in: aoiIds },
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalAlerts: { $sum: 1 },
          highSeverity: {
            $sum: { $cond: [{ $eq: ["$severity", "high"] }, 1, 0] }
          },
          mediumSeverity: {
            $sum: { $cond: [{ $eq: ["$severity", "medium"] }, 1, 0] }
          },
          lowSeverity: {
            $sum: { $cond: [{ $eq: ["$severity", "low"] }, 1, 0] }
          },
          avgConfidence: { $avg: "$confidence" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ])

    // 6. Detection accuracy trends
    const accuracyTrends = await Alert.aggregate([
      {
        $match: {
          aoiId: { $in: aoiIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          avgConfidence: { $avg: "$confidence" },
          totalAlerts: { $sum: 1 },
          falsePositives: {
            $sum: { $cond: [{ $eq: ["$status", "false_positive"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ])

    // 7. Area monitoring coverage
    const totalAreaMonitored = userAOIs.reduce((sum, aoi) => sum + (aoi.area || 0), 0)
    const activeAOIs = userAOIs.filter(aoi => aoi.status === 'active').length
    const pausedAOIs = userAOIs.filter(aoi => aoi.status === 'paused').length

    // Format data for frontend consumption
    const response = {
      success: true,
      timeRange: daysAgo,
      summary: {
        totalAOIs: userAOIs.length,
        activeAOIs,
        pausedAOIs,
        totalAreaMonitored: Math.round(totalAreaMonitored * 100) / 100,
        totalAlerts: await Alert.countDocuments({
          aoiId: { $in: aoiIds },
          createdAt: { $gte: startDate }
        }),
        avgDetectionAccuracy: Math.round(
          (await Alert.aggregate([
            { $match: { aoiId: { $in: aoiIds }, createdAt: { $gte: startDate } } },
            { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } }
          ]))[0]?.avgConfidence * 100 || 0
        )
      },
      charts: {
        alertTrends: formatAlertTrends(alertTrends),
        alertTypeDistribution: alertTypeDistribution.map(item => ({
          type: item._id,
          count: item.count,
          label: formatAlertType(item._id)
        })),
        severityDistribution: severityDistribution.map(item => ({
          severity: item._id,
          count: item.count
        })),
        monthlyStats: monthlyStats.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          totalAlerts: item.totalAlerts,
          highSeverity: item.highSeverity,
          mediumSeverity: item.mediumSeverity,
          lowSeverity: item.lowSeverity,
          avgConfidence: Math.round(item.avgConfidence * 100)
        })),
        accuracyTrends: accuracyTrends.map(item => ({
          date: item._id,
          accuracy: Math.round(item.avgConfidence * 100),
          totalAlerts: item.totalAlerts,
          falsePositiveRate: item.totalAlerts > 0 ? Math.round((item.falsePositives / item.totalAlerts) * 100) : 0
        })),
        aoiPerformance: aoiPerformance.map(aoi => ({
          ...aoi,
          avgConfidence: Math.round(aoi.avgConfidence * 100)
        }))
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function formatAlertTrends(trends: any[]) {
  const trendMap = new Map()
  
  trends.forEach(trend => {
    const date = trend._id.date
    if (!trendMap.has(date)) {
      trendMap.set(date, { date, high: 0, medium: 0, low: 0, total: 0 })
    }
    const entry = trendMap.get(date)
    entry[trend._id.severity] = trend.count
    entry.total += trend.count
  })

  return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function formatAlertType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'deforestation': 'Deforestation',
    'urban_development': 'Urban Development',
    'water_body_change': 'Water Body Change',
    'land_use_change': 'Land Use Change'
  }
  return typeMap[type] || type
}
