"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, MessageSquare, PhoneCall, MapPin, AlertTriangle } from 'lucide-react'
import IndiaMap from './india-map-wrapper'
import { cn } from '@/lib/utils'

interface Geometry {
  type: 'Polygon' | 'Circle' | 'Rectangle'
  coordinates: number[][][]
  center?: number[]
  radius?: number
}

interface AOICreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (aoiData: any) => void
  isLoading?: boolean
}

const alertTypes = [
  {
    id: 'deforestation',
    name: 'Deforestation Alert',
    description: 'Detect tree cover loss and forest clearing activities',
    icon: '🌲'
  },
  {
    id: 'urban_development',
    name: 'Urban Development Alert',
    description: 'Monitor construction and infrastructure development',
    icon: '🏗️'
  },
  {
    id: 'water_body_change',
    name: 'Water Body Change Alert',
    description: 'Track changes in water bodies and wetlands',
    icon: '💧'
  },
  {
    id: 'land_use_change',
    name: 'Land Use Change Alert',
    description: 'Monitor general land use and land cover changes',
    icon: '🌍'
  }
]

export default function AOICreationModal({ isOpen, onClose, onSubmit, isLoading = false }: AOICreationModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    geometry: null as Geometry | null,
    alertType: '',
    threshold: [0.5],
    email: '',
    enableEmail: true,
  })

  const handleGeometryChange = (geometry: Geometry) => {
    setFormData(prev => ({ ...prev, geometry }))
  }

  const handleSubmit = () => {
    if (!formData.geometry || !formData.name || !formData.alertType || !formData.email) {
      return
    }

    const aoiData = {
      name: formData.name,
      description: formData.description,
      geometry: formData.geometry,
      alertType: formData.alertType,
      threshold: formData.threshold[0],
      notificationPreferences: {
        email: {
          enabled: formData.enableEmail,
          address: formData.email
        },
        sms: {
          enabled: false
        },
        phoneCall: {
          enabled: false
        },
        telegram: {
          enabled: false
        }
      }
    }

    onSubmit(aoiData)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      geometry: null,
      alertType: '',
      threshold: [0.5],
      email: '',
      enableEmail: true,
    })
    setStep(1)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const isStep1Valid = formData.name && formData.geometry
  const isStep2Valid = formData.alertType
  const isStep3Valid = formData.email

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-black border-[#0B60B0]/30">
        <DialogHeader className="flex flex-row justify-between items-center mb-4">
          <DialogTitle className="text-2xl text-[#F0EDCF] flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#40A2D8]" />
            Create New Area of Interest
          </DialogTitle>
          <button 
            onClick={onClose}
            className="text-[#F0EDCF]/70 hover:text-[#F0EDCF] text-lg"
            aria-label="Close modal"
          >
            ✕
          </button>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= stepNum
                    ? "bg-[#0B60B0] text-[#F0EDCF]"
                    : "bg-[#F0EDCF]/20 text-[#F0EDCF]/50"
                )}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-2",
                    step > stepNum ? "bg-[#0B60B0]" : "bg-[#F0EDCF]/20"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Map and Basic Info - updated layout with map on right */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form inputs on the left side */}
              <div className="flex flex-col space-y-4 h-full">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#F0EDCF]">AOI Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Delhi Urban Area"
                    className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 text-[#F0EDCF] placeholder:text-[#F0EDCF]/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[#F0EDCF]">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the area you want to monitor..."
                    className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 text-[#F0EDCF] placeholder:text-[#F0EDCF]/50 min-h-[100px]"
                  />
                </div>
                
                {/* Selected Area Coordinates Display */}
                {formData.geometry && (
                  <div className="space-y-2">
                    <Label className="text-[#F0EDCF] font-medium">Selected Area Coordinates</Label>
                    <div className="p-3 bg-[#0B60B0]/10 rounded-lg border border-[#0B60B0]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-[#F0EDCF] font-medium">Area Selected</span>
                        <span className="text-[#F0EDCF]/70 text-sm">({formData.geometry.type})</span>
                      </div>
                      
                      {formData.geometry.type === 'Circle' && formData.geometry.center && (
                        <div className="space-y-1 text-sm">
                          <p className="text-[#F0EDCF]/80">
                            <strong>Center:</strong> {formData.geometry.center[1].toFixed(6)}°N, {formData.geometry.center[0].toFixed(6)}°E
                          </p>
                          <p className="text-[#F0EDCF]/80">
                            <strong>Radius:</strong> {formData.geometry.radius ? Math.round(formData.geometry.radius / 1000) : 0} km
                          </p>
                        </div>
                      )}
                      
                      {(formData.geometry.type === 'Polygon' || formData.geometry.type === 'Rectangle') && 
                       formData.geometry.coordinates && formData.geometry.coordinates.length > 0 && (
                        <div className="space-y-1 text-sm">
                          <p className="text-[#F0EDCF]/80">
                            <strong>Points:</strong> {formData.geometry.coordinates[0]?.length || 0} coordinates
                          </p>
                          <div className="max-h-20 overflow-y-auto text-xs text-[#F0EDCF]/70 space-y-1">
                            {formData.geometry.coordinates[0]?.slice(0, 5).map((coord: number[], idx: number) => (
                              <div key={idx} className="font-mono">
                                Point {idx + 1}: {coord[1]?.toFixed(6)}°N, {coord[0]?.toFixed(6)}°E
                              </div>
                            ))}
                            {formData.geometry.coordinates[0]?.length > 5 && (
                              <div className="text-[#F0EDCF]/50 italic">
                                ... and {formData.geometry.coordinates[0].length - 5} more points
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Status indicator box */}
                <div className="flex-grow">
                  {/* Removed success message - area stays visible on map */}
                </div>
              </div>
              
              {/* Map on the right side */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-[#F0EDCF] font-medium text-base">Select Area on Map *</Label>
                  <span className="text-[#F0EDCF]/70 text-xs">Use drawing tools in top-right corner</span>
                </div>
                <IndiaMap
                  onGeometryChange={handleGeometryChange}
                  height="480px" 
                  className="border-[#0B60B0]/30"
                  debug={false} 
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="bg-[#0B60B0] hover:bg-[#40A2D8] text-[#F0EDCF]"
              >
                Next: Choose Alert Type
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Alert Type and Threshold */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[#F0EDCF] text-lg">Choose Alert Type *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alertTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg",
                      formData.alertType === type.id
                        ? "bg-[#0B60B0]/20 border-[#0B60B0] shadow-lg"
                        : "bg-[#F0EDCF]/5 border-[#0B60B0]/30 hover:border-[#40A2D8]/50"
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, alertType: type.id }))}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-[#F0EDCF] flex items-center gap-2 text-lg">
                        <span className="text-2xl">{type.icon}</span>
                        {type.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#F0EDCF]/70 text-sm">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[#F0EDCF] text-lg">Detection Threshold</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[#F0EDCF]/70 text-sm">
                    Alert me when confidence level is above: <span className="text-[#40A2D8] font-medium">{Math.round(formData.threshold[0] * 100)}%</span>
                  </p>
                </div>
                <Slider
                  value={formData.threshold}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, threshold: value }))}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[#F0EDCF]/50">
                  <span>10% (More alerts)</span>
                  <span>100% (Fewer alerts)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="border-[#0B60B0] text-[#0B60B0] hover:bg-[#0B60B0] hover:text-[#F0EDCF]"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid}
                className="bg-[#0B60B0] hover:bg-[#40A2D8] text-[#F0EDCF]"
              >
                Next: Notification Settings
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Notification Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-[#F0EDCF] text-lg">Notification Preferences</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email - Active */}
                <Card className="bg-[#0B60B0]/10 border-[#0B60B0]/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#F0EDCF] flex items-center gap-2">
                      <Mail className="h-5 w-5 text-[#40A2D8]" />
                      Email Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#F0EDCF]">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="bg-[#F0EDCF]/5 border-[#0B60B0]/30 text-[#F0EDCF] placeholder:text-[#F0EDCF]/50"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* SMS - Coming Soon */}
                <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/20 opacity-60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#F0EDCF]/70 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      SMS Notifications
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Coming Soon</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F0EDCF]/50 text-sm">SMS alerts will be available in future updates</p>
                  </CardContent>
                </Card>

                {/* Phone Call - Coming Soon */}
                <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/20 opacity-60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#F0EDCF]/70 flex items-center gap-2">
                      <PhoneCall className="h-5 w-5" />
                      Phone Call Alerts
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Coming Soon</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F0EDCF]/50 text-sm">Voice call alerts for critical changes</p>
                  </CardContent>
                </Card>

                {/* Telegram - Coming Soon */}
                <Card className="bg-[#F0EDCF]/5 border-[#0B60B0]/20 opacity-60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#F0EDCF]/70 flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Telegram Notifications
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Coming Soon</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F0EDCF]/50 text-sm">Instant alerts via Telegram bot</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="border-[#0B60B0] text-[#0B60B0] hover:bg-[#0B60B0] hover:text-[#F0EDCF]"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isStep3Valid || isLoading}
                className="bg-[#0B60B0] hover:bg-[#40A2D8] text-[#F0EDCF] flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F0EDCF]"></div>
                    Creating AOI...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Start Monitoring
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
