'use client'

import { Button } from '@/components/ui/button'
import { LayoutGridIcon, Grid3X3Icon } from 'lucide-react'

type ViewMode = 'cards' | 'table'

interface PropertyViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function PropertyViewToggle({ currentView, onViewChange }: PropertyViewToggleProps) {
  return (
    <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
      <Button
        variant={currentView === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className="h-8 px-3"
      >
        <LayoutGridIcon className="h-4 w-4 mr-2" />
        Cards
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="h-8 px-3"
      >
        <Grid3X3Icon className="h-4 w-4 mr-2" />
        Table
      </Button>
    </div>
  )
}