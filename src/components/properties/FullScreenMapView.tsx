'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Property } from '@/lib/supabase'
import { MapOverlayTable } from './MapOverlayTable'

interface FullScreenMapViewProps {
  properties: Property[]
  selectedPropertyId: string | null
  onPropertySelect: (id: string) => void
  onPropertiesChange: (properties: Property[]) => void
  onError: (error: string) => void
}

// Set the Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

// Custom style switcher control class
class StyleSwitcherControl {
  private map: mapboxgl.Map | undefined
  private container: HTMLDivElement | undefined
  private button: HTMLButtonElement | undefined
  private isSatellite: boolean = true
  private onStyleChange: () => void

  constructor(onStyleChange: () => void) {
    this.onStyleChange = onStyleChange
  }

  onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map
    this.container = document.createElement('div')
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
    
    this.button = document.createElement('button')
    this.button.className = 'mapboxgl-ctrl-icon'
    this.button.type = 'button'
    this.button.title = 'Toggle satellite/street view'
    this.button.innerHTML = '🛰️'
    this.button.style.fontSize = '16px'
    this.button.style.display = 'flex'
    this.button.style.alignItems = 'center'
    this.button.style.justifyContent = 'center'
    
    this.button.addEventListener('click', () => {
      this.toggleStyle()
    })
    
    this.container.appendChild(this.button)
    return this.container
  }

  onRemove(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.map = undefined
  }

  toggleStyle(): void {
    if (!this.map) return

    const newStyle = this.isSatellite 
      ? 'mapbox://styles/mapbox/streets-v12'
      : 'mapbox://styles/mapbox/satellite-streets-v12'
    
    this.map.setStyle(newStyle)
    this.isSatellite = !this.isSatellite
    
    if (this.button) {
      this.button.innerHTML = this.isSatellite ? '🛰️' : '🗺️'
      this.button.title = this.isSatellite ? 'Switch to street view' : 'Switch to satellite view'
    }
    
    // Notify parent component that style is changing
    this.onStyleChange()
  }
}

