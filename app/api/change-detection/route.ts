import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import AOI from '@/models/AOI'
import Alert from '@/models/Alert'
import { exec, spawn } from 'child_process'
import path from 'path'
import { promisify } from 'util'
import fs from 'fs'
import nodemailer from 'nodemailer'

// Promisify exec for easier async/await usage
const execPromise = promisify(exec)

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'sankalpasarkar68@gmail.com', // Sender email
    pass: 'pcodreihfulbfnlt' // App-specific password
  }
})

// Process a single AOI for change detection
export async function POST(request: NextRequest) {
  try {
    const { aoiId, userId, forceScan = false, config = {} } = await request.json()

    if (!aoiId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: aoiId, userId' },
        { status: 400 }
      )
    }

    await dbConnect()
    
    // Find the AOI
    const aoi = await AOI.findOne({ _id: aoiId, userId })
    
    if (!aoi) {
      return NextResponse.json(
        { error: 'AOI not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    // Check if AOI is active
    if (aoi.status !== 'active' && !forceScan) {
      return NextResponse.json(
        { error: 'AOI is not active. Set forceScan=true to scan anyway.' },
        { status: 400 }
      )
    }
    
    // Prepare the configuration for the Python module
    const pythonConfig = {
      alertType: config.alertType || aoi.alertType || 'deforestation',
      threshold: config.threshold || aoi.threshold || 0.5,
      useCustomDateRange: config.useCustomDateRange || false,
      customDates: config.useCustomDateRange ? {
        startDate: config.customDates?.startDate,
        endDate: config.customDates?.endDate || new Date().toISOString()
      } : null
    }
    
    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    // In a production implementation, we would:
    // 1. Submit a job to a processing queue with Python module integration
    // 2. Have a worker process that picks up the job and runs the Python code
    // 3. The worker would update the job status in the database
    // 4. Once complete, save alert data to the database
    
    // Execute the Python module for real-time detection
    try {
      // Prepare the temp directory if it doesn't exist
      const tempDir = path.join(process.cwd(), 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      // Prepare AOI data for the Python module with custom date handling
      const aoiData: any = {
        geometry: aoi.geometry,
        alertType: pythonConfig.alertType,
        threshold: pythonConfig.threshold,
        aoi_id: aoi._id.toString(),
        user_id: userId,
        frequency: aoi.frequency || 'continuous'
      }

      // Add custom date range if provided in the request
      if (pythonConfig.useCustomDateRange && pythonConfig.customDates) {
        aoiData.customDates = {
          startDate: pythonConfig.customDates.startDate,
          endDate: pythonConfig.customDates.endDate
        }
      } 
      // Otherwise use the AOI's monitoring dates if available
      else if (aoi.monitoringDates && aoi.monitoringDates.start) {
        aoiData.customDates = {
          startDate: aoi.monitoringDates.start.toISOString(),
          endDate: aoi.monitoringDates.end ? aoi.monitoringDates.end.toISOString() : null
        }
        console.log('Using AOI monitoring dates:', aoiData.customDates)
      }
      
      // Write AOI data to a temporary JSON file
      const tempFilePath = path.join(tempDir, `${jobId}.json`)
      fs.writeFileSync(tempFilePath, JSON.stringify(aoiData))
      
      // Set up the python path based on environment
      const pythonPath = process.env.NODE_ENV === 'production' 
        ? 'python' // Use the system python in production
        : path.join(process.cwd(), 'venv', 'Scripts', 'python.exe') // Use virtual env in development
      
      const scriptPath = path.join(process.cwd(), 'ml', 'change_detection_system.py');
      const outputPath = path.join(tempDir, `${jobId}_result.json`)
      
      // Use spawn instead of exec for better path handling with spaces
      const spawnProcess = (command: string, args: string[]): Promise<{stdout: string, stderr: string}> => {
        return new Promise((resolve, reject) => {
          const proc = spawn(command, args);

          let stdout = '';
          let stderr = '';

          proc.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log(`stdout: ${data}`);
          });

          proc.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error(`stderr: ${data}`);
          });

          proc.on('close', (code) => {
            if (code === 0) {
              resolve({ stdout, stderr });
            } else {
              reject(new Error(`Process exited with code ${code}: ${stderr}`));
            }
          });

          proc.on('error', (err) => {
            console.error('Failed to start subprocess.', err);
            reject(err);
          });
        });
      };
      
      // Make sure to handle spaces in paths properly
      const { stdout, stderr } = await spawnProcess(pythonPath, [
        scriptPath,
        '--input', tempFilePath,
        '--output', outputPath,
        '--debug'
      ]);
      
      console.log('Python script output:', stdout)
      
      if (stderr && !stderr.includes('DeprecationWarning')) {
        console.error('Python script error:', stderr)
      }
      
      // Store job status in database (in real production code, you would use a job queue)
      // For now, create an entry in a jobs collection or use a simple file-based approach
      const jobStatusPath = path.join(tempDir, `${jobId}_status.json`)
      fs.writeFileSync(jobStatusPath, JSON.stringify({
        jobId,
        status: 'processing',
        progress: 0,
        aoiId: aoi._id.toString(),
        userId
      }))

      // In a production environment, you would:
      // 1. Use a proper job queue like Bull/Redis or AWS SQS
      // 2. Have a dedicated worker process handling these jobs
      // 3. Update job status in real-time
      
      // For demonstration, start a timeout to simulate job completion
      // In production, this would be handled by a worker process
      setTimeout(async () => {
        try {
          // Check if the result file exists
          if (fs.existsSync(outputPath)) {
            const results = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
            
            // Create a new alert in the database
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
            })
            
            await newAlert.save()
            
            // Send email notification using the Python email module
            try {
              // Use the Python email module for better HTML formatting and image attachment
              const recipientEmail = aoi.notificationPreferences?.email?.address || 'fallback_user_email@example.com'
              
              // Extract monitoring schedule information from the AOI
              const monitoringSchedule = {
                start_date: aoi.monitoringDates?.start || new Date().toISOString(),
                end_date: aoi.monitoringDates?.end || null,
                frequency: aoi.frequency || 'continuous'
              }
              
              // Path to the Python script
              const pythonPath = process.env.NODE_ENV === 'production' 
                ? 'python' 
                : path.join(process.cwd(), 'venv', 'Scripts', 'python.exe')
              
              const emailScriptPath = path.join(process.cwd(), 'ml', 'email_notification.py')
              
              // Temporary file to store the alert data
              const alertDataPath = path.join(tempDir, `${jobId}_alert_data.json`)
              fs.writeFileSync(alertDataPath, JSON.stringify(results.alert_data))
              
              await spawnProcess(pythonPath, [
                emailScriptPath,
                '--recipient', recipientEmail,
                '--alert', alertDataPath,
                '--aoi-name', aoi.name,
                '--schedule', JSON.stringify(monitoringSchedule)
              ])
              
              console.log('Email notification sent via Python module')
            } catch (emailError) {
              console.error('Error sending email notification:', emailError)
              
              // Fallback to nodemailer if Python script fails
              try {
                await transporter.sendMail({
                  from: '"ISRO Change Monitoring" <sankalpasarkar68@gmail.com>', // Sender address
                  to: aoi.notificationPreferences?.email?.address || 'fallback_user_email@example.com', // Recipient
                  subject: `ISRO Alert: ${results.alert_data.type.replace('_', ' ')} Detected in ${aoi.name}`, // Subject line
                  text: `A new alert has been detected for your AOI: ${aoi.name}\n\n` +
                        `Type: ${results.alert_data.type}\n` +
                        `Severity: ${results.alert_data.severity}\n` +
                        `Confidence: ${results.alert_data.confidence}\n` +
                        `Description: ${results.alert_data.description}\n` +
                        `Detected Change: ${results.alert_data.detectedChange}\n\n` +
                        `View details in your dashboard.`,
                  html: `
                    <html>
                      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #0B60B0; padding: 20px; text-align: center; color: white;">
                          <h1 style="margin: 0;">Change Detection Alert</h1>
                          <p>ISRO Satellite Monitoring System</p>
                        </div>
                        
                        <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
                          <h2 style="color: ${results.alert_data.severity === 'high' ? '#d9534f' : results.alert_data.severity === 'medium' ? '#f0ad4e' : '#5bc0de'};">
                            ${results.alert_data.type.replace('_', ' ')} Alert
                          </h2>
                          
                          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid ${results.alert_data.severity === 'high' ? '#d9534f' : results.alert_data.severity === 'medium' ? '#f0ad4e' : '#5bc0de'}; background-color: #fff;">
                            <p><strong>Area of Interest:</strong> ${aoi.name}</p>
                            <p><strong>Severity:</strong> <span style="color: ${results.alert_data.severity === 'high' ? '#d9534f' : results.alert_data.severity === 'medium' ? '#f0ad4e' : '#5bc0de'};">${results.alert_data.severity.toUpperCase()}</span></p>
                            <p><strong>Confidence:</strong> ${Math.round(results.alert_data.confidence * 100)}%</p>
                            <p><strong>Detection Time:</strong> ${new Date().toLocaleString()}</p>
                            <p><strong>Description:</strong> ${results.alert_data.description}</p>
                          </div>
                          
                          <div style="margin-top: 20px;">
                            <p>This is an automated alert from the ISRO Change Monitoring System. Please log in to your dashboard to view more details and take appropriate action.</p>
                            <p style="text-align: center; margin-top: 20px;">
                              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" style="background-color: #0B60B0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View in Dashboard</a>
                            </p>
                          </div>
                        </div>
                        
                        <div style="padding: 10px; text-align: center; font-size: 12px; color: #666; margin-top: 20px;">
                          &copy; ${new Date().getFullYear()} ISRO Change Monitoring System. All rights reserved.<br>
                          <small>If you believe this alert was sent in error, please mark it as a false positive in your dashboard.</small>
                        </div>
                      </body>
                    </html>
                  `
                })
                
                console.log('Email notification sent via nodemailer (fallback)')
              } catch (fallbackError) {
                console.error('Error sending fallback email notification:', fallbackError)
              }
            }
            
            // Update job status to completed
            fs.writeFileSync(jobStatusPath, JSON.stringify({
              jobId,
              status: 'completed',
              progress: 100,
              aoiId: aoi._id.toString(),
              userId,
              resultId: newAlert._id.toString()
            }))
            
            // Clean up temporary files in production
            if (process.env.NODE_ENV === 'production') {
              fs.unlinkSync(tempFilePath)
              fs.unlinkSync(outputPath)
              // Keep the status file for a while for status inquiries
            }
          } else {
            // Mark job as failed if no results file
            fs.writeFileSync(jobStatusPath, JSON.stringify({
              jobId,
              status: 'failed',
              error: 'No results file generated',
              aoiId: aoi._id.toString(),
              userId
            }))
          }
        } catch (finalizeError) {
          console.error('Error finalizing job:', finalizeError)
          fs.writeFileSync(jobStatusPath, JSON.stringify({
            jobId,
            status: 'failed',
            error: finalizeError instanceof Error ? finalizeError.message : 'Unknown error',
            aoiId: aoi._id.toString(),
            userId
          }))
        }
      }, 5000) // Simulating 5 seconds of processing time - would be a worker job in production
    } catch (pythonError) {
      console.error('Error running Python module:', pythonError)
    }
    
    // Update the last monitored time
    aoi.lastMonitored = new Date()
    await aoi.save()
    
    return NextResponse.json({
      success: true,
      message: 'Change detection job submitted successfully',
      jobId: jobId,
      estimatedCompletionTime: '5 minutes'
    })

  } catch (error) {
    console.error('Error in change detection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get the status of a change detection job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const aoiId = searchParams.get('aoiId')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await dbConnect()

    // If jobId is provided, check its status
    if (jobId) {
      const jobStatusPath = path.join(process.cwd(), 'temp', `${jobId}_status.json`)
      
      // Check if the job status file exists
      if (fs.existsSync(jobStatusPath)) {
        try {
          const jobStatus = JSON.parse(fs.readFileSync(jobStatusPath, 'utf8'))
          
          // Verify this job belongs to the user
          if (jobStatus.userId !== userId) {
            return NextResponse.json(
              { error: 'You do not have permission to access this job' },
              { status: 403 }
            )
          }
          
          return NextResponse.json(jobStatus)
        } catch (error) {
          console.error('Error reading job status:', error)
          return NextResponse.json(
            { error: 'Failed to retrieve job status' },
            { status: 500 }
          )
        }
      }
      
      // If no status file found, check if it's a very recent job
      return NextResponse.json({
        jobId,
        status: 'pending',
        progress: 0,
        message: 'Job is being initialized'
      })
    }
    
    // If aoiId is provided, return recent detection results
    if (aoiId) {
      const aoi = await AOI.findOne({ _id: aoiId, userId })
      
      if (!aoi) {
        return NextResponse.json(
          { error: 'AOI not found or you do not have permission to access it' },
          { status: 404 }
        )
      }
      
      // Get the most recent alerts for this AOI
      const recentAlerts = await Alert.find({ aoiId })
        .sort({ createdAt: -1 })
        .limit(10)
      
      return NextResponse.json({
        aoi: {
          id: aoi._id,
          name: aoi.name,
          lastMonitored: aoi.lastMonitored
        },
        alerts: recentAlerts.map(alert => ({
          id: alert._id,
          type: alert.type,
          severity: alert.severity,
          confidence: alert.confidence,
          description: alert.description,
          time: alert.createdAt,
          status: alert.status
        }))
      })
    }

    return NextResponse.json({ error: 'Either jobId or aoiId is required' }, { status: 400 })
    
  } catch (error) {
    console.error('Error checking change detection status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
