'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Property } from '@/lib/supabase'
import { PropertyView } from '@/components/properties/PropertyView'

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handlePropertiesChange = (updatedProperties: Property[]) => {
    setProperties(updatedProperties)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your properties...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      )
    }

    return (
      <PropertyView
        properties={properties}
        onPropertiesChange={handlePropertiesChange}
        onError={handleError}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage your real estate portfolio ({properties.length} {properties.length === 1 ? 'property' : 'properties'})
          </p>
        </div>
        <Button asChild>
          <Link href="/upload" className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Properties
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Portfolio</CardTitle>
          <CardDescription>
            View and manage all your properties in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

    </div>
  )
}