export function FullScreenMapView({
  properties,
  selectedPropertyId,
  onPropertySelect,
  onPropertiesChange,
  onError
}: FullScreenMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshingPropertyId, setRefreshingPropertyId] = useState<string | null>(null)
  const [eventHandlersSet, setEventHandlersSet] = useState(false)

  // Calculate map center from properties with coordinates
  const getMapCenter = (): [number, number] => {
    const propertiesWithCoords = properties.filter(p => p.lat && p.lng)
    
    if (propertiesWithCoords.length === 0) {
      // Default to center of US if no coordinates
      return [-98.5795, 39.8283]
    }
    
    if (propertiesWithCoords.length === 1) {
      return [propertiesWithCoords[0].lng!, propertiesWithCoords[0].lat!]
    }
    
    // Calculate centroid of all properties
    const avgLng = propertiesWithCoords.reduce((sum, p) => sum + p.lng!, 0) / propertiesWithCoords.length
    const avgLat = propertiesWithCoords.reduce((sum, p) => sum + p.lat!, 0) / propertiesWithCoords.length
    
    return [avgLng, avgLat]
  }

  // Transform properties to GeoJSON format
  const createGeoJSONData = () => {
    const features = properties
      .filter(property => property.geometry && property.lat && property.lng)
      .map(property => ({
        type: 'Feature' as const,
        geometry: property.geometry as GeoJSON.Geometry,
        properties: {
          // Basic info
          id: property.id,
          address: property.address,
          city: property.city,
          state: property.state,
          zip_code: property.zip_code,
          apn: property.apn,
          county: property.county,
          lat: property.lat,
          lng: property.lng,
          
          // Owner info
          owner: property.owner,
          owner_mailing_address: property.owner_mailing_address,
          owner_mail_city: property.owner_mail_city,
          owner_mail_state: property.owner_mail_state,
          owner_mail_zip: property.owner_mail_zip,
          
          // Property details
          year_built: property.year_built,
          num_stories: property.num_stories,
          num_units: property.num_units,
          num_rooms: property.num_rooms,
          subdivision: property.subdivision,
          lot_size_acres: property.lot_size_acres,
          lot_size_sqft: property.lot_size_sqft,
          
          // Use and zoning
          use_code: property.use_code,
          use_description: property.use_description,
          zoning: property.zoning,
          zoning_description: property.zoning_description,
          
          // Financial data
          assessed_value: property.assessed_value,
          land_value: property.land_value,
          improvement_value: property.improvement_value,
          last_sale_price: property.last_sale_price,
          sale_date: property.sale_date,
          tax_year: property.tax_year,
          parcel_value_type: property.parcel_value_type,
          
          // Location data
          census_tract: property.census_tract,
          census_block: property.census_block,
          qoz_status: property.qoz_status,
          qoz_tract: property.qoz_tract,
          
          // User data
          user_notes: property.user_notes,
          tags: property.tags,
          insurance_provider: property.insurance_provider,
          maintenance_history: property.maintenance_history,
          
          // Timestamps
          created_at: property.created_at,
          updated_at: property.updated_at,
          last_refresh_date: property.last_refresh_date,
          
          // Selection state
          isSelected: selectedPropertyId === property.id
        }
      }))

    return {
      type: 'FeatureCollection' as const,
      features
    }
  }

  // Center map on specific property
  const centerOnProperty = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId)
    if (property && property.lat && property.lng && map.current) {
      map.current.flyTo({
        center: [property.lng, property.lat],
        zoom: 16,
        duration: 1500
      })
    }
  }

  // Set up property interaction event handlers (only once)
  const setupPropertyEventHandlers = () => {
    if (!map.current || eventHandlersSet) return

    // Track hovered property ID
    let hoveredPropertyId: string | null = null

    // Add hover effect
    map.current.on('mouseenter', 'property-fills', (e) => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer'
        
        if (e.features && e.features[0]) {
          hoveredPropertyId = e.features[0].properties?.id || null
          if (hoveredPropertyId) {
            // Show hover outline for this property
            map.current.setFilter('property-outlines-hover', ['==', 'id', hoveredPropertyId])
          }
        }
      }
    })

    map.current.on('mouseleave', 'property-fills', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = ''
        
        // Hide hover outline
        map.current.setFilter('property-outlines-hover', ['==', 'id', ''])
        hoveredPropertyId = null
      }
    })

    // Add click handler for property selection and popup
    map.current.on('click', 'property-fills', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0]
        const props = feature.properties
        const propertyId = props?.id
        
        if (propertyId) {
          // Select property (this will update the table)
          onPropertySelect(propertyId)
          
          // Remove existing popups
          const existingPopups = document.querySelectorAll('.mapboxgl-popup')
          existingPopups.forEach(popup => popup.remove())

          if (e.lngLat) {
            // Format lot size values
            const lotSqft = props.lot_size_sqft ? props.lot_size_sqft.toLocaleString() : 'N/A'
            const lotAcres = props.lot_size_acres ? props.lot_size_acres.toFixed(2) : 'N/A'

            new mapboxgl.Popup({ 
              closeButton: true, 
              closeOnClick: true,
              maxWidth: '300px'
            })
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="padding: 16px; font-family: system-ui, -apple-system, sans-serif; min-width: 250px;">
                  <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
                    ${props.address || 'Property Details'}
                  </h3>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-weight: 500; color: #374151;">APN:</span>
                      <span style="color: #6b7280; font-family: monospace; font-size: 14px;">${props.apn || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-weight: 500; color: #374151;">Owner:</span>
                      <span style="color: #6b7280; text-align: right; max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${props.owner || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-weight: 500; color: #374151;">Lot Size (Sq Ft):</span>
                      <span style="color: #6b7280; font-family: monospace;">${lotSqft}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-weight: 500; color: #374151;">Lot Size (Acres):</span>
                      <span style="color: #6b7280; font-family: monospace;">${lotAcres}</span>
                    </div>
                  </div>
                </div>
              `)
              .addTo(map.current)
          }
        }
      }
    })

    setEventHandlersSet(true)
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    if (!mapboxgl.accessToken) {
      setError('Mapbox access token is not configured')
      setIsLoading(false)
      return
    }

    try {
      const [centerLng, centerLat] = getMapCenter()
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Default to satellite view for property parcels
        center: [centerLng, centerLat],
        zoom: properties.length > 0 ? 12 : 4,
        antialias: true
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      // Add style switcher control
      const styleSwitcher = new StyleSwitcherControl(() => {
        // This callback will be called when style changes
        // Property layers will be re-added automatically via the styledata event
      })
      map.current.addControl(styleSwitcher, 'top-left')

      map.current.on('load', () => {
        setIsLoading(false)
        addPropertyLayers()
        setupPropertyEventHandlers()
      })

      // Re-add property layers when style changes
      map.current.on('styledata', () => {
        // Only re-add layers if the style has fully loaded and we have properties
        if (map.current && map.current.isStyleLoaded() && properties.length > 0) {
          // Small delay to ensure style is fully loaded
          setTimeout(() => {
            addPropertyLayers()
          }, 100)
        }
      })

      map.current.on('error', (e) => {
        console.error('Mapbox GL error:', e)
        setError('Failed to load map')
        setIsLoading(false)
      })

    } catch (err) {
      console.error('Error initializing map:', err)
      setError('Failed to initialize map')
      setIsLoading(false)
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, []) // Empty dependency array for initialization only

  // Add property layers to map
  const addPropertyLayers = () => {
    if (!map.current) return

    const geoJsonData = createGeoJSONData()
    
    if (geoJsonData.features.length === 0) {
      return // No properties with geometry data
    }

    // Add or update property polygons source
    if (map.current.getSource('properties')) {
      // Update existing source
      const source = map.current.getSource('properties') as mapboxgl.GeoJSONSource
      source.setData(geoJsonData)
    } else {
      // Add new source
      map.current.addSource('properties', {
        type: 'geojson',
        data: geoJsonData
      })
    }

    // Add fill layer for property polygons (transparent fill for click detection)
    if (!map.current.getLayer('property-fills')) {
      map.current.addLayer({
        id: 'property-fills',
        type: 'fill',
        source: 'properties',
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': 0
        }
      })
    }

    // Add outline layer for property polygons
    if (!map.current.getLayer('property-outlines')) {
      map.current.addLayer({
        id: 'property-outlines',
        type: 'line',
        source: 'properties',
        paint: {
          'line-color': [
            'case',
            ['get', 'isSelected'], '#1d4ed8', // Darker blue for selected outlines
            '#FFD700' // Bright yellow for unselected outlines
          ],
          'line-width': 2
        }
      })
    }

    // Add hover outline layer
    if (!map.current.getLayer('property-outlines-hover')) {
      map.current.addLayer({
        id: 'property-outlines-hover',
        type: 'line',
        source: 'properties',
        paint: {
          'line-color': '#3B82F6', // Blue hover color
          'line-width': 3
        },
        filter: ['==', 'id', ''] // Initially show nothing
      })
    }


    // Fit map bounds to show all properties
    if (geoJsonData.features.length > 1) {
      const coordinates = geoJsonData.features.flatMap(feature => {
        if (feature.geometry.type === 'Polygon') {
          return feature.geometry.coordinates[0]
        }
        return []
      })

      if (coordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        coordinates.forEach(coord => bounds.extend(coord as [number, number]))
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        })
      }
    }
  }

  // Update property layers when selection changes
  useEffect(() => {
    if (!map.current || !map.current.getSource('properties')) return

    const geoJsonData = createGeoJSONData()
    const source = map.current.getSource('properties') as mapboxgl.GeoJSONSource
    source.setData(geoJsonData)
  }, [selectedPropertyId, properties])

  // Center on property when selectedPropertyId changes from table
  useEffect(() => {
    if (selectedPropertyId) {
      centerOnProperty(selectedPropertyId)
    }
  }, [selectedPropertyId])

  // Handle property refresh
  const handleRefreshProperty = async (property: Property) => {
    if (!property.apn) {
      onError('Cannot refresh property: No APN available')
      return
    }

    setRefreshingPropertyId(property.id)

    try {
      const response = await fetch(`/api/user-properties/${property.id}/refresh`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refresh property')
      }

      const result = await response.json()
      
      // Update the property in the list
      const updatedProperties = properties.map(p => 
        p.id === property.id ? result.property : p
      )
      onPropertiesChange(updatedProperties)

    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to refresh property data')
    } finally {
      setRefreshingPropertyId(null)
    }
  }

  // Handle property delete
  const handleDeleteProperty = async (property: Property) => {
    try {
      const response = await fetch(`/api/user-properties/${property.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete property')
      }

      // Remove the property from the list
      const updatedProperties = properties.filter(p => p.id !== property.id)
      onPropertiesChange(updatedProperties)

      // Clear selection if this property was selected
      if (selectedPropertyId === property.id) {
        onPropertySelect('')
      }

    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete property')
    }
  }

  if (properties.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl">🗺️</span>
          </div>
          <h3 className="text-lg font-medium mb-2">No properties to display</h3>
          <p className="text-muted-foreground">
            Add properties to see them visualized on the map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-destructive/10">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium mb-2 text-destructive">Map Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapContainer} 
        className={`h-full w-full ${error ? 'hidden' : ''}`}
      />

      {/* Overlay Table */}
      {!error && (
        <MapOverlayTable
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          onPropertySelect={onPropertySelect}
          onRefreshProperty={handleRefreshProperty}
          onDeleteProperty={handleDeleteProperty}
          refreshingPropertyId={refreshingPropertyId}
        />
      )}
    </div>
  )
}