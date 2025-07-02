'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import IndiaMap from '@/components/india-map';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function ChangeDetectionPanel() {
  // State for AOI selection
  const [selectedAOI, setSelectedAOI] = useState(null);
  const [userAOIs, setUserAOIs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for alert configuration
  const [alertType, setAlertType] = useState('deforestation');
  const [threshold, setThreshold] = useState(0.5);
  
  // State for date selection
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  
  // State for job status
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  
  // State for alerts
  const [alerts, setAlerts] = useState([]);
  
  // Load user's AOIs on component mount
  useEffect(() => {
    const fetchAOIs = async () => {
      try {
        const response = await fetch('/api/aoi');
        if (response.ok) {
          const data = await response.json();
          setUserAOIs(data.aois || []);
        }
      } catch (error) {
        console.error('Failed to fetch AOIs:', error);
      }
    };
    
    fetchAOIs();
  }, []);
  
  // Poll for job status when jobId is available
  useEffect(() => {
    let intervalId;
    
    if (jobId) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/direct-detection?jobId=${jobId}&userId=current-user-id`);
          if (response.ok) {
            const data = await response.json();
            setJobStatus(data);
            
            // If job is complete, fetch the alerts
            if (data.status === 'completed') {
              clearInterval(intervalId);
              fetchAlerts();
            }
          }
        } catch (error) {
          console.error('Failed to check job status:', error);
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);
  
  const fetchAlerts = async () => {
    if (!selectedAOI) return;
    
    try {
      const response = await fetch(`/api/direct-detection?aoiId=${selectedAOI.id}&userId=current-user-id`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };
  
  const handleStartMonitoring = async () => {
    if (!selectedAOI) return;
    
    setIsLoading(true);
    
    try {
      const payload = {
        aoiId: selectedAOI.id,
        userId: 'current-user-id', // In a real app, get this from auth context
        forceScan: true,
        config: {
          alertType,
          threshold,
          useCustomDateRange,
          ...(useCustomDateRange && {
            customDates: {
              startDate: startDate.toISOString(),
              endDate: endDate ? endDate.toISOString() : new Date().toISOString()
            }
          })
        }
      };
      
      const response = await fetch('/api/direct-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobId(data.jobId);
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="flex flex-col gap-8 p-6">
      <h1 className="text-3xl font-bold">Change Detection Monitoring</h1>
      
      <Tabs defaultValue="configure">
        <TabsList>
          <TabsTrigger value="configure">Configure Monitoring</TabsTrigger>
          <TabsTrigger value="results">View Results</TabsTrigger>
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
        </TabsList>
        
        {/* Configure Tab */}
        <TabsContent value="configure">
          <Card>
            <CardHeader>
              <CardTitle>Configure Change Detection</CardTitle>
              <CardDescription>
                Set up parameters for monitoring changes in your Area of Interest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AOI Selection */}
              <div className="space-y-2">
                <Label>Select Area of Interest</Label>
                <Select value={selectedAOI?.id || ''} onValueChange={(value) => {
                  const aoi = userAOIs.find(a => a.id === value);
                  setSelectedAOI(aoi);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an AOI" />
                  </SelectTrigger>
                  <SelectContent>
                    {userAOIs.map(aoi => (
                      <SelectItem key={aoi.id} value={aoi.id}>{aoi.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Alert Type Selection */}
              <div className="space-y-2">
                <Label>Change Type to Monitor</Label>
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deforestation">Deforestation</SelectItem>
                    <SelectItem value="urban_development">Urban Development</SelectItem>
                    <SelectItem value="water_body_change">Water Body Changes</SelectItem>
                    <SelectItem value="land_use_change">Land Use Changes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Threshold Selection */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Detection Threshold</Label>
                  <span>{threshold.toFixed(1)}</span>
                </div>
                <Slider
                  value={[threshold]}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  onValueChange={(values) => setThreshold(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More Sensitive (0.1)</span>
                  <span>More Precise (1.0)</span>
                </div>
              </div>
              
              {/* Date Range Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useCustomDateRange"
                    checked={useCustomDateRange}
                    onChange={(e) => setUseCustomDateRange(e.target.checked)}
                  />
                  <Label htmlFor="useCustomDateRange">Use Custom Date Range</Label>
                </div>
                
                {useCustomDateRange && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < startDate || date > new Date()}
                      />
                    </div>
                  </div>
                )}
                
                {!useCustomDateRange && (
                  <Alert>
                    <AlertTitle>Automatic Date Selection</AlertTitle>
                    <AlertDescription>
                      The system will automatically select the most recent imagery for comparison with a baseline from 6 months ago.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleStartMonitoring}
                disabled={!selectedAOI || isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Start Monitoring'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Job Status */}
          {jobId && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Processing Status</CardTitle>
              </CardHeader>
              <CardContent>
                {jobStatus ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={jobStatus.status === 'completed' ? 'secondary' : 'default'}>
                        {jobStatus.status}
                      </Badge>
                    </div>
                    {jobStatus.progress && (
                      <div className="flex justify-between">
                        <span>Progress:</span>
                        <span>{jobStatus.progress}%</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>Checking job status...</div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Detection Results</CardTitle>
              <CardDescription>
                Alerts generated from change detection analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <Card key={alert.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{alert.type.replace('_', ' ')}</CardTitle>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <CardDescription>
                          {new Date(alert.time).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{alert.description}</p>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div>Confidence: {(alert.confidence * 100).toFixed(1)}%</div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm">View Details</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No alerts found. Run a change detection analysis first.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Map Tab */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                Visualize AOIs and detected changes
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[600px]">
              <IndiaMap />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
