import mongoose from 'mongoose'

const aoiSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'Circle', 'Rectangle'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of coordinate arrays for polygons
      required: true
    },
    center: {
      type: [Number], // [lng, lat] for circles
      required: function() { return this.geometry.type === 'Circle' }
    },
    radius: {
      type: Number, // radius in meters for circles
      required: function() { return this.geometry.type === 'Circle' }
    }
  },
  alertType: {
    type: String,
    enum: ['deforestation', 'urban_development', 'water_body_change', 'land_use_change'],
    required: true
  },
  threshold: {
    type: Number,
    min: 0.1,
    max: 1.0,
    required: true
  },
  notificationPreferences: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      address: {
        type: String,
        required: function() { return this.notificationPreferences.email.enabled }
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      phone: String
    },
    phoneCall: {
      enabled: {
        type: Boolean,
        default: false
      },
      phone: String
    },
    telegram: {
      enabled: {
        type: Boolean,
        default: false
      },
      chatId: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'inactive'],
    default: 'active'
  },
  area: {
    type: Number, // Area in square kilometers
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastMonitored: {
    type: Date,
    default: Date.now
  }
})

aoiSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Calculate area based on geometry type
aoiSchema.methods.calculateArea = function() {
  // Simplified area calculation - in a real app, you'd use proper geospatial calculations
  if (this.geometry.type === 'Circle') {
    const radiusKm = this.geometry.radius / 1000
    this.area = Math.PI * radiusKm * radiusKm
  } else if (this.geometry.type === 'Rectangle' || this.geometry.type === 'Polygon') {
    // Simplified calculation for demo - use proper geospatial libraries in production
    const coords = this.geometry.coordinates[0]
    if (coords.length >= 4) {
      const latDiff = Math.abs(coords[0][1] - coords[2][1])
      const lngDiff = Math.abs(coords[0][0] - coords[2][0])
      // Rough approximation: 1 degree ≈ 111 km
      this.area = latDiff * lngDiff * 111 * 111
    }
  }
  return this.area
}

export default mongoose.models.AOI || mongoose.model('AOI', aoiSchema)
