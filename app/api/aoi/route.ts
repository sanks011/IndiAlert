import { NextRequest, NextResponse } from 'next/server'
import connectMongoDB from '@/lib/mongodb'
import AOI from '@/models/AOI'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      userId, 
      name, 
      description, 
      geometry, 
      alertType, 
      threshold, 
      notificationPreferences 
    } = data

    if (!userId || !name || !geometry || !alertType || !threshold || !notificationPreferences) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectMongoDB()

    // Create new AOI
    const newAOI = new AOI({
      userId,
      name,
      description,
      geometry,
      alertType,
      threshold,
      notificationPreferences,
      status: 'active'
    })

    // Calculate area
    newAOI.calculateArea()

    await newAOI.save()

    return NextResponse.json({
      message: 'AOI created successfully',
      aoi: {
        id: newAOI._id,
        name: newAOI.name,
        status: newAOI.status,
        alertType: newAOI.alertType,
        area: `${Math.round(newAOI.area)} km²`,
        createdAt: newAOI.createdAt,
        geometry: newAOI.geometry,
        threshold: newAOI.threshold,
        notificationPreferences: newAOI.notificationPreferences
      }
    })
  } catch (error) {
    console.error('AOI creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create AOI' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await connectMongoDB()

    const aois = await AOI.find({ userId }).sort({ createdAt: -1 })

    return NextResponse.json({
      aois: aois.map(aoi => ({
        id: aoi._id,
        name: aoi.name,
        status: aoi.status,
        alertType: aoi.alertType,
        area: `${Math.round(aoi.area)} km²`,
        createdAt: aoi.createdAt,
        lastMonitored: aoi.lastMonitored,
        geometry: aoi.geometry,
        threshold: aoi.threshold,
        notificationPreferences: aoi.notificationPreferences
      }))
    })
  } catch (error) {
    console.error('AOI fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AOIs' },
      { status: 500 }
    )
  }
}
