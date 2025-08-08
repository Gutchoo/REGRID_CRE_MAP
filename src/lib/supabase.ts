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