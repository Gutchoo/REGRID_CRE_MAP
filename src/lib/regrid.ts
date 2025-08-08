import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'

const REGRID_API_BASE = 'https://app.regrid.com/api/v2'

// Test APNs with cached data to avoid API costs during development
const TEST_APN_MAPPING: Record<string, string> = {
  '0254282260000': 'regrid-test-1.json', // Original test APN
  '50183176': 'regrid-test-2.json',
  '505090290': 'regrid-test-3.json', 
  '505210810': 'regrid-test-4.json',
  '0253204080000': 'regrid-test-5.json',
  '628081041': 'regrid-test-6.json'
}

const TEST_APNS = Object.keys(TEST_APN_MAPPING)

export interface RegridProperty {
  id: string
  apn: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
  }
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  centroid: {
    lat: number
    lng: number
  }
  properties: {
    owner: string
    lot_size_sqft?: number
    building_sqft?: number
    year_built?: number
    zoning?: string
    property_type?: string
    assessed_value?: number
    [key: string]: any
  }
}

export interface RegridSearchResult {
  id: string
  apn: string
  address: string
  city: string
  state: string
  zip: string
  score: number
}

const addressSchema = z.object({
  address: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional()
})

export class RegridService {
  private static apiKey = process.env.REGRID_API_KEY

  private static async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    if (!this.apiKey) {
      throw new Error('Regrid API key is not configured')
    }

    const url = new URL(`${REGRID_API_BASE}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    const response = await fetch(url.toString(), {
      headers: {
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Regrid API Error (${response.status}): ${error}`)
    }

    return response.json()
  }

  // Search by APN
  static async searchByAPN(apn: string, state?: string): Promise<RegridProperty | null> {
    try {
      // Use cached test data for development testing
      if (TEST_APNS.includes(apn) && process.env.NODE_ENV === 'development') {
        console.log(`🧪 Using cached test data for APN: ${apn}`)
        
        try {
          const filename = TEST_APN_MAPPING[apn]
          const testDataPath = join(process.cwd(), 'src', 'lib', 'test-data', filename)
          const testData = JSON.parse(readFileSync(testDataPath, 'utf-8'))
          
          // Handle the same API response structure as live API
          const features = testData?.parcels?.features || []
          if (features.length > 0) {
            console.log(`✅ Loaded cached test data for APN: ${apn}`)
            return this.normalizeProperty(features[0])
          }
        } catch (fileError) {
          console.warn(`⚠️  Could not load test data for APN ${apn}, falling back to API:`, fileError.message)
          // Fall through to regular API call
        }
      }

      const params: Record<string, any> = { 
        parcelnumb: apn,
        token: this.apiKey 
      }

      const data = await this.makeRequest('/parcels/apn', params)
      
      // Handle the new API response structure: parcels.features[]
      const features = data?.parcels?.features || []
      if (features.length > 0) {
        return this.normalizeProperty(features[0])
      }
      return null
    } catch (error) {
      console.error('Error searching by APN:', error)
      console.error('APN:', apn, 'State:', state)
      throw error
    }
  }

  // Search by address with autocomplete suggestions
  static async searchByAddress(
    address: string,
    city?: string,
    state?: string,
    limit: number = 10
  ): Promise<RegridSearchResult[]> {
    try {
      const params: Record<string, any> = { 
        query: address,
        limit: Math.min(limit, 25) // Regrid max limit
      }
      if (city) params.city = city
      if (state) params.state = state

      const data = await this.makeRequest('/search', params)
      
      return (data.results || []).map((result: any) => ({
        id: result.id,
        apn: result.fields?.apn || '',
        address: result.fields?.address?.line1 || '',
        city: result.fields?.address?.city || '',
        state: result.fields?.address?.state || '',
        zip: result.fields?.address?.zip || '',
        score: result.score || 0
      }))
    } catch (error) {
      console.error('Error searching by address:', error)
      throw error
    }
  }

  // Get detailed property data by ID
  static async getPropertyById(id: string): Promise<RegridProperty | null> {
    try {
      const params = { token: this.apiKey }
      const data = await this.makeRequest(`/parcels/${id}`, params)
      
      // Handle the v2 API response structure
      if (data.parcels?.features && data.parcels.features.length > 0) {
        return this.normalizeProperty(data.parcels.features[0])
      }
      
      return null
    } catch (error) {
      console.error('Error getting property by ID:', error)
      throw error
    }
  }

  // Validate and format address
  static validateAddress(input: { address: string; city?: string; state?: string }) {
    return addressSchema.parse(input)
  }

  // Normalize property data from different Regrid response formats
  private static normalizeProperty(rawProperty: any): RegridProperty {
    // Handle v2 API format: data is in rawProperty.properties.fields
    const fields = rawProperty.properties?.fields || rawProperty.fields || rawProperty.properties || rawProperty
    const geometry = rawProperty.geometry

    return {
      id: String(rawProperty.id || fields.id || ''),
      apn: fields.parcelnumb || fields.apn || '',
      address: {
        line1: fields.address || '',
        line2: '',
        city: fields.scity || fields.city || '',
        state: fields.state2 || fields.state || '',
        zip: fields.szip5 || fields.zip || ''
      },
      geometry: geometry || {
        type: 'Polygon',
        coordinates: []
      },
      centroid: {
        lat: parseFloat(fields.lat) || 0,
        lng: parseFloat(fields.lon) || 0
      },
      properties: {
        owner: fields.owner || '',
        lot_size_sqft: parseInt(fields.ll_gissqft) || undefined,
        lot_acres: parseFloat(fields.ll_gisacre) || undefined,
        building_sqft: parseInt(fields.building_sqft) || undefined,
        year_built: parseInt(fields.yearbuilt) || undefined,
        zoning: fields.zoning || '',
        zoning_description: fields.zoning_description || '',
        property_type: fields.property_type || '',
        use_code: fields.usecode || '',
        use_description: fields.usedesc || '',
        
        // Enhanced fields for database storage
        assessed_value: parseFloat(fields.parval) || undefined, // Total parcel value
        improvement_value: parseFloat(fields.improvval) || undefined,
        land_value: parseFloat(fields.landval) || undefined,
        last_sale_price: parseFloat(fields.saleprice) || undefined,
        sale_date: fields.saledate || '',
        county: fields.county || '',
        qoz_status: fields.qoz || '', // Qualified Opportunity Zone
        
        subdivision: fields.subdivision || '',
        qualified_opportunity_zone: fields.qoz || '',
        // Store all raw fields for future use
        ...fields
      }
    }
  }

  // Batch search multiple APNs
  static async batchSearchByAPNs(apns: string[], state?: string): Promise<RegridProperty[]> {
    const results = await Promise.allSettled(
      apns.map(apn => this.searchByAPN(apn, state))
    )

    return results
      .filter((result): result is PromiseFulfilledResult<RegridProperty> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value)
  }

  // Batch search multiple addresses  
  static async batchSearchByAddresses(
    addresses: { address: string; city?: string; state?: string }[]
  ): Promise<RegridProperty[]> {
    const results: RegridProperty[] = []

    for (const addr of addresses) {
      try {
        const searchResults = await this.searchByAddress(addr.address, addr.city, addr.state, 1)
        if (searchResults.length > 0) {
          const property = await this.getPropertyById(searchResults[0].id)
          if (property) results.push(property)
        }
      } catch (error) {
        console.error(`Error searching address ${addr.address}:`, error)
      }
    }

    return results
  }
}

// Install zod if not already installed
export { z }