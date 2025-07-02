"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadModules } from 'esri-loader'

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

// India boundaries - using standard format [lng, lat]
const INDIA_BOUNDS = {
  xmin: 68.1097,
  ymin: 6.4627,
  xmax: 97.4165,
  ymax: 37.6,
  spatialReference: { wkid: 4326 }
}

const INDIA_CENTER = {
  longitude: 78.9629,
  latitude: 20.5937
}

/**
 * ESRI ArcGIS JavaScript API Configuration:
 * 
 * 1. Basemap Options:
 *    - "satellite": High-resolution satellite imagery (fastest for satellite data)
 *    - "hybrid": Satellite with labels
 *    - "streets": Street map
 *    - "topo": Topographic map
 *    - "gray": Neutral gray canvas
 * 
 * 2. Performance Benefits:
 *    - Cached tiles from ESRI's CDN
 *    - Optimized for satellite imagery
 *    - Better performance than Mapbox for satellite views
 *    - Built-in drawing tools with better performance
 */

// Available ESRI basemap styles
const BASEMAP_STYLES = {
  HYBRID: 'hybrid',
  SATELLITE: 'satellite', 
  STREETS: 'streets',
  TOPO: 'topo',
  GRAY: 'gray'
}

export default function IndiaMap({ 
  onGeometryChange, 
  height = "600px", 
  className = "", 
  debug = false
}: IndiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const sketchViewModelRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentBasemap, setCurrentBasemap] = useState<string>(BASEMAP_STYLES.HYBRID)
  const [selectedGeometry, setSelectedGeometry] = useState<Geometry | null>(null)
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

  // Helper function to convert ESRI geometry to our format
  const convertEsriGeometryToGeometry = useCallback((esriGeometry: any): Geometry | null => {
    if (!esriGeometry) return null

    if (esriGeometry.type === 'polygon') {
      // Geometry is already in geographic coordinates (lat/lng)
      const coordinates = esriGeometry.rings.map((ring: number[][]) => 
        ring.map((coord: number[]) => [coord[0], coord[1]]) // [lng, lat]
      )
      
      return {
        type: 'Polygon',
        coordinates: coordinates
      }
    } else if (esriGeometry.type === 'circle') {
      return {
        type: 'Circle',
        coordinates: [],
        center: [esriGeometry.center.longitude || esriGeometry.center.x, esriGeometry.center.latitude || esriGeometry.center.y],
        radius: esriGeometry.radius
      }
    } else if (esriGeometry.type === 'extent') {
      // Convert extent to rectangle polygon with geographic coordinates
      const coords = [[
        [esriGeometry.xmin, esriGeometry.ymin], // Bottom-left
        [esriGeometry.xmax, esriGeometry.ymin], // Bottom-right
        [esriGeometry.xmax, esriGeometry.ymax], // Top-right
        [esriGeometry.xmin, esriGeometry.ymax], // Top-left
        [esriGeometry.xmin, esriGeometry.ymin]  // Close the ring
      ]]
      return {
        type: 'Rectangle',
        coordinates: coords
      }
    }
    
    return null
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initializeMap = async () => {
      try {
        // Load ESRI modules
        const [
          Map,
          MapView,
          Sketch,
          GraphicsLayer,
          Extent,
          SimpleFillSymbol,
          SimpleLineSymbol,
          webMercatorUtils
        ] = await loadModules([
          'esri/Map',
          'esri/views/MapView', 
          'esri/widgets/Sketch',
          'esri/layers/GraphicsLayer',
          'esri/geometry/Extent',
          'esri/symbols/SimpleFillSymbol',
          'esri/symbols/SimpleLineSymbol',
          'esri/geometry/support/webMercatorUtils'
        ], { 
          css: true,
          url: 'https://js.arcgis.com/4.29/'
        })

        // Create graphics layer for drawings
        const graphicsLayer = new GraphicsLayer()

        // Define custom symbols for selected areas
        const fillSymbol = new SimpleFillSymbol({
          color: [64, 162, 216, 0.3], // #40A2D8 with opacity
          outline: new SimpleLineSymbol({
            color: [11, 96, 176], // #0B60B0
            width: 3
          })
        })

        const lineSymbol = new SimpleLineSymbol({
          color: [11, 96, 176], // #0B60B0
          width: 3
        })

        // Create map with satellite basemap
        const map = new Map({
          basemap: currentBasemap,
          layers: [graphicsLayer]
        })

        // Create India extent for constraining view
        const indiaExtent = new Extent(INDIA_BOUNDS)

        // Create map view
        const view = new MapView({
          container: mapRef.current,
          map: map,
          center: [INDIA_CENTER.longitude, INDIA_CENTER.latitude],
          zoom: 5,
          extent: indiaExtent,
          constraints: {
            geometry: indiaExtent,
            minZoom: 4,
            maxZoom: 18
          }
        })

        // Create sketch widget for drawing
        const sketch = new Sketch({
          layer: graphicsLayer,
          view: view,
          creationMode: 'single', // Create once and keep visible
          availableCreateTools: ['polygon', 'rectangle', 'circle'],
          defaultCreateOptions: {
            hasZ: false
          },
          // Set custom symbols for drawn graphics
          polygonSymbol: fillSymbol,
          pointSymbol: {
            type: "simple-marker",
            color: [11, 96, 176],
            size: 8,
            outline: {
              color: [240, 237, 207],
              width: 2
            }
          },
          polylineSymbol: lineSymbol,
          visibleElements: {
            createTools: {
              point: false,
              polyline: false,
              polygon: true,
              rectangle: true,
              circle: true
            },
            selectionTools: {
              "lasso-selection": true,
              "rectangle-selection": true
            },
            undoRedoMenu: true,
            settingsMenu: false
          },
          // Keep graphics visible and allow updates
          defaultUpdateOptions: {
            enableRotation: false,
            enableScaling: true,
            multipleSelectionEnabled: false,
            toggleToolOnClick: false
          }
        })

        // Add sketch widget to view
        view.ui.add(sketch, 'top-right')

        // Handle sketch events
        sketch.on('create', (event: any) => {
          if (event.state === 'complete' && event.graphic) {
            // Apply custom styling to keep the graphic visible
            event.graphic.symbol = event.graphic.geometry.type === 'polygon' ? fillSymbol : 
                                 event.graphic.geometry.type === 'circle' ? fillSymbol : lineSymbol
            
            // Convert from Web Mercator to Geographic coordinates
            const geographicGeometry = webMercatorUtils.webMercatorToGeographic(event.graphic.geometry)
            const geometry = convertEsriGeometryToGeometry(geographicGeometry)
            if (geometry) {
              setSelectedGeometry(geometry)
              onGeometryChange(geometry)
              
              // Ensure the graphic stays on the layer
              if (!graphicsLayer.graphics.includes(event.graphic)) {
                graphicsLayer.add(event.graphic)
              }
              
              if (debug) {
                console.log('Area selected and marked on map:', geometry)
                console.log('Geographic coordinates:', geometry.coordinates)
              }
            }
          }
        })

        sketch.on('update', (event: any) => {
          if (event.state === 'complete' && event.graphics && event.graphics.length > 0) {
            const updatedGraphic = event.graphics[0]
            
            // Apply custom styling to the updated graphic
            updatedGraphic.symbol = updatedGraphic.geometry.type === 'polygon' ? fillSymbol : 
                                  updatedGraphic.geometry.type === 'circle' ? fillSymbol : lineSymbol
            
            // Convert from Web Mercator to Geographic coordinates
            const geographicGeometry = webMercatorUtils.webMercatorToGeographic(updatedGraphic.geometry)
            const geometry = convertEsriGeometryToGeometry(geographicGeometry)
            if (geometry) {
              setSelectedGeometry(geometry)
              onGeometryChange(geometry)
              
              if (debug) {
                console.log('Area updated and re-marked on map:', geometry)
                console.log('Updated coordinates:', geometry.coordinates)
              }
            }
          }
        })

        sketch.on('delete', (event: any) => {
          setSelectedGeometry(null)
          onGeometryChange({
            type: 'Polygon',
            coordinates: []
          })
          
          if (debug) {
            console.log('Area selection cleared from map')
          }
        })

        // Wait for view to load
        await view.when()
        
        setIsLoaded(true)
        setDebugInfo(prev => ({ ...prev, mapLoaded: true, drawEnabled: true }))
        
        if (debug) {
          console.log('ESRI map loaded successfully with hybrid satellite basemap')
        }

        // Store references
        mapInstanceRef.current = { map, view }
        sketchViewModelRef.current = sketch

      } catch (err) {
        console.error('Failed to initialize ESRI map:', err)
        setError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setDebugInfo(prev => ({ ...prev, errors: prev.errors + 1 }))
      }
    }

    initializeMap()

    return () => {
      if (mapInstanceRef.current?.view) {
        mapInstanceRef.current.view.destroy()
        mapInstanceRef.current = null
      }
      if (sketchViewModelRef.current) {
        sketchViewModelRef.current.destroy()
        sketchViewModelRef.current = null
      }
    }
  }, [onGeometryChange, currentBasemap, convertEsriGeometryToGeometry, debug])

  // Handle basemap changes
  const changeBasemap = useCallback(async (newBasemap: string) => {
    if (mapInstanceRef.current?.map && newBasemap !== currentBasemap) {
      mapInstanceRef.current.map.basemap = newBasemap
      setCurrentBasemap(newBasemap)
      
      if (debug) {
        console.log(`Changed basemap to: ${newBasemap}`)
      }
    }
  }, [currentBasemap, debug])

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
            <p>Loading ESRI Satellite Map...</p>
            <p className="text-xs text-[#F0EDCF]/70 mt-1">Initializing high-resolution imagery</p>
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
      <div id="drawing-instructions" className="absolute top-2 right-2 bg-black/90 text-[#F0EDCF] text-xs p-3 rounded z-10 border border-[#0B60B0]/30 min-w-[180px] mr-16">
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
        <div className="space-y-2 text-xs">
          <p className="text-sm">⬟ Polygon ▭ Rectangle ● Circle</p>
          <p className="text-[#F0EDCF]/70">Use ESRI drawing tools above</p>
          
          {/* Basemap switcher moved here */}
          <div className="border-t border-[#0B60B0]/30 pt-2 mt-2">
            <p className="text-[#40A2D8] font-medium mb-2">Map Style:</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(BASEMAP_STYLES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => changeBasemap(value)}
                  className={`px-2 py-1 rounded text-xs ${
                    currentBasemap === value 
                      ? 'bg-[#0B60B0] text-[#F0EDCF]' 
                      : 'hover:bg-[#0B60B0]/50 text-[#F0EDCF]/70'
                  }`}
                >
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coordinates now stored in form modal instead of displaying on map */}
      
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
            <p className="font-medium text-[#40A2D8]">Debug Info (ESRI)</p>
            <span id="debug-toggle" className="text-[#F0EDCF]">⌄</span>
          </div>
          
          <div id="debug-content" className="p-3 pt-0 border-t border-[#0B60B0]/30" style={{display: 'none'}}>
            <p className="mb-1">Basemap: <span className="text-[#F0EDCF]">{currentBasemap}</span></p>
            <p className="mb-1">Provider: <span className="text-[#F0EDCF]">ESRI ArcGIS</span></p>
            <p className="mb-1">Map loaded: <span className={debugInfo.mapLoaded ? 'text-green-400' : 'text-red-400'}>{debugInfo.mapLoaded ? 'Yes' : 'No'}</span></p>
            <p className="mb-1">Draw enabled: <span className={debugInfo.drawEnabled ? 'text-green-400' : 'text-red-400'}>{debugInfo.drawEnabled ? 'Yes' : 'No'}</span></p>
            <p className="mb-1">Errors: <span className={debugInfo.errors > 0 ? 'text-red-400' : 'text-green-400'}>{debugInfo.errors}</span></p>
          </div>
        </div>
      )}
    </div>
  )
}
