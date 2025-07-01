"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'

// Extend Leaflet types for draw plugin
declare global {
  namespace L {
    namespace Draw {
      const Event: {
        CREATED: string
        EDITED: string
        DELETED: string
      }
    }
    namespace Control {
      class Draw extends L.Control {
        constructor(options?: any)
      }
    }
  }
}

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

// India boundaries - more precise coordinates
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.4627, 68.1097], // Southwest corner (Kerala-Tamil Nadu coast, Pakistan border)
  [37.6, 97.4165]    // Northeast corner (Arunachal Pradesh, Myanmar border)
]

const INDIA_CENTER: L.LatLngExpression = [20.5937, 78.9629]

/**
 * Map Layer Sources Documentation:
 * 
 * 1. Primary Base Layers:
 *    - Esri World Imagery (satellite): High-quality satellite imagery with good boundary accuracy
 *    - Esri World Topographic (topo): Best overall with accurate Indian boundaries
 *    - CartoDB Positron (streets): Clean street map with decent boundary accuracy
 * 
 * 2. Bhuvan Layers (from ISRO):
 *    - Bhuvan Vector: Official Indian government vector layer (may be unreliable)
 *    - Bhuvan Satellite: Alternative Bhuvan satellite layer
 *    - Bhuvan WMS: WMS-based layer with better support for boundary rendering
 *    
 *    Note on Bhuvan: Bhuvan layers may experience connectivity issues as they are
 *    hosted on government servers that don't always provide consistent access.
 *    The app will automatically fall back to Esri layers if Bhuvan fails.
 * 
 * 3. Overlay Layers:
 *    - Boundaries: Clear boundaries overlay from Esri that can be added on top of any base layer
 */

// Define the interface for map layers
interface MapLayerConfig {
  url: string;
  attribution: string;
  name: string;
  isOverlay?: boolean;
  tms?: boolean;
  fallbackLayer?: string;
}

// Map tile layer configurations - Only Bhuvan/ISRO layers for official Indian boundaries
// Using multiple endpoints and variations for better reliability
const MAP_LAYERS: Record<string, MapLayerConfig> = {
  // Primary Bhuvan Vector layer
  bhuvan_vector: {
    url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/gmaps?layers=vector&zoom={z}&x={x}&y={y}&format=image/png',
    attribution: '© Bhuvan, ISRO, NRSC | Govt. of India',
    name: 'Bhuvan Vector'
  },
  // Alternative Bhuvan Vector layer from different server
  bhuvan_vector_alt: {
    url: 'https://bhuvan-app3.nrsc.gov.in/bhuvan/gwc/service/gmaps?layers=vector&zoom={z}&x={x}&y={y}&format=image/png',
    attribution: '© Bhuvan, ISRO, NRSC | Govt. of India',
    name: 'Bhuvan Vector (Alt)'
  },
  // Bhuvan satellite imagery
  bhuvan_satellite: {
    url: 'https://bhuvan-app1.nrsc.gov.in/bhuvan/gwc/service/gmaps?layers=bhuvan_imagery2&zoom={z}&x={x}&y={y}&format=image/jpeg',
    attribution: '© Bhuvan, ISRO, NRSC | Govt. of India',
    name: 'Bhuvan Satellite'
  },
  // Alternative satellite imagery from different server
  bhuvan_satellite_alt: {
    url: 'https://bhuvan-app3.nrsc.gov.in/bhuvan/gwc/service/gmaps?layers=bhuvan_imagery2&zoom={z}&x={x}&y={y}&format=image/jpeg',
    attribution: '© Bhuvan, ISRO, NRSC | Govt. of India',
    name: 'Bhuvan Satellite (Alt)'
  },
  // Bhuvan hybrid layer
  bhuvan_hybrid: {
    url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/gmaps?layers=hybrid&zoom={z}&x={x}&y={y}&format=image/png',
    attribution: '© Bhuvan, ISRO, NRSC | Govt. of India',
    name: 'Bhuvan Hybrid'
  },
  // Alternative hybrid layer
  bhuvan_hybrid_alt: {
    url: 'https://bhuvan-app3.nrsc.gov.in/bhuvan/gwc/service/gmaps?layers=hybrid&zoom={z}&x={x}&y={y}&format=image/png',
    attribution: '© Bhuvan, ISRO, NRSC | Govt. of India',
    name: 'Bhuvan Hybrid (Alt)'
  },
  // Bhoonidhi alternative - different ISRO endpoint
  bhoonidhi: {
    url: 'https://bhoonidhi.nrsc.gov.in/bhoonidhi/tiles/wmts?layer=india_lulc&style=default&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}',
    attribution: '© Bhoonidhi, ISRO, NRSC | Govt. of India',
    name: 'Bhoonidhi'
  },
  // Additional Bhoonidhi layer - different product
  bhoonidhi_veg: {
    url: 'https://bhoonidhi.nrsc.gov.in/bhoonidhi/tiles/wmts?layer=veg_fraction&style=default&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}',
    attribution: '© Bhoonidhi, ISRO, NRSC | Govt. of India',
    name: 'Bhoonidhi Vegetation'
  }
}

