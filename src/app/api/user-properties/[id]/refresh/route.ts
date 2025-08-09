import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { DatabaseService } from '@/lib/db'
import { RegridService, type RegridProperty } from '@/lib/regrid'

// Utility function to clean APN by removing all dashes
function cleanAPN(apn: string | null | undefined): string | null {
  if (!apn) return null
  return apn.replace(/-/g, '')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Get existing property
    const existingProperty = await DatabaseService.getProperty(id, userId)
    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if property has APN for refresh
    if (!existingProperty.apn) {
      return NextResponse.json(
        { error: 'Cannot refresh property: No APN available' },
        { status: 400 }
      )
    }

    console.log(`🔄 Refreshing property data for APN: ${existingProperty.apn}`)

    // Fetch fresh data from Regrid API
    let regridData: RegridProperty | null = null
    try {
      regridData = await RegridService.searchByAPN(existingProperty.apn, existingProperty.state || undefined)
      console.log(`✅ Successfully fetched fresh data for APN: ${existingProperty.apn}`)
    } catch (error) {
      console.warn(`⚠️ Failed to fetch Regrid data for APN ${existingProperty.apn}:`, error)
      return NextResponse.json(
        { error: 'Failed to fetch updated property data from Regrid API' },
        { status: 503 }
      )
    }

    if (!regridData) {
      return NextResponse.json(
        { error: 'No updated data available for this property' },
        { status: 404 }
      )
    }

    // Prepare updated property data - merge fresh Regrid data with preserved user data
    const updatedPropertyData = {
      // Fresh Regrid data - these get updated
      regrid_id: regridData.id || existingProperty.regrid_id,
      apn: cleanAPN(regridData.apn || existingProperty.apn),
      address: regridData.address?.line1 || existingProperty.address,
      city: regridData.address?.city || existingProperty.city,
      state: regridData.address?.state || existingProperty.state,
      zip_code: regridData.address?.zip || existingProperty.zip_code,
      geometry: regridData.geometry || existingProperty.geometry,
      lat: regridData.centroid?.lat || existingProperty.lat,
      lng: regridData.centroid?.lng || existingProperty.lng,
      
      // Enhanced property data from Regrid API
      year_built: regridData.properties?.year_built || existingProperty.year_built,
      owner: regridData.properties?.owner || existingProperty.owner,
      last_sale_price: regridData.properties?.last_sale_price || existingProperty.last_sale_price,
      sale_date: regridData.properties?.sale_date || existingProperty.sale_date,
      county: regridData.properties?.county || existingProperty.county,
      qoz_status: regridData.properties?.qoz_status || existingProperty.qoz_status,
      improvement_value: regridData.properties?.improvement_value || existingProperty.improvement_value,
      land_value: regridData.properties?.land_value || existingProperty.land_value,
      assessed_value: regridData.properties?.assessed_value || existingProperty.assessed_value,
      
      // Store fresh full Regrid API response
      property_data: regridData || existingProperty.property_data,
      
      // Preserve existing user data - these stay the same
      user_notes: existingProperty.user_notes,
      tags: existingProperty.tags,
      insurance_provider: existingProperty.insurance_provider,
      maintenance_history: existingProperty.maintenance_history,
      
      // Update timestamp
      updated_at: new Date().toISOString()
    }

    console.log(`💾 Updating property in database with fresh data`)

    // Update the property in database
    const updatedProperty = await DatabaseService.updateProperty(id, userId, updatedPropertyData)

    console.log(`✅ Property refreshed successfully: ${id}`)

    return NextResponse.json({ 
      property: updatedProperty,
      message: 'Property data refreshed successfully'
    })
  } catch (error) {
    console.error('Refresh property error:', error)
    
    let errorMessage = 'Failed to refresh property data'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for specific error types
      if (error.message.includes('not found')) {
        statusCode = 404
      } else if (error.message.includes('Unauthorized')) {
        statusCode = 401
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}