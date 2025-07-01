"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

// Set your Mapbox access token here
// For production, use environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

interface Geometry {
  type: 'Polygon' | 'Circle' | 'Rectangle'
  coordinates: number[][][]
  center?: number[]
  radius?: number
}

interface IndiaMapProps {
  onGeometryChange: (geometry: Geometry) => void
  height?: string
  className?: string
  debug?: boolean // Enable debug mode for troubleshooting
}

// India boundaries - using Mapbox format [lng, lat]
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [68.1097, 6.4627], // Southwest corner [lng, lat]
  [97.4165, 37.6]    // Northeast corner [lng, lat]
]

const INDIA_CENTER: [number, number] = [78.9629, 20.5937] // [lng, lat]

/**
 * Mapbox Configuration Documentation:
 * 
 * 1. Style Options:
 *    - mapbox://styles/mapbox/satellite-v9: Satellite imagery
 *    - mapbox://styles/mapbox/streets-v12: Clean street map
 *    - mapbox://styles/mapbox/outdoors-v12: Topographic map with terrain details
 *    - mapbox://styles/mapbox/light-v11: Light background with minimal details
 * 
 * 2. Worldview Feature:
 *    - "IN": Shows India boundaries according to Indian requirements
 *    - "all": Shows globally accepted boundaries
 *    - Other ISO country codes available: "US", "CN", "JP"
 * 
 * 3. Additional Features:
 *    - renderWorldCopies: Whether to render multiple copies of the world
 *    - maxBounds: Restricts the view to specified bounds
 *    - projection: Can use "mercator", "globe", or other projections
 */

// Available Mapbox styles
const MAP_STYLES = {
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
  LIGHT: 'mapbox://styles/mapbox/light-v11'
}

