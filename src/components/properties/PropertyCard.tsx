'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreVerticalIcon, 
  RefreshCwIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  MapPinIcon,
  CalendarIcon,
  DollarSignIcon,
  BuildingIcon,
  UserIcon,
  TagIcon,
  HomeIcon,
  LandmarkIcon,
  TreesIcon
} from 'lucide-react'
import type { Property } from '@/lib/supabase'

interface PropertyCardProps {
  property: Property
  isExpanded: boolean
  onToggleExpand: (id: string) => void
  onRefresh: (property: Property) => void
  onDelete: (property: Property) => void
  isRefreshing: boolean
}

export function PropertyCard({ 
  property, 
  isExpanded, 
  onToggleExpand, 
  onRefresh, 
  onDelete, 
  isRefreshing 
}: PropertyCardProps) {
  const formatCurrency = (value: number | null) => {
    if (!value) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (value: number | null) => {
    if (!value) return null
    return value.toLocaleString()
  }


  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      {/* Card Header - Always Visible */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => onToggleExpand(property.id)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                  {property.address}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinIcon className="h-3 w-3" />
                  <span>
                    {[property.city, property.state, property.zip_code]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
                
                {/* Compact Info Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {property.year_built && (
                    <span>Built {property.year_built}</span>
                  )}
                  {property.county && (
                    <span>{property.county} County</span>
                  )}
                  {property.zoning && (
                    <span>Zoned {property.zoning}</span>
                  )}
                  {property.qoz_status === 'Yes' && (
                    <Badge variant="secondary" className="text-xs">QOZ</Badge>
                  )}
                </div>
              </div>
              
              <Button variant="ghost" size="sm" className="ml-4">
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onRefresh(property)}
                disabled={isRefreshing || !property.apn}
                className="focus:bg-blue-50"
              >
                <RefreshCwIcon className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(property)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Quick Stats - Always Visible */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Assessed Value</p>
            <p className="text-sm font-medium">
              {formatCurrency(property.assessed_value) || 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Owner</p>
            <p className="text-sm font-medium truncate" title={property.owner || 'N/A'}>
              {property.owner || 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Last Sale</p>
            <p className="text-sm font-medium">
              {(property.last_sale_price && property.last_sale_price > 0) 
                ? formatCurrency(property.last_sale_price) 
                : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">APN</p>
            <p className="text-sm font-medium font-mono">{property.apn || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          <Separator className="mb-6" />
          
          <div className="space-y-6">
            {/* Property Details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BuildingIcon className="h-4 w-4" />
                <h4 className="font-medium">Property Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {property.year_built && (
                  <div>
                    <p className="text-muted-foreground">Year Built</p>
                    <p className="font-medium">{property.year_built}</p>
                  </div>
                )}
                {property.use_description && (
                  <div>
                    <p className="text-muted-foreground">Property Use</p>
                    <p className="font-medium">{property.use_description}</p>
                  </div>
                )}
                {property.num_stories && (
                  <div>
                    <p className="text-muted-foreground">Stories</p>
                    <p className="font-medium">{property.num_stories}</p>
                  </div>
                )}
                {property.num_units && (
                  <div>
                    <p className="text-muted-foreground">Units</p>
                    <p className="font-medium">{property.num_units}</p>
                  </div>
                )}
                {property.num_rooms && (
                  <div>
                    <p className="text-muted-foreground">Rooms</p>
                    <p className="font-medium">{property.num_rooms}</p>
                  </div>
                )}
                {property.subdivision && (
                  <div>
                    <p className="text-muted-foreground">Subdivision</p>
                    <p className="font-medium">{property.subdivision}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Zoning & Land Use */}
            {(property.zoning || property.zoning_description || property.use_code) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LandmarkIcon className="h-4 w-4" />
                  <h4 className="font-medium">Zoning & Land Use</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {property.zoning && (
                    <div>
                      <p className="text-muted-foreground">Zoning Code</p>
                      <p className="font-medium">{property.zoning}</p>
                    </div>
                  )}
                  {property.zoning_description && (
                    <div>
                      <p className="text-muted-foreground">Zoning Description</p>
                      <p className="font-medium">{property.zoning_description}</p>
                    </div>
                  )}
                  {property.use_code && (
                    <div>
                      <p className="text-muted-foreground">Use Code</p>
                      <p className="font-medium">{property.use_code}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Land Information */}
            {(property.lot_size_acres || property.lot_size_sqft) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TreesIcon className="h-4 w-4" />
                  <h4 className="font-medium">Land Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {property.lot_size_acres && (
                    <div>
                      <p className="text-muted-foreground">Lot Size (Acres)</p>
                      <p className="font-medium">{property.lot_size_acres.toFixed(2)}</p>
                    </div>
                  )}
                  {property.lot_size_sqft && (
                    <div>
                      <p className="text-muted-foreground">Lot Size (Sq Ft)</p>
                      <p className="font-medium">{formatNumber(property.lot_size_sqft)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Information */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPinIcon className="h-4 w-4" />
                <h4 className="font-medium">Location Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {property.county && (
                  <div>
                    <p className="text-muted-foreground">County</p>
                    <p className="font-medium">{property.county}</p>
                  </div>
                )}
                {property.census_tract && (
                  <div>
                    <p className="text-muted-foreground">Census Tract</p>
                    <p className="font-medium">{property.census_tract}</p>
                  </div>
                )}
                {property.census_block && (
                  <div>
                    <p className="text-muted-foreground">Census Block</p>
                    <p className="font-medium">{property.census_block}</p>
                  </div>
                )}
                {property.qoz_status && (
                  <div>
                    <p className="text-muted-foreground">QOZ Status</p>
                    <p className="font-medium">{property.qoz_status}</p>
                  </div>
                )}
                {property.qoz_tract && (
                  <div>
                    <p className="text-muted-foreground">QOZ Tract</p>
                    <p className="font-medium">{property.qoz_tract}</p>
                  </div>
                )}
                {property.lat && property.lng && (
                  <div>
                    <p className="text-muted-foreground">Coordinates</p>
                    <p className="font-medium font-mono text-xs">
                      {property.lat.toFixed(6)}, {property.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            {(property.assessed_value || property.land_value || property.improvement_value || property.last_sale_price) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSignIcon className="h-4 w-4" />
                  <h4 className="font-medium">Financial Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {property.assessed_value && (
                    <div>
                      <p className="text-muted-foreground">Assessed Value</p>
                      <p className="font-medium">{formatCurrency(property.assessed_value)}</p>
                    </div>
                  )}
                  {property.land_value && (
                    <div>
                      <p className="text-muted-foreground">Land Value</p>
                      <p className="font-medium">{formatCurrency(property.land_value)}</p>
                    </div>
                  )}
                  {property.improvement_value && (
                    <div>
                      <p className="text-muted-foreground">Improvement Value</p>
                      <p className="font-medium">{formatCurrency(property.improvement_value)}</p>
                    </div>
                  )}
                  {property.last_sale_price && property.last_sale_price > 0 && (
                    <div>
                      <p className="text-muted-foreground">Last Sale Price</p>
                      <p className="font-medium">{formatCurrency(property.last_sale_price)}</p>
                    </div>
                  )}
                  {property.sale_date && (
                    <div>
                      <p className="text-muted-foreground">Sale Date</p>
                      <p className="font-medium">{formatDate(property.sale_date)}</p>
                    </div>
                  )}
                  {property.tax_year && (
                    <div>
                      <p className="text-muted-foreground">Tax Year</p>
                      <p className="font-medium">{property.tax_year}</p>
                    </div>
                  )}
                  {property.parcel_value_type && (
                    <div>
                      <p className="text-muted-foreground">Value Type</p>
                      <p className="font-medium">{property.parcel_value_type}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Owner Information */}
            {(property.owner || property.owner_mailing_address) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HomeIcon className="h-4 w-4" />
                  <h4 className="font-medium">Owner Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {property.owner && (
                    <div>
                      <p className="text-muted-foreground">Owner Name</p>
                      <p className="font-medium">{property.owner}</p>
                    </div>
                  )}
                  {property.owner_mailing_address && (
                    <div>
                      <p className="text-muted-foreground">Mailing Address</p>
                      <p className="font-medium">
                        {[
                          property.owner_mailing_address,
                          property.owner_mail_city,
                          property.owner_mail_state,
                          property.owner_mail_zip
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Information */}
            {(property.user_notes || property.insurance_provider || property.maintenance_history || property.tags?.length) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="h-4 w-4" />
                  <h4 className="font-medium">Your Information</h4>
                </div>
                <div className="space-y-3 text-sm">
                  {property.user_notes && (
                    <div>
                      <p className="text-muted-foreground">Notes</p>
                      <p className="font-medium">{property.user_notes}</p>
                    </div>
                  )}
                  {property.insurance_provider && (
                    <div>
                      <p className="text-muted-foreground">Insurance Provider</p>
                      <p className="font-medium">{property.insurance_provider}</p>
                    </div>
                  )}
                  {property.maintenance_history && (
                    <div>
                      <p className="text-muted-foreground">Maintenance History</p>
                      <p className="font-medium">{property.maintenance_history}</p>
                    </div>
                  )}
                  {property.tags && property.tags.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {property.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-4 w-4" />
                <h4 className="font-medium">Timeline</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Added to Portfolio</p>
                  <p className="font-medium">{formatDate(property.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(property.updated_at)}</p>
                </div>
                {property.apn && (
                  <div>
                    <p className="text-muted-foreground">APN</p>
                    <p className="font-medium font-mono">{property.apn}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}