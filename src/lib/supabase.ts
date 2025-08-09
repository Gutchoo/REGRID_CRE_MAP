import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (for use in client components)
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for use in server components and API routes)
export const createServerSupabaseClient = () =>
  createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return (globalThis as Record<string, unknown>).cookies?.get(name)?.value
      },
    },
  })

// Database types
export type Property = {
  id: string
  user_id: string  // UUID from auth.users
  regrid_id: string | null // Regrid property ID for reference
  apn: string | null
  address: string
  city: string | null
  state: string | null
  zip_code: string | null
  geometry: Record<string, unknown> | null // GeoJSON polygon
  lat: number | null
  lng: number | null
  
  // Rich property data from Regrid API
  year_built: number | null
  owner: string | null
  last_sale_price: number | null
  sale_date: string | null // ISO date string
  county: string | null
  qoz_status: string | null // Qualified Opportunity Zone status
  improvement_value: number | null
  land_value: number | null
  assessed_value: number | null
  
  // Extended property details
  use_code: string | null // Property use code
  use_description: string | null // Use description  
  zoning: string | null // Zoning code
  zoning_description: string | null // Full zoning description
  num_stories: number | null // Number of stories
  num_units: number | null // Number of units
  num_rooms: number | null // Number of rooms
  subdivision: string | null // Subdivision name
  lot_size_acres: number | null // Lot size in acres
  lot_size_sqft: number | null // Lot size in square feet
  
  // Financial & tax data
  tax_year: string | null // Tax assessment year
  parcel_value_type: string | null // Type of parcel value
  
  // Location data
  census_tract: string | null // Census tract identifier
  census_block: string | null // Census block identifier
  qoz_tract: string | null // QOZ tract number
  
  // Data freshness tracking
  last_refresh_date: string | null // When Regrid data was last refreshed (ISO date)
  regrid_updated_at: string | null // When Regrid last updated the data (ISO datetime)
  
  // Owner mailing address
  owner_mailing_address: string | null // Owner's mailing address
  owner_mail_city: string | null // Owner's mailing city
  owner_mail_state: string | null // Owner's mailing state
  owner_mail_zip: string | null // Owner's mailing zip
  
  property_data: Record<string, unknown> | null // Regrid response data
  user_notes: string | null
  tags: string[] | null
  insurance_provider: string | null
  maintenance_history: string | null
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// Database schema type
export type Database = {
  public: {
    Tables: {
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {
      property_stats: {
        Row: {
          user_id: string
          total_properties: number
          states_count: number
          cities_count: number
          avg_latitude: number
          avg_longitude: number
        }
      }
    }
    Functions: {
      search_properties_by_address: {
        Args: {
          search_term: string
          user_id_param: string
        }
        Returns: {
          id: string
          address: string
          city: string
          state: string
          zip_code: string
        }[]
      }
    }
  }
}