'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  TrashIcon
} from 'lucide-react'
import type { Property } from '@/lib/supabase'
import { ColumnSelector, AVAILABLE_COLUMNS } from './ColumnSelector'

type SortField = keyof Property
type SortDirection = 'asc' | 'desc' | null

interface SortConfig {
  field: SortField | null
  direction: SortDirection
}

interface PropertyTableViewProps {
  properties: Property[]
  selectedRows: Set<string>
  onRowSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onRefresh: (property: Property) => void
  onDelete: (property: Property) => void
  refreshingPropertyId: string | null
}

export function PropertyTableView({
  properties,
  selectedRows,
  onRowSelect,
  onSelectAll,
  onRefresh,
  onDelete,
  refreshingPropertyId
}: PropertyTableViewProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null })
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Property>>(() => {
    // Initialize with default columns
    return new Set(AVAILABLE_COLUMNS.filter(col => col.defaultVisible).map(col => col.key))
  })

  // Load saved column preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('propertyTableColumns')
    if (saved) {
      try {
        const savedColumns = JSON.parse(saved)
        setVisibleColumns(new Set(savedColumns))
      } catch (error) {
        console.warn('Failed to load saved column preferences:', error)
      }
    }
  }, [])

  // Save column preferences to localStorage
  useEffect(() => {
    localStorage.setItem('propertyTableColumns', JSON.stringify(Array.from(visibleColumns)))
  }, [visibleColumns])

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

  const handleSort = (field: SortField) => {
    let direction: SortDirection = 'asc'
    
    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc'
      } else if (sortConfig.direction === 'desc') {
        direction = null
      }
    }
    
    setSortConfig({ field: direction ? field : null, direction })
  }

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDownIcon className="h-4 w-4 opacity-50" />
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUpIcon className="h-4 w-4" />
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDownIcon className="h-4 w-4" />
    }
    
    return <ArrowUpDownIcon className="h-4 w-4 opacity-50" />
  }

  const sortedProperties = [...properties].sort((a, b) => {
    if (!sortConfig.field || !sortConfig.direction) return 0
    
    const aVal = a[sortConfig.field]
    const bVal = b[sortConfig.field]
    
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return sortConfig.direction === 'asc' ? 1 : -1
    if (bVal === null) return sortConfig.direction === 'asc' ? -1 : 1
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const allSelected = properties.length > 0 && selectedRows.size === properties.length
  const someSelected = selectedRows.size > 0 && selectedRows.size < properties.length

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium mb-2">No properties yet</h3>
        <p className="text-muted-foreground">
          Get started by uploading your first property or adding one manually
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector 
          visibleColumns={visibleColumns} 
          onColumnsChange={setVisibleColumns} 
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  {...(someSelected && { indeterminate: true })}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                  aria-label="Select all"
                />
              </TableHead>
              
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
                    }`}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {column.label}
                      {getSortIcon(column.key)}
                    </Button>
                  </TableHead>
                )
              })}
              
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {sortedProperties.map((property) => (
              <TableRow 
                key={property.id}
                className={selectedRows.has(property.id) ? 'bg-muted/50' : ''}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(property.id)}
                    onCheckedChange={(checked) => onRowSelect(property.id, !!checked)}
                    aria-label={`Select ${property.address}`}
                  />
                </TableCell>
                
                {visibleColumnDefs.map((column) => {
                  const isFinancial = ['assessed_value', 'improvement_value', 'land_value', 'last_sale_price'].includes(column.key)
                  
                  return (
                    <TableCell 
                      key={column.key} 
                      className={isFinancial ? 'text-right' : ''}
                    >
                      {renderCellContent(property, column.key)}
                    </TableCell>
                  )
                })}
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onRefresh(property)}
                        disabled={refreshingPropertyId === property.id || !property.apn}
                        className="focus:bg-blue-50"
                      >
                        <RefreshCwIcon className={`mr-2 h-4 w-4 ${
                          refreshingPropertyId === property.id ? 'animate-spin' : ''
                        }`} />
                        {refreshingPropertyId === property.id ? 'Refreshing...' : 'Refresh'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(property)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}