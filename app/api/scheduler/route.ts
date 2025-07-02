import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import AOI from '@/models/AOI'

/**
 * This API endpoint handles scheduling of AOI monitoring jobs
 * It can be triggered by a cron job to automatically scan all active AOIs
 * Only authenticated admins should be able to access this endpoint in production
 */
export async function POST(request: NextRequest) {
  try {
    // In a production system, you would authenticate the request
    // to ensure only authorized admins/systems can trigger this
    
    const { scheduleAll = false } = await request.json()
    
    await dbConnect()
    
    // Find all active AOIs that should be monitored
    // In a real implementation, you would also check when they were last monitored
    // to avoid scanning too frequently
    const query = { status: 'active' }
    
    // If scheduleAll is true, include paused AOIs as well
    if (scheduleAll) {
      query.status = { $in: ['active', 'paused'] }
    }
    
    const aois = await AOI.find(query)
    
    if (aois.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active AOIs found for scheduling',
        scheduledCount: 0
      })
    }
    
    // In a real implementation, this would:
    // 1. Submit each AOI to the processing queue
    // 2. Log the scheduling time
    // 3. Update the lastScheduled field on each AOI
    
    // For now, we'll just simulate this
    const scheduledJobs = aois.map(aoi => ({
      aoiId: aoi._id,
      name: aoi.name,
      jobId: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }))
    
    // Update the lastScheduled time for all the AOIs
    // In a production system with many AOIs, use bulkWrite for efficiency
    await Promise.all(
      aois.map(aoi => {
        aoi.lastMonitored = new Date()
        return aoi.save()
      })
    )
    
    return NextResponse.json({
      success: true,
      message: `Scheduled ${aois.length} AOIs for monitoring`,
      scheduledCount: aois.length,
      scheduledJobs
    })
    
  } catch (error) {
    console.error('Error in job scheduler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