export default function IndiaMap({ 
  onGeometryChange, 
  height = "600px", 
  className = "", 
  debug = false
}: IndiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentStyle, setCurrentStyle] = useState<string>(MAP_STYLES.SATELLITE)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<{
    tilesLoaded: number, 
    errors: number, 
    mapLoaded: boolean,
    drawEnabled: boolean
  }>({
    tilesLoaded: 0,
    errors: 0,
    mapLoaded: false,
    drawEnabled: false
  })

  // Helper function to convert Mapbox Draw features to our geometry format
  const convertFeatureToGeometry = useCallback((feature: any): Geometry | null => {
    if (!feature || !feature.geometry) return null

    const { geometry, properties } = feature
    
    if (geometry.type === 'Polygon') {
      return {
        type: 'Polygon',
        coordinates: geometry.coordinates
      }
    } else if (properties?.isRectangle) {
      // For rectangles, we can detect them by custom properties
      return {
        type: 'Rectangle',
        coordinates: geometry.coordinates
      }
    } else if (properties?.isCircle && properties?.center && properties?.radius) {
      // For circles, we store center and radius in properties
      return {
        type: 'Circle',
        coordinates: [],
        center: properties.center,
        radius: properties.radius
      }
    }
    
    return null
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      // Initialize Mapbox map with India-focused configuration
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: currentStyle,
        center: INDIA_CENTER,
        zoom: 5,
        minZoom: 4,
        maxZoom: 18,
        maxBounds: INDIA_BOUNDS,
        // Enable worldview for India - this respects legal boundaries
        worldview: 'IN',
        // Other useful options
        attributionControl: true,
        logoPosition: 'bottom-left',
        renderWorldCopies: false, // Don't show multiple copies of the world
        projection: 'mercator' // You can also use 'globe' for a 3D effect
      })

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-left')

      // Initialize Mapbox Draw with custom styling
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select',
        styles: [
          // Polygon fill
          {
            id: 'gl-draw-polygon-fill-inactive',
            type: 'fill',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'fill-color': '#40A2D8',
              'fill-outline-color': '#0B60B0',
              'fill-opacity': 0.3
            }
          },
          {
            id: 'gl-draw-polygon-fill-active',
            type: 'fill',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            paint: {
              'fill-color': '#40A2D8',
              'fill-outline-color': '#0B60B0',
              'fill-opacity': 0.3
            }
          },
          // Polygon stroke
          {
            id: 'gl-draw-polygon-stroke-inactive',
            type: 'line',
            filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#0B60B0',
              'line-width': 3
            }
          },
          {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#0B60B0',
              'line-width': 3
            }
          },
          // Line stroke
          {
            id: 'gl-draw-line',
            type: 'line',
            filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': '#0B60B0',
              'line-width': 3
            }
          },
          // Vertex points
          {
            id: 'gl-draw-polygon-and-line-vertex-halo-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            paint: {
              'circle-radius': 5,
              'circle-color': '#F0EDCF'
            }
          },
          {
            id: 'gl-draw-polygon-and-line-vertex-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
            paint: {
              'circle-radius': 3,
              'circle-color': '#0B60B0'
            }
          }
        ]
      })

      map.addControl(draw, 'top-right')

      // Add custom CSS for draw controls
      const style = document.createElement('style')
      style.innerHTML = `
        /* Customize Mapbox Draw controls */
        .mapboxgl-ctrl-group button {
          background-color: #000 !important;
          border: 1px solid #0B60B0 !important;
        }
        .mapboxgl-ctrl-group button:hover {
          background-color: #0B60B0 !important;
        }
        .mapboxgl-ctrl-group button.active {
          background-color: #0B60B0 !important;
          color: #F0EDCF !important;
        }
        /* Map container styling */
        .mapboxgl-map {
          font-family: inherit;
        }
        .mapboxgl-ctrl-attrib {
          background-color: rgba(0, 0, 0, 0.8) !important;
          color: #F0EDCF !important;
        }
        .mapboxgl-ctrl-attrib a {
          color: #40A2D8 !important;
        }
      `
      document.head.appendChild(style)

      // Event handlers
      map.on('load', () => {
        setIsLoaded(true)
        setDebugInfo(prev => ({ ...prev, mapLoaded: true, drawEnabled: true }))
        
        if (debug) {
          console.log('Mapbox map loaded successfully with worldview: IN')
        }
      })

      map.on('error', (e) => {
        console.error('Mapbox map error:', e)
        setError(`Map error: ${e.error?.message || 'Unknown error'}`)
        setDebugInfo(prev => ({ ...prev, errors: prev.errors + 1 }))
      })

      map.on('data', (e) => {
        if (e.dataType === 'style') {
          setDebugInfo(prev => ({ ...prev, tilesLoaded: prev.tilesLoaded + 1 }))
        }
      })

      // Handle draw events
      map.on('draw.create', (e: any) => {
        const features = e.features
        if (features && features.length > 0) {
          const geometry = convertFeatureToGeometry(features[0])
          if (geometry) {
            onGeometryChange(geometry)
          }
        }
      })

      map.on('draw.update', (e: any) => {
        const features = e.features
        if (features && features.length > 0) {
          const geometry = convertFeatureToGeometry(features[0])
          if (geometry) {
            onGeometryChange(geometry)
          }
        }
      })

      map.on('draw.delete', () => {
        onGeometryChange({
          type: 'Polygon',
          coordinates: []
        })
      })

      // Store references
      mapInstanceRef.current = map
      drawRef.current = draw

    } catch (err) {
      console.error('Failed to initialize Mapbox map:', err)
      setError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      if (drawRef.current) {
        drawRef.current = null
      }
    }
  }, [onGeometryChange, currentStyle, convertFeatureToGeometry, debug])

  // Handle style changes
  const changeMapStyle = useCallback((newStyle: string) => {
    if (mapInstanceRef.current && newStyle !== currentStyle) {
      mapInstanceRef.current.setStyle(newStyle)
      setCurrentStyle(newStyle)
    }
  }, [currentStyle])

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="rounded-lg border border-[#0B60B0]/30 z-0"
      />
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-[#F0EDCF] text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B60B0] mx-auto mb-2"></div>
            <p>Loading Map...</p>
            <p className="text-xs text-[#F0EDCF]/70 mt-1">Initializing Mapbox with Indian boundaries</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-[#F0EDCF] text-center p-4">
            <div className="text-red-400 mb-2">⚠️</div>
            <p className="text-sm">Map loading failed</p>
            <p className="text-xs text-[#F0EDCF]/70 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-3 py-1 bg-[#0B60B0] text-[#F0EDCF] rounded text-xs hover:bg-[#40A2D8]"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Drawing instructions */}
      <div id="drawing-instructions" className="absolute top-2 right-2 bg-black/90 text-[#F0EDCF] text-xs p-3 rounded z-10 border border-[#0B60B0]/30 min-w-[160px]">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[#40A2D8] font-medium">Draw Area of Interest:</p>
          <button 
            onClick={() => {
              const element = document.getElementById('drawing-instructions');
              if (element) element.style.display = 'none';
            }}
            className="text-[#F0EDCF]/70 hover:text-[#F0EDCF] text-xs"
            aria-label="Close instructions"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1 text-xs">
          <p className="text-sm">⬟ Polygon</p>
          <p className="text-[#F0EDCF]/70">Use controls on top-right</p>
        </div>
      </div>
      
      {/* Debug panel */}
      {debug && (
        <div className="absolute bottom-2 left-2 bg-black/90 text-white text-xs rounded z-10 border border-[#0B60B0] max-w-[250px]">
          <div 
            className="flex justify-between items-center p-2 cursor-pointer"
            onClick={() => {
              const debugContent = document.getElementById('debug-content');
              if (debugContent) {
                const isVisible = debugContent.style.display !== 'none';
                debugContent.style.display = isVisible ? 'none' : 'block';
                const toggleIcon = document.getElementById('debug-toggle');
                if (toggleIcon) toggleIcon.textContent = isVisible ? '⌄' : '⌃';
              }
            }}
          >
            <p className="font-medium text-[#40A2D8]">Debug Info (Mapbox)</p>
            <span id="debug-toggle" className="text-[#F0EDCF]">⌄</span>
          </div>
          
          <div id="debug-content" className="p-3 pt-0 border-t border-[#0B60B0]/30" style={{display: 'none'}}>
            <p className="mb-1">Style: <span className="text-[#F0EDCF]">Satellite</span></p>
            <p className="mb-1">Worldview: <span className="text-[#F0EDCF]">IN (India)</span></p>
            <p className="mb-1">Map loaded: <span className={debugInfo.mapLoaded ? 'text-green-400' : 'text-red-400'}>{debugInfo.mapLoaded ? 'Yes' : 'No'}</span></p>
            <p className="mb-1">Draw enabled: <span className={debugInfo.drawEnabled ? 'text-green-400' : 'text-red-400'}>{debugInfo.drawEnabled ? 'Yes' : 'No'}</span></p>
            <p className="mb-1">Tiles loaded: <span className="text-[#F0EDCF]">{debugInfo.tilesLoaded}</span></p>
            <p className="mb-1">Errors: <span className={debugInfo.errors > 0 ? 'text-red-400' : 'text-green-400'}>{debugInfo.errors}</span></p>
          </div>
        </div>
      )}
    </div>
  )
}
