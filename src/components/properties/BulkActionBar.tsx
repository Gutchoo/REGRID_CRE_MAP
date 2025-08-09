'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCwIcon, TrashIcon, XIcon } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onBulkRefresh: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
  isProcessing: boolean
}

export function BulkActionBar({
  selectedCount,
  onBulkRefresh,
  onBulkDelete,
  onClearSelection,
  isProcessing
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg border px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium">
            {selectedCount === 1 ? 'property' : 'properties'} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkRefresh}
            disabled={isProcessing}
            className="text-xs"
          >
            <RefreshCwIcon className={`h-3 w-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            disabled={isProcessing}
            className="text-xs"
          >
            <TrashIcon className="h-3 w-3 mr-1" />
            Delete All
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
            className="text-xs hover:bg-primary-foreground/20"
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}