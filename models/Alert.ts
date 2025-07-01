import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
  aoiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AOI',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deforestation', 'urban_development', 'water_body_change', 'land_use_change'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  detectedChange: {
    type: {
      area: Number, // Area affected in square kilometers
      percentage: Number, // Percentage of AOI affected
      coordinates: [[[Number]]], // Specific coordinates where change was detected
      beforeImageUrl: String,
      afterImageUrl: String,
      changeMapUrl: String
    }
  },
  status: {
    type: String,
    enum: ['new', 'viewed', 'acknowledged', 'resolved', 'false_positive'],
    default: 'new'
  },
  notificationSent: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    phoneCall: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    telegram: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  },
  metadata: {
    satelliteSource: String,
    imageDate: Date,
    processingTime: Number, // Time taken to process in seconds
    algorithmVersion: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

alertSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Index for efficient queries
alertSchema.index({ userId: 1, createdAt: -1 })
alertSchema.index({ aoiId: 1, createdAt: -1 })
alertSchema.index({ status: 1, createdAt: -1 })
alertSchema.index({ severity: 1, createdAt: -1 })

export default mongoose.models.Alert || mongoose.model('Alert', alertSchema)
