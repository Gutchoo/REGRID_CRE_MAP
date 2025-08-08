import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { DatabaseService } from '@/lib/db'
import { RegridService, type RegridProperty } from '@/lib/regrid'
import { z } from 'zod'

const createPropertySchema = z.object({
  regrid_id: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  apn: z.string().optional(),
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  user_notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  insurance_provider: z.string().optional(),
  maintenance_history: z.string().optional(),
})

const bulkCreateSchema = z.object({
  properties: z.array(createPropertySchema),
  source: z.enum(['csv', 'manual', 'api']).optional()
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const search = searchParams.get('search')

    const filters = {
      city: city || undefined,
      state: state || undefined,
      tags: tags || undefined,
      search: search || undefined
    }

    const properties = await DatabaseService.getFilteredProperties(userId, filters)
    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Get user properties error:', error)
    return NextResponse.json(
      { error: 'Failed to get properties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if this is a bulk create or single property create
    if (body.properties && Array.isArray(body.properties)) {
      return handleBulkCreate(userId, body)
    } else {
      return handleSingleCreate(userId, body)
    }
  } catch (error) {
    console.error('Create property error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create property'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for specific error types
      if (error.message.includes('validation')) {
        statusCode = 400
      } else if (error.message.includes('Unauthorized')) {
        statusCode = 401
      } else if (error.message.includes('RLS policy')) {
        statusCode = 403
        errorMessage = 'Authentication issue - please sign out and back in'
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

async function handleSingleCreate(userId: string, body: unknown) {
  console.log('handleSingleCreate - received body:', JSON.stringify(body, null, 2))
  
  const validatedData = createPropertySchema.parse(body)
  console.log('handleSingleCreate - validated data:', JSON.stringify(validatedData, null, 2))

  let regridData: RegridProperty | null = null

  // Always fetch Regrid data to get rich property information
  if (validatedData.apn) {
    console.log('handleSingleCreate - fetching by APN:', validatedData.apn)
    regridData = await RegridService.searchByAPN(validatedData.apn, validatedData.state)
  } else if (validatedData.address) {
    console.log('handleSingleCreate - searching by address')
    // Search by address
    const searchResults = await RegridService.searchByAddress(
      validatedData.address,
      validatedData.city,
      validatedData.state,
      1
    )
    if (searchResults.length > 0) {
      console.log('handleSingleCreate - found address results, fetching details')
      regridData = await RegridService.getPropertyById(searchResults[0].id)
    }
  }

  // Prepare property data for database
  // Note: user_id will be automatically set by database DEFAULT auth.uid() 
  console.log('handleSingleCreate - preparing property data')
  const propertyData = {
    regrid_id: validatedData.regrid_id || null,
    apn: regridData?.apn || validatedData.apn || null,
    address: regridData?.address?.line1 || validatedData.address,
    city: regridData?.address?.city || validatedData.city || null,
    state: regridData?.address?.state || validatedData.state || null,
    zip_code: regridData?.address?.zip || validatedData.zip_code || null,
    geometry: regridData?.geometry || null,
    lat: regridData?.centroid?.lat || null,
    lng: regridData?.centroid?.lng || null,
    
    // Enhanced property data from Regrid API
    year_built: regridData?.properties?.year_built || null,
    owner: regridData?.properties?.owner || null,
    last_sale_price: regridData?.properties?.last_sale_price || null,
    sale_date: regridData?.properties?.sale_date || null,
    county: regridData?.properties?.county || null,
    qoz_status: regridData?.properties?.qoz_status || null,
    improvement_value: regridData?.properties?.improvement_value || null,
    land_value: regridData?.properties?.land_value || null,
    assessed_value: regridData?.properties?.assessed_value || null,
    
    property_data: regridData || null,
    user_notes: validatedData.user_notes || null,
    tags: validatedData.tags || null,
    insurance_provider: validatedData.insurance_provider || null,
    maintenance_history: validatedData.maintenance_history || null,
  }
  
  console.log('handleSingleCreate - property data prepared:', JSON.stringify(propertyData, null, 2))

  try {
    // Server-side duplicate check as additional safeguard
    if (propertyData.apn) {
      console.log('handleSingleCreate - checking for duplicate APN:', propertyData.apn)
      const existingProperties = await DatabaseService.getFilteredProperties(userId, {
        search: propertyData.apn
      })
      
      const exactMatch = existingProperties.find(
        property => property.apn?.toLowerCase() === propertyData.apn?.toLowerCase()
      )
      
      if (exactMatch) {
        console.log('handleSingleCreate - duplicate APN found, rejecting creation')
        throw new Error('A property with this APN already exists in your portfolio')
      }
    }
    
    console.log('handleSingleCreate - creating property in database')
    const property = await DatabaseService.createProperty(propertyData)
    console.log('handleSingleCreate - property created successfully:', property.id)
    
    if (!property) {
      throw new Error('Property creation returned null - possible RLS policy issue')
    }
    
    return NextResponse.json({ property })
  } catch (dbError) {
    console.error('handleSingleCreate - database error:', dbError)
    console.error('handleSingleCreate - failed property data:', JSON.stringify(propertyData, null, 2))
    
    const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error'
    throw new Error(`Database error: ${errorMessage}`)
  }
}

async function handleBulkCreate(userId: string, body: unknown) {
  const validatedData = bulkCreateSchema.parse(body)
  const { properties, source } = validatedData

  const results = []
  const errors = []

  for (const [index, propertyInput] of properties.entries()) {
    try {
      const property = await createSinglePropertyFromInput(userId, propertyInput)
      results.push(property)
    } catch (error) {
      console.error(`Error creating property at index ${index}:`, error)
      errors.push({
        index,
        input: propertyInput,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return NextResponse.json({
    created: results,
    errors,
    summary: {
      total: properties.length,
      successful: results.length,
      failed: errors.length,
      source
    }
  })
}

async function createSinglePropertyFromInput(userId: string, input: unknown) {
  const validatedInput = createPropertySchema.parse(input)

  let regridData: RegridProperty | null = null

  // Try to get Regrid data
  try {
    if (validatedInput.apn) {
      regridData = await RegridService.searchByAPN(validatedInput.apn, validatedInput.state)
    } else {
      const searchResults = await RegridService.searchByAddress(
        validatedInput.address,
        validatedInput.city,
        validatedInput.state,
        1
      )
      if (searchResults.length > 0) {
        regridData = await RegridService.getPropertyById(searchResults[0].id)
      }
    }
  } catch (error) {
    // Log but don't fail - we can still create the property without Regrid data
    console.warn('Failed to fetch Regrid data:', error)
  }

  const propertyData = {
    regrid_id: validatedInput.regrid_id || null,
    apn: regridData?.apn || validatedInput.apn || null,
    address: regridData?.address?.line1 || validatedInput.address,
    city: regridData?.address?.city || validatedInput.city || null,
    state: regridData?.address?.state || validatedInput.state || null,
    zip_code: regridData?.address?.zip || validatedInput.zip_code || null,
    geometry: regridData?.geometry || null,
    lat: regridData?.centroid?.lat || null,
    lng: regridData?.centroid?.lng || null,
    
    // Enhanced property data from Regrid API
    year_built: regridData?.properties?.year_built || null,
    owner: regridData?.properties?.owner || null,
    last_sale_price: regridData?.properties?.last_sale_price || null,
    sale_date: regridData?.properties?.sale_date || null,
    county: regridData?.properties?.county || null,
    qoz_status: regridData?.properties?.qoz_status || null,
    improvement_value: regridData?.properties?.improvement_value || null,
    land_value: regridData?.properties?.land_value || null,
    assessed_value: regridData?.properties?.assessed_value || null,
    
    property_data: regridData || null,
    user_notes: validatedInput.user_notes || null,
    tags: validatedInput.tags || null,
    insurance_provider: validatedInput.insurance_provider || null,
    maintenance_history: validatedInput.maintenance_history || null,
  }

  return await DatabaseService.createProperty(propertyData)
}