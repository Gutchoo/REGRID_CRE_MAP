'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  TrashIcon,
  SearchIcon,
  XIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ColumnSelector, AVAILABLE_COLUMNS } from './ColumnSelector'
import type { Property } from '@/lib/supabase'

interface MapOverlayTableProps {
  properties: Property[]
  selectedPropertyId: string | null
  onPropertySelect: (id: string) => void
  onRefreshProperty: (property: Property) => void
  onDeleteProperty: (property: Property) => void
  refreshingPropertyId: string | null
}

// Default minimal columns for map overlay
const DEFAULT_MAP_COLUMNS = ['apn', 'address', 'owner', 'county', 'zoning'] as (keyof Property)[]

export function MapOverlayTable({
  properties,
  selectedPropertyId,
  onPropertySelect,
  onRefreshProperty,
  onDeleteProperty,
  refreshingPropertyId
}: MapOverlayTableProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Property>>(() => {
    // Initialize with minimal default columns for map view
    return new Set(DEFAULT_MAP_COLUMNS)
  })
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Load saved column preferences from localStorage (specific to map view)
  useEffect(() => {
    const saved = localStorage.getItem('mapOverlayTableColumns')
    if (saved) {
      try {
        const savedColumns = JSON.parse(saved)
        setVisibleColumns(new Set(savedColumns))
      } catch (error) {
        console.warn('Failed to load saved map overlay column preferences:', error)
      }
    }
  }, [])

  // Save column preferences to localStorage (specific to map view)
  useEffect(() => {
    localStorage.setItem('mapOverlayTableColumns', JSON.stringify(Array.from(visibleColumns)))
  }, [visibleColumns])

  // Multi-field search algorithm (same as PropertyView)
  const searchInProperty = (property: Property, query: string): boolean => {
    if (!query.trim()) return true
    
    const lowerQuery = query.toLowerCase().trim()
    const searchableFields = [
      property.address,
      property.city,
      property.state, 
      property.zip_code,
      property.owner,
      property.apn,
      property.county,
      property.zoning,
      property.use_description,
      property.subdivision,
      property.use_code,
      property.zoning_description
    ]
    
    return searchableFields.some(field => 
      field?.toLowerCase().includes(lowerQuery)
    )
  }

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    return properties.filter(property => searchInProperty(property, searchQuery))
  }, [properties, searchQuery])

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (value: number | null) => {
    if (!value) return '-'
    return value.toLocaleString()
  }

  const renderCellContent = (property: Property, columnKey: keyof Property) => {
    const value = property[columnKey]
    
    switch (columnKey) {
      case 'address':
        return (
          <div className="max-w-[200px] truncate font-medium" title={String(value) || ''}>
            {String(value) || '-'}
          </div>
        )
      case 'apn':
        return value ? (
          <span className="font-mono text-xs">{String(value)}</span>
        ) : '-'
      case 'owner':
        return (
          <div className="max-w-[150px] truncate" title={String(value) || ''}>
            {String(value) || '-'}
          </div>
        )
      case 'assessed_value':
      case 'improvement_value':
      case 'land_value':
      case 'last_sale_price':
        return <span className="font-mono text-sm">{formatCurrency(value as number)}</span>
      case 'sale_date':
      case 'created_at':
        return formatDate(value as string)
      case 'lot_size_acres':
        return value ? `${(value as number).toFixed(2)} ac` : '-'
      case 'lot_size_sqft':
        return formatNumber(value as number)
      case 'qoz_status':
        return value === 'Yes' ? (
          <Badge variant="secondary" className="text-xs">QOZ</Badge>
        ) : '-'
      case 'tags':
        const tags = value as string[] | null
        return tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">+{tags.length - 2}</Badge>
            )}
          </div>
        ) : '-'
      case 'user_notes':
        return value ? (
          <div className="max-w-[100px] truncate" title={String(value)}>
            {String(value)}
          </div>
        ) : '-'
      default:
        return String(value) || '-'
    }
  }

  // Get visible column definitions
  const visibleColumnDefs = AVAILABLE_COLUMNS.filter(col => visibleColumns.has(col.key))

  const handleRowClick = (propertyId: string) => {
    onPropertySelect(propertyId)
  }

  if (properties.length === 0) {
    return null // Don't show overlay if no properties
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        {/* Header */}
        <div className="p-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">
                Properties ({searchQuery.trim() ? `${filteredProperties.length}/${properties.length}` : properties.length})
              </h3>
              {selectedPropertyId && (
                <Badge variant="outline" className="text-xs">
                  1 selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ColumnSelector 
                visibleColumns={visibleColumns} 
                onColumnsChange={setVisibleColumns} 
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Search Input */}
          {!isMinimized && (
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-7 pr-7 h-7 text-xs"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 hover:bg-muted"
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Table Content */}
        {!isMinimized && (
          <div className="max-h-64 overflow-auto">
            {filteredProperties.length === 0 && searchQuery.trim().length > 0 ? (
              <div className="text-center py-8">
                <SearchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No properties match &quot;{searchQuery}&quot;
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearchChange('')}
                  className="mt-2 h-auto p-1 text-xs"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    {visibleColumnDefs.map((column) => {
                      const isAddress = column.key === 'address'
                      const isFinancial = ['assessed_value', 'improvement_value', 'land_value', 'last_sale_price'].includes(column.key)
                      
                      return (
                        <TableHead 
                          key={column.key}
                          className={`${
                            isAddress ? 'min-w-[200px]' : ''
                          } ${
                            isFinancial ? 'text-right' : ''
                          } text-xs`}
                        >
                          {column.label}
                        </TableHead>
                      )
                    })}
                    
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow 
                      key={property.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedPropertyId === property.id ? 'bg-primary/10 border-primary/20' : ''
                      }`}
                      onClick={() => handleRowClick(property.id)}
                    >
                      {visibleColumnDefs.map((column) => {
                        const isFinancial = ['assessed_value', 'improvement_value', 'land_value', 'last_sale_price'].includes(column.key)
                        
                        return (
                          <TableCell 
                            key={column.key} 
                            className={`${isFinancial ? 'text-right' : ''} text-xs py-2`}
                          >
                            {renderCellContent(property, column.key)}
                          </TableCell>
                        )
                      })}
                      
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontalIcon className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onRefreshProperty(property)
                              }}
                              disabled={refreshingPropertyId === property.id || !property.apn}
                              className="focus:bg-blue-50"
                            >
                              <RefreshCwIcon className={`mr-2 h-3 w-3 ${
                                refreshingPropertyId === property.id ? 'animate-spin' : ''
                              }`} />
                              {refreshingPropertyId === property.id ? 'Refreshing...' : 'Refresh'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteProperty(property)
                              }}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <TrashIcon className="mr-2 h-3 w-3" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Footer with instructions */}
        {!isMinimized && filteredProperties.length > 0 && (
          <div className="p-2 border-t bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              Click any row to center map on that property
              {searchQuery.trim() && ` • ${filteredProperties.length} of ${properties.length} properties shown`}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}