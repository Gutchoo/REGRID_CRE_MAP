'use client'

import { useState, useEffect } from 'react'
import { PropertyViewToggle } from './PropertyViewToggle'
import { PropertyCardView } from './PropertyCardView'
import { PropertyTableView } from './PropertyTableView'
import { BulkActionBar } from './BulkActionBar'
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
import type { Property } from '@/lib/supabase'

type ViewMode = 'cards' | 'table'

interface PropertyViewProps {
  properties: Property[]
  onPropertiesChange: (properties: Property[]) => void
  onError: (error: string) => void
}

export function PropertyView({ properties, onPropertiesChange, onError }: PropertyViewProps) {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  
  // Action states
  const [refreshingPropertyId, setRefreshingPropertyId] = useState<string | null>(null)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load saved view preference
  useEffect(() => {
    const savedView = localStorage.getItem('property-view-mode')
    if (savedView === 'cards' || savedView === 'table') {
      setViewMode(savedView)
    }
  }, [])

  // Save view preference
  const handleViewChange = (view: ViewMode) => {
    setViewMode(view)
    localStorage.setItem('property-view-mode', view)
    // Clear selections when switching views
    setSelectedRows(new Set())
  }

  // Card expansion
  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  // Row selection
  const handleRowSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedRows)
    if (selected) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(properties.map(p => p.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  // Single property refresh
  const handleRefreshClick = async (property: Property) => {
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

  // Single property delete
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

      // Remove the property from the list
      const updatedProperties = properties.filter(p => p.id !== propertyToDelete.id)
      onPropertiesChange(updatedProperties)
      
      // Remove from selections
      const newSelected = new Set(selectedRows)
      newSelected.delete(propertyToDelete.id)
      setSelectedRows(newSelected)
      
      setDeleteDialogOpen(false)
      setPropertyToDelete(null)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete property')
    } finally {
      setIsDeleting(false)
    }
  }

  // Bulk operations
  const handleBulkRefresh = async () => {
    setBulkProcessing(true)
    const selectedProperties = properties.filter(p => selectedRows.has(p.id))
    let successCount = 0
    let errorCount = 0

    try {
      for (const property of selectedProperties) {
        try {
          await handleRefreshClick(property)
          successCount++
        } catch (err) {
          console.error(`Failed to refresh ${property.address}:`, err)
          errorCount++
        }
      }

      if (errorCount > 0) {
        onError(`Refreshed ${successCount} properties, ${errorCount} failed`)
      }
    } finally {
      setBulkProcessing(false)
      setSelectedRows(new Set()) // Clear selection after bulk operation
    }
  }

  const handleBulkDeleteClick = () => {
    setBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    setBulkProcessing(true)
    const selectedIds = Array.from(selectedRows)

    try {
      const deletePromises = selectedIds.map(id =>
        fetch(`/api/user-properties/${id}`, { method: 'DELETE' })
      )

      const results = await Promise.allSettled(deletePromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.length - successful

      // Remove successfully deleted properties
      const updatedProperties = properties.filter(p => !selectedIds.includes(p.id))
      onPropertiesChange(updatedProperties)
      
      setSelectedRows(new Set())
      setBulkDeleteDialogOpen(false)

      if (failed > 0) {
        onError(`Deleted ${successful} properties, ${failed} failed`)
      }
    } catch (err) {
      onError('Failed to delete properties')
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedRows(new Set())
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <PropertyViewToggle currentView={viewMode} onViewChange={handleViewChange} />
        {viewMode === 'table' && selectedRows.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedRows.size} of {properties.length} selected
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'cards' ? (
        <PropertyCardView
          properties={properties}
          expandedCards={expandedCards}
          onToggleExpand={handleToggleExpand}
          onRefresh={handleRefreshClick}
          onDelete={handleDeleteClick}
          refreshingPropertyId={refreshingPropertyId}
        />
      ) : (
        <PropertyTableView
          properties={properties}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          onSelectAll={handleSelectAll}
          onRefresh={handleRefreshClick}
          onDelete={handleDeleteClick}
          refreshingPropertyId={refreshingPropertyId}
        />
      )}

      {/* Bulk Action Bar */}
      {viewMode === 'table' && (
        <BulkActionBar
          selectedCount={selectedRows.size}
          onBulkRefresh={handleBulkRefresh}
          onBulkDelete={handleBulkDeleteClick}
          onClearSelection={handleClearSelection}
          isProcessing={bulkProcessing}
        />
      )}

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{propertyToDelete?.address}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Property'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Properties</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.size} properties? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={bulkProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkProcessing ? 'Deleting...' : `Delete ${selectedRows.size} Properties`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}