import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import AOI from '@/models/AOI'
import Alert from '@/models/Alert'

// PATCH: Update AOI status (start/stop monitoring)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const { userId, status } = await request.json()
    const aoiId = params.id

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, status' },
        { status: 400 }
      )
    }

    if (!['active', 'paused', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, paused, or inactive' },
        { status: 400 }
      )
    }

    // Find and update the AOI
    const aoi = await AOI.findOne({ _id: aoiId, userId })
    
    if (!aoi) {
      return NextResponse.json(
        { error: 'AOI not found or you do not have permission to modify it' },
        { status: 404 }
      )
    }

    // Update the status
    aoi.status = status
    aoi.updatedAt = new Date()
    
    // If pausing, set a timestamp for when it was paused
    if (status === 'paused') {
      aoi.pausedAt = new Date()
    }
    
    // If activating, remove the paused timestamp and update last monitored
    if (status === 'active') {
      aoi.pausedAt = undefined
      aoi.lastMonitored = new Date()
    }

    await aoi.save()

    return NextResponse.json({
      success: true,
      message: `AOI monitoring ${status === 'active' ? 'started' : status === 'paused' ? 'paused' : 'stopped'}`,
      aoi: {
        id: aoi._id,
        name: aoi.name,
        status: aoi.status,
        updatedAt: aoi.updatedAt,
        lastMonitored: aoi.lastMonitored
      }
    })

  } catch (error) {
    console.error('Error updating AOI:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete AOI and all associated alerts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const { userId } = await request.json()
    const aoiId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Find the AOI to ensure user owns it
    const aoi = await AOI.findOne({ _id: aoiId, userId })
    
    if (!aoi) {
      return NextResponse.json(
        { error: 'AOI not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // Delete all alerts associated with this AOI
    await Alert.deleteMany({ aoiId: aoiId })

    // Delete the AOI
    await AOI.deleteOne({ _id: aoiId })

    return NextResponse.json({
      success: true,
      message: 'AOI and all associated alerts deleted successfully',
      deletedAOI: {
        id: aoi._id,
        name: aoi.name
      }
    })

  } catch (error) {
    console.error('Error deleting AOI:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get specific AOI details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const aoiId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    // Find the AOI
    const aoi = await AOI.findOne({ _id: aoiId, userId })
    
    if (!aoi) {
      return NextResponse.json(
        { error: 'AOI not found or you do not have permission to view it' },
        { status: 404 }
      )
    }

    // Get recent alerts for this AOI
    const recentAlerts = await Alert.find({ aoiId: aoiId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type severity confidence description createdAt status')

    return NextResponse.json({
      success: true,
      aoi: {
        id: aoi._id,
        name: aoi.name,
        description: aoi.description,
        geometry: aoi.geometry,
        alertType: aoi.alertType,
        threshold: aoi.threshold,
        status: aoi.status,
        area: aoi.area,
        notificationPreferences: aoi.notificationPreferences,
        createdAt: aoi.createdAt,
        updatedAt: aoi.updatedAt,
        lastMonitored: aoi.lastMonitored,
        pausedAt: aoi.pausedAt
      },
      recentAlerts: recentAlerts.map(alert => ({
        id: alert._id,
        type: alert.type,
        severity: alert.severity,
        confidence: alert.confidence,
        description: alert.description,
        time: alert.createdAt,
        status: alert.status
      }))
    })

  } catch (error) {
    console.error('Error fetching AOI details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