// Updated interface without map type selection
interface IndiaMapProps {
  onGeometryChange: (geometry: Geometry) => void
  height?: string
  className?: string
  debug?: boolean // Enable debug mode for troubleshooting
}

export default function IndiaMap({ 
  onGeometryChange, 
  height = "600px", 
  className = "", 
  debug = false
}: IndiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentLayer, setCurrentLayer] = useState<string>("bhuvan_vector") // Default to Bhuvan Vector
  const [layerError, setLayerError] = useState<boolean>(false)
  const [debugInfo, setDebugInfo] = useState<{attempts: number, successes: number, layerStatus: Record<string, string>}>({
    attempts: 0,
    successes: 0,
    layerStatus: {}
  })
  
  // This function tries multiple Bhuvan endpoints in sequence if initial ones fail
  const tryNextBhuvanLayer = useCallback((currentLayerKey: string) => {
    if (!mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    const layerKeys = Object.keys(MAP_LAYERS);
    const currentIndex = layerKeys.indexOf(currentLayerKey);
    // Get the next layer in rotation (skip +1 to try a different type)
    const nextLayerToTry = layerKeys[(currentIndex + 2) % layerKeys.length];
    
    console.log(`Systematically trying next Bhuvan layer: ${nextLayerToTry}`);
    
    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    
    // Add a new layer
    const layerConfig = MAP_LAYERS[nextLayerToTry];
    if (layerConfig) {
      const tileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        bounds: INDIA_BOUNDS,
        maxZoom: 18,
        minZoom: 4,
        errorTileUrl: '' // Empty error tile for cleaner appearance
      });
      
      tileLayer.addTo(map);
      setCurrentLayer(nextLayerToTry);
      
      // Update debug info
      if (debug) {
        setDebugInfo(prev => ({
          ...prev,
          layerStatus: {
            ...prev.layerStatus,
            [nextLayerToTry]: 'Trying...'
          }
        }));
      }
    }
  }, [debug])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      maxBounds: INDIA_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 4,
      maxZoom: 18,
      attributionControl: true,
      zoomControl: true
    })
    
    // Store reference to active layers
    const activeLayers: Record<string, L.TileLayer> = {};
    const overlayLayers: Record<string, L.TileLayer> = {};

    // Function to add tile layer with better error handling
    const addTileLayer = (layerKey: string, addToMap = true) => {
      const layer = MAP_LAYERS[layerKey as keyof typeof MAP_LAYERS];
      if (!layer) return null;
      
      const options: L.TileLayerOptions = {
        attribution: layer.attribution,
        bounds: INDIA_BOUNDS,
        maxZoom: 18,
        minZoom: 4,
        errorTileUrl: '', // Handle errors gracefully
      };
      
      if (layer.tms) {
        options.tms = true;
      }
      
      let tileLayer: L.TileLayer;
      
      // Special handling for WMS layers
      if (layerKey === 'bhuvan_wms') {
        // Custom WMS layer handling with proper bbox calculation
        tileLayer = L.tileLayer(layer.url, {
          ...options,
          // This is a workaround for WMS services that require bbox
          tileSize: 256
        });
        
        // Add bounds method to the tileLayer instance directly
        (tileLayer as any).getBounds = function() {
          return INDIA_BOUNDS;
        };
        
        // Override the getTileUrl method to provide proper BBOX parameter for WMS
        (tileLayer as any).getTileUrl = function (coords: any) {
          const zoom = this._getZoomForUrl();
          
          // Convert tile coordinates to lat/lng bounds
          const nwPoint = coords.multiplyBy(256);
          const sePoint = nwPoint.add([256, 256]);
          const nw = map.unproject(nwPoint, zoom);
          const se = map.unproject(sePoint, zoom);
          const bbox = se.lng + ',' + se.lat + ',' + nw.lng + ',' + nw.lat;
          
          return layer.url.replace('{bbox}', bbox);
        };
      } else {
        tileLayer = L.tileLayer(layer.url, options);
      }

      // Enhanced error handling
      let errorCount = 0;
      const errorThreshold = 3; // After 3 errors, consider the layer broken
      
      // Handle tile errors with enhanced debugging
      tileLayer.on('tileerror', () => {
        errorCount++;
        console.warn(`${layer.name} tiles failed to load (${errorCount} failures)`);
        
        // Update debug info
        if (debug) {
          setDebugInfo(prev => ({
            ...prev,
            attempts: prev.attempts + 1,
            layerStatus: {
              ...prev.layerStatus,
              [layerKey]: `Error (${errorCount} failures)`
            }
          }));
        }
        
        // If too many errors, notify but don't switch layers (only Bhuvan layers are used now)
        if (errorCount >= errorThreshold) {
          console.warn(`${layerKey} tiles repeatedly failed`);
          setLayerError(true);
          
          // Update debug info about failure
          if (debug) {
            setDebugInfo(prev => ({
              ...prev,
              layerStatus: {
                ...prev.layerStatus,
                [layerKey]: `Failed to load tiles`
              }
            }));
          }
          
          // Attempt to try another Bhuvan layer if this is the first attempt
          if (layerKey === currentLayer && errorCount === errorThreshold) {              // Get next layer from further in the rotation to try a different server
              const layerKeys = Object.keys(MAP_LAYERS);
              const currentIndex = layerKeys.indexOf(layerKey);
              // Skip ahead by 2 to try a completely different layer type
              const nextLayerToTry = layerKeys[(currentIndex + 2) % layerKeys.length];
              
              if (nextLayerToTry) {
                console.log(`Attempting alternative Bhuvan layer: ${nextLayerToTry}`);
                
                // Remove current layer
                if (addToMap) {
                  map.removeLayer(tileLayer);
                }
                
                // Add alternative layer
                const alternativeLayer = addTileLayer(nextLayerToTry);
                if (alternativeLayer) {
                  alternativeLayer.addTo(map);
                  setCurrentLayer(nextLayerToTry);
                }
              }
          }
        }
      });

      tileLayer.on('tileload', () => {
        // Reset error count when tiles successfully load
        if (errorCount > 0) {
          errorCount = 0;
          setLayerError(false);
          
          // Update debug info
          if (debug) {
            setDebugInfo(prev => ({
              ...prev,
              successes: prev.successes + 1,
              layerStatus: {
                ...prev.layerStatus,
                [layerKey]: 'Loading OK'
              }
            }));
          }
        }
      });
      
      // Store in appropriate collection and add to map if requested
      if (layer.isOverlay) {
        overlayLayers[layerKey] = tileLayer;
      } else if (addToMap) {
        activeLayers[layerKey] = tileLayer;
        tileLayer.addTo(map);
      }

      return tileLayer;
    }

    // Initialize all layers but only add the current one to the map
    Object.keys(MAP_LAYERS).forEach(layerKey => {
      const shouldAddToMap = layerKey === currentLayer;
      addTileLayer(layerKey, shouldAddToMap);
    });

    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup()
    map.addLayer(drawnItems)

    // Add custom CSS to improve the drawing controls appearance
    const style = document.createElement('style')
    style.innerHTML = `
      /* Customize draw controls */
      .leaflet-draw-toolbar a {
        background-color: #000 !important;
        border: 1px solid #0B60B0 !important;
        color: #F0EDCF !important;
      }
      .leaflet-draw-toolbar a:hover {
        background-color: #0B60B0 !important;
      }
      .leaflet-draw-actions a {
        background-color: #000 !important;
        color: #F0EDCF !important;
        border: 1px solid #0B60B0 !important;
      }
      .leaflet-draw-actions a:hover {
        background-color: #0B60B0 !important;
      }
      /* Tooltip styling */
      .leaflet-draw-tooltip {
        background-color: #000 !important;
        border: 1px solid #0B60B0 !important;
        color: #F0EDCF !important;
      }
    `
    document.head.appendChild(style)
    
    // Draw control options with ISRO colors
    const drawControl = new (L.Control as any).Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowSelfIntersection: false,
          showArea: true,
          showLength: false,
          shapeOptions: {
            color: '#0B60B0',
            weight: 3,
            fillColor: '#40A2D8',
            fillOpacity: 0.3
          }
        },
        rectangle: {
          showArea: true,
          shapeOptions: {
            color: '#0B60B0',
            weight: 3,
            fillColor: '#40A2D8',
            fillOpacity: 0.3
          }
        },
        circle: {
          showRadius: true,
          showArea: true,
          shapeOptions: {
            color: '#0B60B0',
            weight: 3,
            fillColor: '#40A2D8',
            fillOpacity: 0.3
          }
        },
        marker: false,
        circlemarker: false,
        polyline: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    })

    map.addControl(drawControl)

    // Handle draw events
    map.on('draw:created' as any, (event: any) => {
      const layer = event.layer
      const type = event.layerType

      // Clear previous drawings (only one AOI at a time)
      drawnItems.clearLayers()
      drawnItems.addLayer(layer)

      // Extract geometry based on type
      let geometry: Geometry

      if (type === 'polygon') {
        const coords = layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lng, latlng.lat])
        coords.push(coords[0]) // Close the polygon
        geometry = {
          type: 'Polygon',
          coordinates: [coords]
        }
      } else if (type === 'rectangle') {
        const bounds = layer.getBounds()
        const coords = [
          [bounds.getWest(), bounds.getSouth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getWest(), bounds.getSouth()]
        ]
        geometry = {
          type: 'Rectangle',
          coordinates: [coords]
        }
      } else if (type === 'circle') {
        const center = layer.getLatLng()
        const radius = layer.getRadius()
        geometry = {
          type: 'Circle',
          coordinates: [], // Not used for circles
          center: [center.lng, center.lat],
          radius: radius
        }
      } else {
        return
      }

      onGeometryChange(geometry)
    })

    // Handle edit and delete events
    map.on('draw:edited' as any, (event: any) => {
      const layers = event.layers
      layers.eachLayer((layer: any) => {
        // Update geometry when edited
        // For simplicity, we'll just trigger the same logic as creation
        const bounds = layer.getBounds?.()
        if (bounds) {
          const coords = [
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
            [bounds.getWest(), bounds.getNorth()],
            [bounds.getWest(), bounds.getSouth()]
          ]
          onGeometryChange({
            type: 'Rectangle',
            coordinates: [coords]
          })
        }
      })
    })

    map.on('draw:deleted' as any, () => {
      // Clear geometry when deleted
      onGeometryChange({
        type: 'Polygon',
        coordinates: []
      })
    })

    // No in-map layer switcher - map type selection moved outside the map
    // We'll update the layer when the mapType prop changes

    mapInstanceRef.current = map
    drawnItemsRef.current = drawnItems
    setIsLoaded(true)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [onGeometryChange, currentLayer, layerError])
  
  // Enhanced effect to periodically check and retry Bhuvan layers if needed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Try an alternative layer immediately if there's an error
    if (layerError) {
      tryNextBhuvanLayer(currentLayer);
      setLayerError(false);
    }
    
    // Set up periodic retry mechanism for Bhuvan layers if they fail
    const retryInterval = setInterval(() => {
      if (layerError && mapInstanceRef.current) {
        console.log("Attempting to refresh Bhuvan layer connection...");
        tryNextBhuvanLayer(currentLayer);
        setLayerError(false);
      }
    }, 30000); // Try every 30 seconds if there's an error
    
    // Also set up a rotation system to try different layers periodically
    // even if there's no error, to find the most reliable one
    const rotationInterval = setInterval(() => {
      if (mapInstanceRef.current && debugInfo.successes < 10) {
        // If we haven't had many successful tile loads, try another layer
        console.log("Proactively trying another Bhuvan layer for better reliability...");
        tryNextBhuvanLayer(currentLayer);
      }
    }, 60000); // Try every minute until we find a reliable layer
    
    return () => {
      clearInterval(retryInterval);
      clearInterval(rotationInterval);
    };
  }, [layerError, currentLayer, tryNextBhuvanLayer, debugInfo.successes])


  
  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="rounded-lg border border-[#0B60B0]/30 z-0"
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-[#F0EDCF] text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B60B0] mx-auto mb-2"></div>
            <p>Loading Map...</p>
          </div>
        </div>
      )}
      
      {/* Drawing instructions - with working close button */}
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
          <p className="text-sm">□ Rectangle  ○ Circle  ⬟ Polygon</p>
        </div>
      </div>
      
      {/* Error handling happens silently in the background */}
      
      {/* Debug panel - collapsible */}
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
            <p className="font-medium text-[#40A2D8]">Debug Info</p>
            <span id="debug-toggle" className="text-[#F0EDCF]">⌄</span>
          </div>
          
          <div id="debug-content" className="p-3 pt-0 border-t border-[#0B60B0]/30" style={{display: 'none'}}>
            <p className="mb-1">Current: <span className="text-[#F0EDCF]">{currentLayer}</span></p>
            <p className="mb-1">Tile attempts: <span className="text-[#F0EDCF]">{debugInfo.attempts}</span></p>
            <p className="mb-1">Tile successes: <span className="text-[#F0EDCF]">{debugInfo.successes}</span></p>
            <div className="mt-2 pt-2 border-t border-[#0B60B0]/30">
              <p className="font-medium mb-1">Layer Status:</p>
              <div className="space-y-1 text-[10px]">
                {Object.entries(debugInfo.layerStatus).map(([key, status]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span> 
                    <span className={status.includes('Failed') ? 'text-red-400' : 'text-green-400'}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
