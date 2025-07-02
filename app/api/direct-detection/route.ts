import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AOI from '@/models/AOI';
import Alert from '@/models/Alert';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Direct API route for change detection without complex subprocess handling
 */
export async function POST(request: NextRequest) {
  try {
    const { aoiId, userId, forceScan = false, config = {} } = await request.json();

    if (!aoiId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: aoiId, userId' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Find the AOI
    const aoi = await AOI.findOne({ _id: aoiId, userId });
    
    if (!aoi) {
      return NextResponse.json(
        { error: 'AOI not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${uuidv4().slice(0, 8)}`;
    
    // Prepare temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a simplified AOI data structure
    const aoiData = {
      aoi_id: aoi._id.toString(),
      user_id: userId,
      name: aoi.name,
      geometry: aoi.geometry,
      alertType: aoi.alertType || config.alertType || 'deforestation',
      threshold: aoi.threshold || config.threshold || 0.5,
      frequency: aoi.frequency || 'continuous',
      monitoringDates: {
        start: aoi.monitoringDates?.start?.toISOString() || new Date().toISOString(),
        end: aoi.monitoringDates?.end?.toISOString() || null
      }
    };
    
    // Write AOI data to a temporary file
    const tempFilePath = path.join(tempDir, `${jobId}.json`);
    const outputPath = path.join(tempDir, `${jobId}_result.json`);
    fs.writeFileSync(tempFilePath, JSON.stringify(aoiData, null, 2));
    
    // Create a dummy result for testing
    const dummyResult = {
      success: true,
      message: "Detection completed successfully",
      alert_data: {
        type: aoiData.alertType,
        severity: "medium",
        confidence: 0.85,
        description: `Change detected in ${aoi.name}`,
        detectedChange: true,
        images: {
          before: "placeholder_before.jpg",
          after: "placeholder_after.jpg",
          change: "placeholder_change.jpg"
        }
      }
    };
    
    // For now, just create a dummy result file
    fs.writeFileSync(outputPath, JSON.stringify(dummyResult, null, 2));
    
    // Store job status
    const jobStatusPath = path.join(tempDir, `${jobId}_status.json`);
    fs.writeFileSync(jobStatusPath, JSON.stringify({
      jobId,
      status: 'processing',
      progress: 0,
      aoiId: aoi._id.toString(),
      userId
    }, null, 2));
    
    // In a real implementation, this would call the Python ML model
    // but for now we'll use a timeout to simulate processing
    setTimeout(async () => {
      try {
        // In a production environment, you would:
        // 1. Check if the ML processing was successful
        // 2. Create a new alert based on the results
        
        const results = dummyResult;
        
        // Create a new alert
        const newAlert = new Alert({
          aoiId: aoi._id,
          userId: userId,
          type: results.alert_data.type,
          severity: results.alert_data.severity,
          confidence: results.alert_data.confidence,
          description: results.alert_data.description,
          detectedChange: results.alert_data.detectedChange,
          status: 'new',
          createdAt: new Date()
        });
        
        await newAlert.save();
        
        // Update job status to complete
        fs.writeFileSync(jobStatusPath, JSON.stringify({
          jobId,
          status: 'complete',
          progress: 100,
          aoiId: aoi._id.toString(),
          userId,
          results: {
            alertCreated: true,
            alertId: newAlert._id.toString()
          }
        }, null, 2));
        
        console.log(`Job ${jobId} completed successfully`);
      } catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        
        // Update job status to failed
        fs.writeFileSync(jobStatusPath, JSON.stringify({
          jobId,
          status: 'failed',
          progress: 0,
          aoiId: aoi._id.toString(),
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, null, 2));
      }
    }, 3000);
    
    return NextResponse.json({
      success: true,
      message: 'Change detection job started',
      jobId
    });
  } catch (error) {
    console.error('Error in change detection API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const aoiId = searchParams.get('aoiId');
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }
    
    if (jobId) {
      // Check job status
      const tempDir = path.join(process.cwd(), 'temp');
      const jobStatusPath = path.join(tempDir, `${jobId}_status.json`);
      
      if (fs.existsSync(jobStatusPath)) {
        const jobStatus = JSON.parse(fs.readFileSync(jobStatusPath, 'utf8'));
        return NextResponse.json(jobStatus);
      } else {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
    } else if (aoiId) {
      // Get all alerts for the AOI
      await dbConnect();
      const alerts = await Alert.find({ aoiId, userId }).sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        alerts
      });
    } else {
      return NextResponse.json(
        { error: 'Missing required field: jobId or aoiId' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in change detection API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
