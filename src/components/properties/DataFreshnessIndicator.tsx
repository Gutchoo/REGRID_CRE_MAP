'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ClockIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react'

interface DataFreshnessIndicatorProps {
  lastRefreshDate?: string | null
  regridUpdatedAt?: string | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function DataFreshnessIndicator({ 
  lastRefreshDate, 
  regridUpdatedAt,
  size = 'sm',
  showLabel = false
}: DataFreshnessIndicatorProps) {
  // Determine data freshness
  const now = new Date()
  let freshnessStatus: 'fresh' | 'stale' | 'old' | 'unknown' = 'unknown'
  let daysSinceRefresh: number | null = null
  let freshnessText = 'Unknown'
  let tooltipText = 'No refresh data available'

  if (lastRefreshDate || regridUpdatedAt) {
    const refreshDate = new Date(lastRefreshDate || regridUpdatedAt || '')
    if (!isNaN(refreshDate.getTime())) {
      daysSinceRefresh = Math.floor((now.getTime() - refreshDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceRefresh <= 30) {
        freshnessStatus = 'fresh'
        freshnessText = daysSinceRefresh === 0 ? 'Today' : `${daysSinceRefresh} days ago`
      } else if (daysSinceRefresh <= 90) {
        freshnessStatus = 'stale'
        freshnessText = `${daysSinceRefresh} days ago`
      } else {
        freshnessStatus = 'old'
        freshnessText = `${daysSinceRefresh} days ago`
      }
      
      tooltipText = `Data last refreshed: ${refreshDate.toLocaleDateString()}`
      if (regridUpdatedAt && lastRefreshDate !== regridUpdatedAt) {
        const regridDate = new Date(regridUpdatedAt)
        tooltipText += `\nRegrid last updated: ${regridDate.toLocaleDateString()}`
      }
    }
  }

  // Style configuration based on freshness
  const getStatusConfig = () => {
    switch (freshnessStatus) {
      case 'fresh':
        return {
          variant: 'secondary' as const,
          icon: CheckCircleIcon,
          className: 'bg-green-50 text-green-700 border-green-200',
          iconColor: 'text-green-600'
        }
      case 'stale':
        return {
          variant: 'secondary' as const,
          icon: ClockIcon,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          iconColor: 'text-yellow-600'
        }
      case 'old':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangleIcon,
          className: 'bg-red-50 text-red-700 border-red-200',
          iconColor: 'text-red-600'
        }
      default:
        return {
          variant: 'outline' as const,
          icon: ClockIcon,
          className: 'bg-gray-50 text-gray-600 border-gray-200',
          iconColor: 'text-gray-500'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const Icon = statusConfig.icon

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'

  const badge = (
    <Badge 
      variant={statusConfig.variant} 
      className={`${statusConfig.className} ${textSize} flex items-center gap-1`}
    >
      <Icon className={`${iconSize} ${statusConfig.iconColor}`} />
      {showLabel && <span>{freshnessText}</span>}
    </Badge>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium">{freshnessText}</p>
            <p className="text-muted-foreground mt-1">{tooltipText}</p>
            {daysSinceRefresh !== null && (
              <div className="mt-2 text-xs">
                {freshnessStatus === 'fresh' && 'Data is current'}
                {freshnessStatus === 'stale' && 'Consider refreshing data'}
                {freshnessStatus === 'old' && 'Data may be outdated'}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}