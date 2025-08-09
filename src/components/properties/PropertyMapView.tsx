'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Property } from '@/lib/supabase'

interface PropertyMapViewProps {
  properties: Property[]
  selectedRows: Set<string>
  onRowSelect: (id: string, selected: boolean) => void
  onRefresh: (property: Property) => void
  onDelete: (property: Property) => void
  refreshingPropertyId: string | null
}

// Set the Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

export function PropertyMapView({
  properties,
  selectedRows,
  onRowSelect,
  onRefresh,
  onDelete,
  refreshingPropertyId
}: PropertyMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          isSelected: selectedRows.has(property.id)
        }
      }))

    return {
      type: 'FeatureCollection' as const,
      features
    }
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
      const styleControl = document.createElement('div')
      styleControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
      styleControl.innerHTML = `
        <button type="button" title="Toggle satellite/street view" class="mapboxgl-ctrl-icon" id="style-toggle">
          🛰️
        </button>
      `
      map.current.getContainer().appendChild(styleControl)

      let isSatellite = true
      document.getElementById('style-toggle')?.addEventListener('click', () => {
        if (map.current) {
          const newStyle = isSatellite 
            ? 'mapbox://styles/mapbox/streets-v12'
            : 'mapbox://styles/mapbox/satellite-streets-v12'
          
          map.current.setStyle(newStyle)
          isSatellite = !isSatellite
          
          const button = document.getElementById('style-toggle')
          if (button) {
            button.innerHTML = isSatellite ? '🛰️' : '🗺️'
          }
        }
      })

      map.current.on('load', () => {
        setIsLoading(false)
        addPropertyLayers()
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

    // Add property polygons source
    map.current.addSource('properties', {
      type: 'geojson',
      data: geoJsonData
    })

    // Add fill layer for property polygons (transparent fill for click detection)
    map.current.addLayer({
      id: 'property-fills',
      type: 'fill',
      source: 'properties',
      paint: {
        'fill-color': 'transparent',
        'fill-opacity': 0
      }
    })

    // Add outline layer for property polygons
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

    // Add hover outline layer
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
          const isCurrentlySelected = selectedRows.has(propertyId)
          onRowSelect(propertyId, !isCurrentlySelected)

          // Create popup content
          const formatCurrency = (value: number | null) => {
            if (!value) return 'N/A'
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)
          }

          const formatNumber = (value: number | null) => {
            if (!value) return 'N/A'
            return value.toLocaleString()
          }

          const formatDate = (dateString: string | null) => {
            if (!dateString) return 'N/A'
            return new Date(dateString).toLocaleDateString()
          }

          const formatCoordinate = (value: number | null) => {
            if (!value) return 'N/A'
            return value.toFixed(6)
          }

          // Build comprehensive popup content
          const basicInfo = `
            <div style="margin-bottom: 12px;">
              <h3 style="font-weight: bold; font-size: 13px; color: #1f2937; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">📍 BASIC INFORMATION</h3>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Address:</span> ${props.address || 'N/A'}</p>
                <p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">City:</span> ${props.city || 'N/A'}, ${props.state || 'N/A'} ${props.zip_code || ''}</p>
                <p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">APN:</span> ${props.apn || 'N/A'}</p>
                <p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">County:</span> ${props.county || 'N/A'}</p>
                <p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Coordinates:</span> ${formatCoordinate(props.lat)}, ${formatCoordinate(props.lng)}</p>
              </div>
            </div>
          `

          const propertyDetails = `
            <div style="margin-bottom: 12px;">
              <h3 style="font-weight: bold; font-size: 12px; color: #1f2937; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">🏠 PROPERTY DETAILS</h3>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${props.year_built ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Year Built:</span> ${props.year_built}</p>` : ''}
                ${props.num_stories ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Stories:</span> ${props.num_stories}</p>` : ''}
                ${props.num_units ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Units:</span> ${props.num_units}</p>` : ''}
                ${props.num_rooms ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Rooms:</span> ${props.num_rooms}</p>` : ''}
                ${props.subdivision ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Subdivision:</span> ${props.subdivision}</p>` : ''}
                ${props.lot_size_acres ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Lot Size:</span> ${props.lot_size_acres.toFixed(2)} acres</p>` : ''}
                ${props.lot_size_sqft ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Lot Size:</span> ${formatNumber(props.lot_size_sqft)} sqft</p>` : ''}
              </div>
            </div>
          `

          const useZoning = `
            <div style="margin-bottom: 12px;">
              <h3 style="font-weight: bold; font-size: 12px; color: #1f2937; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">🏢 USE & ZONING</h3>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${props.use_code ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Use Code:</span> ${props.use_code}</p>` : ''}
                ${props.use_description ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Use:</span> ${props.use_description}</p>` : ''}
                ${props.zoning ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Zoning:</span> ${props.zoning}</p>` : ''}
                ${props.zoning_description ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Zoning Desc:</span> ${props.zoning_description}</p>` : ''}
              </div>
            </div>
          `

          const financialData = `
            <div style="margin-bottom: 12px;">
              <h3 style="font-weight: bold; font-size: 12px; color: #1f2937; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">💰 FINANCIAL DATA</h3>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${props.assessed_value ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Assessed Value:</span> ${formatCurrency(props.assessed_value)}</p>` : ''}
                ${props.land_value ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Land Value:</span> ${formatCurrency(props.land_value)}</p>` : ''}
                ${props.improvement_value ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Improvement Value:</span> ${formatCurrency(props.improvement_value)}</p>` : ''}
                ${props.last_sale_price ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Last Sale:</span> ${formatCurrency(props.last_sale_price)} (${formatDate(props.sale_date)})</p>` : ''}
                ${props.tax_year ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Tax Year:</span> ${props.tax_year}</p>` : ''}
              </div>
            </div>
          `

          const locationData = `
            <div style="margin-bottom: 12px;">
              <h3 style="font-weight: bold; font-size: 12px; color: #1f2937; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">📊 LOCATION DATA</h3>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${props.census_tract ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Census Tract:</span> ${props.census_tract}</p>` : ''}
                ${props.census_block ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Census Block:</span> ${props.census_block}</p>` : ''}
                ${props.qoz_status === 'Yes' ? `<p style="margin: 0; font-size: 12px; color: #2563eb; font-weight: 500;">🏢 Qualified Opportunity Zone</p>` : ''}
                ${props.qoz_tract ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">QOZ Tract:</span> ${props.qoz_tract}</p>` : ''}
              </div>
            </div>
          `

          const ownerInfo = `
            <div style="margin-bottom: 12px;">
              <h3 style="font-weight: bold; font-size: 12px; color: #1f2937; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">👤 OWNER INFORMATION</h3>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${props.owner ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Owner:</span> ${props.owner}</p>` : ''}
                ${props.owner_mailing_address ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Mailing Address:</span> ${props.owner_mailing_address}</p>` : ''}
                ${props.owner_mail_city && props.owner_mail_state ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Mail City:</span> ${props.owner_mail_city}, ${props.owner_mail_state} ${props.owner_mail_zip || ''}</p>` : ''}
              </div>
            </div>
          `

          const userData = props.user_notes || props.tags || props.insurance_provider ? `
            <div style="margin-bottom: 12px;">
              <h3 style="font-weight: bold; font-size: 12px; color: #1f2937; margin: 0 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #d1d5db;">📝 USER DATA</h3>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${props.user_notes ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Notes:</span> ${props.user_notes}</p>` : ''}
                ${props.insurance_provider ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Insurance:</span> ${props.insurance_provider}</p>` : ''}
                ${props.tags && props.tags.length > 0 ? `<p style="margin: 0; font-size: 12px;"><span style="font-weight: 500; color: #4b5563;">Tags:</span> ${props.tags.join(', ')}</p>` : ''}
              </div>
            </div>
          ` : ''

          const isMobile = window.innerWidth < 768
          const popupContent = `
            <style>
              .property-popup .mapboxgl-popup-content {
                padding: 0 !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
                border: 1px solid #e5e7eb !important;
                max-width: ${isMobile ? '280px' : '400px'} !important;
              }
              .property-popup .mapboxgl-popup-tip {
                border-top-color: #ffffff !important;
              }
              .property-popup .mapboxgl-popup-close-button {
                font-size: 18px !important;
                padding: 8px !important;
                color: #6b7280 !important;
              }
              .property-popup .mapboxgl-popup-close-button:hover {
                background: #f3f4f6 !important;
                color: #374151 !important;
              }
              @media (max-width: 768px) {
                .property-popup .mapboxgl-popup-content {
                  max-width: 280px !important;
                }
              }
            </style>
            <div style="padding: ${isMobile ? '12px' : '16px'}; background: white; border-radius: 12px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="text-align: center; margin-bottom: ${isMobile ? '10px' : '12px'}; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">
                <h2 style="font-weight: bold; font-size: ${isMobile ? '14px' : '16px'}; color: #111827; margin: 0; line-height: 1.3;">${props.address || 'Property Details'}</h2>
                <p style="font-size: ${isMobile ? '11px' : '12px'}; color: #6b7280; margin: 4px 0 0 0;">Click to ${isCurrentlySelected ? 'deselect' : 'select'} property</p>
              </div>
              
              <div style="max-height: ${isMobile ? '300px' : '400px'}; overflow-y: auto; padding-right: 4px; scrollbar-width: thin;">
                <div style="display: flex; flex-direction: column; gap: ${isMobile ? '10px' : '12px'};">
                  ${basicInfo}
                  ${propertyDetails}
                  ${useZoning}
                  ${financialData}
                  ${locationData}
                  ${ownerInfo}
                  ${userData}
                </div>
              </div>
              
              <div style="margin-top: ${isMobile ? '10px' : '12px'}; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: ${isMobile ? '11px' : '12px'}; color: #6b7280; text-align: center;">
                💡 Use bulk action controls to refresh or delete multiple properties
              </div>
            </div>
          `

          // Remove existing popups
          const existingPopups = document.querySelectorAll('.mapboxgl-popup')
          existingPopups.forEach(popup => popup.remove())

          // Add popup with responsive sizing
          if (e.lngLat) {
            const isMobile = window.innerWidth < 768
            new mapboxgl.Popup({ 
              closeButton: true, 
              closeOnClick: false, // Don't auto-close on click to allow scrolling
              maxWidth: isMobile ? '280px' : '400px',
              className: 'property-popup',
              anchor: isMobile ? 'bottom' : 'auto' // Bottom anchor on mobile for better positioning
            })
              .setLngLat(e.lngLat)
              .setHTML(popupContent)
              .addTo(map.current)
          }
        }
      }
    })

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
  }, [selectedRows, properties])

  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-muted">
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
    <div className="relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center h-96 border rounded-lg bg-destructive/10">
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
        className={`h-96 md:h-[500px] lg:h-[600px] w-full rounded-lg overflow-hidden border ${error ? 'hidden' : ''}`}
        style={{ minHeight: '400px' }}
      />

      {/* Map legend and info */}
      {!error && (
        <div className="absolute bottom-4 left-4 space-y-2">
          {/* Property count indicator */}
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
            <p className="text-sm text-muted-foreground">
              {createGeoJSONData().features.length} of {properties.length} properties shown
            </p>
          </div>
          
          {/* Map legend */}
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded border border-green-600 opacity-60"></div>
                <span className="text-muted-foreground">Unselected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded border border-blue-600 opacity-60"></div>
                <span className="text-muted-foreground">Selected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected properties info */}
      {!error && selectedRows.size > 0 && (
        <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border text-primary-foreground">
          <p className="text-sm font-medium">
            {selectedRows.size} selected
          </p>
        </div>
      )}
    </div>
  )
}