'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PlusIcon, MoreVerticalIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Property } from '@/lib/supabase'

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/user-properties/${propertyToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete property')
      }

      // Remove the property from the state
      setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id))
      setDeleteDialogOpen(false)
      setPropertyToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPropertyToDelete(null)
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

    if (properties.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <PlusIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by uploading your first property or adding one manually
          </p>
          <Button asChild>
            <Link href="/upload">
              Add Your First Property
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{property.address}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[property.city, property.state, property.zip_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {property.county && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {property.county} County
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(property.created_at).toLocaleDateString()}
                    </p>
                    {property.qoz_status === 'Yes' && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        QOZ
                      </span>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(property)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete Property
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {property.owner && (
                  <div>
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="text-sm font-medium">{property.owner}</p>
                  </div>
                )}
                {property.year_built && (
                  <div>
                    <p className="text-xs text-muted-foreground">Year Built</p>
                    <p className="text-sm font-medium">{property.year_built}</p>
                  </div>
                )}
                {property.assessed_value && (
                  <div>
                    <p className="text-xs text-muted-foreground">Assessed Value</p>
                    <p className="text-sm font-medium">${property.assessed_value.toLocaleString()}</p>
                  </div>
                )}
                {property.last_sale_price && property.last_sale_price > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Last Sale</p>
                    <p className="text-sm font-medium">${property.last_sale_price.toLocaleString()}</p>
                    {property.sale_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(property.sale_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {property.apn && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    APN: {property.apn}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{propertyToDelete?.address}</strong>? 
              This action cannot be undone and will permanently remove the property from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Property'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}