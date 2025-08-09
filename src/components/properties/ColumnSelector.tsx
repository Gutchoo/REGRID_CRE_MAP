'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Settings2Icon } from 'lucide-react'
import type { Property } from '@/lib/supabase'

export interface TableColumn {
  key: keyof Property
  label: string
  category: 'basic' | 'property' | 'financial' | 'location' | 'other'
  defaultVisible: boolean
}

export const AVAILABLE_COLUMNS: TableColumn[] = [
  // Basic columns - always show
  { key: 'address', label: 'Address', category: 'basic', defaultVisible: true },
  { key: 'city', label: 'City', category: 'basic', defaultVisible: true },
  { key: 'state', label: 'State', category: 'basic', defaultVisible: true },
  { key: 'zip_code', label: 'Zip Code', category: 'basic', defaultVisible: true },
  { key: 'apn', label: 'APN', category: 'basic', defaultVisible: true },
  
  // Property details
  { key: 'owner', label: 'Owner', category: 'property', defaultVisible: true },
  { key: 'year_built', label: 'Year Built', category: 'property', defaultVisible: true },
  { key: 'use_code', label: 'Use Code', category: 'property', defaultVisible: false },
  { key: 'use_description', label: 'Use Description', category: 'property', defaultVisible: false },
  { key: 'zoning', label: 'Zoning', category: 'property', defaultVisible: true },
  { key: 'zoning_description', label: 'Zoning Description', category: 'property', defaultVisible: true },
  { key: 'num_stories', label: 'Stories', category: 'property', defaultVisible: false },
  { key: 'num_units', label: 'Units', category: 'property', defaultVisible: false },
  { key: 'num_rooms', label: 'Rooms', category: 'property', defaultVisible: false },
  { key: 'subdivision', label: 'Subdivision', category: 'property', defaultVisible: false },
  { key: 'lot_size_acres', label: 'Lot Size (Acres)', category: 'property', defaultVisible: false },
  { key: 'lot_size_sqft', label: 'Lot Size (Sq Ft)', category: 'property', defaultVisible: false },
  
  // Financial data
  { key: 'assessed_value', label: 'Assessed Value', category: 'financial', defaultVisible: true },
  { key: 'improvement_value', label: 'Improvement Value', category: 'financial', defaultVisible: false },
  { key: 'land_value', label: 'Land Value', category: 'financial', defaultVisible: false },
  { key: 'last_sale_price', label: 'Last Sale Price', category: 'financial', defaultVisible: false },
  { key: 'sale_date', label: 'Sale Date', category: 'financial', defaultVisible: false },
  { key: 'tax_year', label: 'Tax Year', category: 'financial', defaultVisible: false },
  
  // Location data
  { key: 'county', label: 'County', category: 'location', defaultVisible: false },
  { key: 'census_tract', label: 'Census Tract', category: 'location', defaultVisible: false },
  { key: 'census_block', label: 'Census Block', category: 'location', defaultVisible: false },
  { key: 'qoz_status', label: 'QOZ Status', category: 'other', defaultVisible: true },
  
  // Other
  { key: 'created_at', label: 'Added', category: 'other', defaultVisible: true },
  { key: 'user_notes', label: 'Notes', category: 'other', defaultVisible: false },
  { key: 'tags', label: 'Tags', category: 'other', defaultVisible: false },
]

interface ColumnSelectorProps {
  visibleColumns: Set<keyof Property>
  onColumnsChange: (columns: Set<keyof Property>) => void
}

export function ColumnSelector({ visibleColumns, onColumnsChange }: ColumnSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleColumnToggle = (columnKey: keyof Property, checked: boolean) => {
    const newColumns = new Set(visibleColumns)
    if (checked) {
      newColumns.add(columnKey)
    } else {
      newColumns.delete(columnKey)
    }
    onColumnsChange(newColumns)
  }

  const handleSelectAll = () => {
    const allColumns = new Set(AVAILABLE_COLUMNS.map(col => col.key))
    onColumnsChange(allColumns)
  }

  const handleSelectDefault = () => {
    const defaultColumns = new Set(
      AVAILABLE_COLUMNS.filter(col => col.defaultVisible).map(col => col.key)
    )
    onColumnsChange(defaultColumns)
  }

  const handleSelectNone = () => {
    // Keep basic columns always visible
    const basicColumns = new Set(
      AVAILABLE_COLUMNS.filter(col => col.category === 'basic').map(col => col.key)
    )
    onColumnsChange(basicColumns)
  }

  const categorizedColumns = AVAILABLE_COLUMNS.reduce((acc, column) => {
    if (!acc[column.category]) {
      acc[column.category] = []
    }
    acc[column.category].push(column)
    return acc
  }, {} as Record<string, TableColumn[]>)

  const categoryLabels = {
    basic: 'Basic Information',
    property: 'Property Details', 
    financial: 'Financial Data',
    location: 'Location Data',
    other: 'Other'
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Settings2Icon className="mr-2 h-4 w-4" />
          Columns ({visibleColumns.size})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Table Columns</DropdownMenuLabel>
        
        <div className="flex gap-1 p-1">
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleSelectAll}>
            All
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleSelectDefault}>
            Default
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleSelectNone}>
            Minimal
          </Button>
        </div>
        
        <DropdownMenuSeparator />
        
        {Object.entries(categorizedColumns).map(([category, columns]) => (
          <div key={category}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </DropdownMenuLabel>
            {columns.map((column) => (
              <DropdownMenuItem
                key={column.key}
                className="flex items-center gap-2 cursor-pointer"
                onSelect={(e) => e.preventDefault()}
              >
                <Checkbox
                  checked={visibleColumns.has(column.key)}
                  onCheckedChange={(checked) => handleColumnToggle(column.key, !!checked)}
                  disabled={column.category === 'basic'} // Keep basic columns always visible
                />
                <span className="flex-1 text-sm">{column.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}