'use client'

import { useEffect, useState } from 'react'
import type { Property } from '@/lib/supabase'
import { FullScreenMapView } from '@/components/properties/FullScreenMapView'

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch('/api/user-properties')
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }
        const data = await response.json()
        setProperties(data.properties || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties')
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId)
  }

  const handlePropertiesChange = (updatedProperties: Property[]) => {
    setProperties(updatedProperties)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] pt-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-6rem)] pt-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-6rem)] pt-4 -mx-4">
      <FullScreenMapView
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertySelect={handlePropertySelect}
        onPropertiesChange={handlePropertiesChange}
        onError={handleError}
      />
    </div>
  )
}